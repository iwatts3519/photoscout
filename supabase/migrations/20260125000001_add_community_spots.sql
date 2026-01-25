-- Phase 11A: Community Photo Spots Database Schema
-- Adds visibility system, engagement tracking, favorites, and reports

-- =============================================================================
-- 1. Add visibility enum column to locations (replacing is_public boolean)
-- =============================================================================

-- First, drop the RLS policy that depends on is_public
DROP POLICY IF EXISTS "Users can read public locations" ON locations;

-- Add visibility column with enum-like check constraint
ALTER TABLE locations ADD COLUMN visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('private', 'public', 'unlisted'));

-- Migrate existing is_public values to visibility
UPDATE locations SET visibility = CASE
  WHEN is_public = true THEN 'public'
  ELSE 'private'
END;

-- Drop the old is_public column
ALTER TABLE locations DROP COLUMN is_public;

-- =============================================================================
-- 2. Add engagement tracking columns
-- =============================================================================

ALTER TABLE locations ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN favorite_count INTEGER DEFAULT 0;

-- =============================================================================
-- 3. Create favorites table
-- =============================================================================

CREATE TABLE location_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- Create indexes for efficient queries
CREATE INDEX location_favorites_user_id_idx ON location_favorites(user_id);
CREATE INDEX location_favorites_location_id_idx ON location_favorites(location_id);
CREATE INDEX location_favorites_created_at_idx ON location_favorites(created_at DESC);

-- =============================================================================
-- 4. Create reports table for moderation
-- =============================================================================

CREATE TABLE location_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'spam', 'inaccurate', 'duplicate', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(location_id, reporter_id) -- One report per user per location
);

-- Create indexes
CREATE INDEX location_reports_location_id_idx ON location_reports(location_id);
CREATE INDEX location_reports_status_idx ON location_reports(status);
CREATE INDEX location_reports_created_at_idx ON location_reports(created_at DESC);

-- =============================================================================
-- 5. Enable RLS on new tables
-- =============================================================================

ALTER TABLE location_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_reports ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 6. Update RLS Policies for locations table
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can read own locations" ON locations;
DROP POLICY IF EXISTS "Users can read public locations" ON locations;

-- New policies using visibility column
-- Users can read their own locations (regardless of visibility)
CREATE POLICY "Users can read own locations" ON locations
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read public locations
CREATE POLICY "Anyone can read public locations" ON locations
  FOR SELECT USING (visibility = 'public');

-- Anyone with the link can read unlisted locations (no policy needed - they use direct ID)
-- This is handled by the "Anyone can read public locations" policy not matching,
-- but we'll create a permissive policy for unlisted access via specific spot routes
CREATE POLICY "Anyone can read unlisted locations" ON locations
  FOR SELECT USING (visibility = 'unlisted');

-- =============================================================================
-- 7. RLS Policies for favorites table
-- =============================================================================

-- Users can see their own favorites
CREATE POLICY "Users can read own favorites" ON location_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can insert own favorites" ON location_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can delete own favorites" ON location_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 8. RLS Policies for reports table
-- =============================================================================

-- Users can see their own reports
CREATE POLICY "Users can read own reports" ON location_reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Users can submit reports
CREATE POLICY "Users can insert reports" ON location_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- =============================================================================
-- 9. Database Functions
-- =============================================================================

-- Function to get public locations with coordinates for discovery
CREATE OR REPLACE FUNCTION get_public_locations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'recent',
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  visibility TEXT,
  tags TEXT[],
  best_time_to_visit TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  owner_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.name,
    l.description,
    ST_Y(l.coordinates::geometry) as lat,
    ST_X(l.coordinates::geometry) as lng,
    l.radius_meters,
    l.visibility,
    l.tags,
    l.best_time_to_visit,
    l.view_count,
    l.favorite_count,
    l.created_at,
    l.updated_at,
    COALESCE(p.name, 'Anonymous') as owner_name
  FROM locations l
  LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.visibility = 'public'
    AND (p_tags IS NULL OR l.tags && p_tags)
  ORDER BY
    CASE WHEN p_sort_by = 'recent' THEN l.created_at END DESC,
    CASE WHEN p_sort_by = 'popular' THEN l.favorite_count END DESC,
    CASE WHEN p_sort_by = 'trending' THEN (l.view_count + l.favorite_count * 5) END DESC,
    l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get a single location with coordinates (for spot detail page)
CREATE OR REPLACE FUNCTION get_location_with_coords(p_location_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  visibility TEXT,
  tags TEXT[],
  notes TEXT,
  best_time_to_visit TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  owner_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.name,
    l.description,
    ST_Y(l.coordinates::geometry) as lat,
    ST_X(l.coordinates::geometry) as lng,
    l.radius_meters,
    l.visibility,
    l.tags,
    l.notes,
    l.best_time_to_visit,
    l.view_count,
    l.favorite_count,
    l.created_at,
    l.updated_at,
    COALESCE(p.name, 'Anonymous') as owner_name
  FROM locations l
  LEFT JOIN profiles p ON l.user_id = p.id
  WHERE l.id = p_location_id;
END;
$$;

-- Function to toggle favorite (atomic operation)
CREATE OR REPLACE FUNCTION toggle_location_favorite(p_location_id UUID)
RETURNS TABLE (
  is_favorited BOOLEAN,
  new_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if favorite exists
  SELECT EXISTS(
    SELECT 1 FROM location_favorites
    WHERE user_id = v_user_id AND location_id = p_location_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove favorite
    DELETE FROM location_favorites
    WHERE user_id = v_user_id AND location_id = p_location_id;

    -- Decrement count
    UPDATE locations
    SET favorite_count = GREATEST(0, favorite_count - 1)
    WHERE id = p_location_id
    RETURNING locations.favorite_count INTO v_new_count;

    RETURN QUERY SELECT false, v_new_count;
  ELSE
    -- Add favorite
    INSERT INTO location_favorites (user_id, location_id)
    VALUES (v_user_id, p_location_id);

    -- Increment count
    UPDATE locations
    SET favorite_count = favorite_count + 1
    WHERE id = p_location_id
    RETURNING locations.favorite_count INTO v_new_count;

    RETURN QUERY SELECT true, v_new_count;
  END IF;
END;
$$;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_location_view_count(p_location_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INTEGER;
BEGIN
  UPDATE locations
  SET view_count = view_count + 1
  WHERE id = p_location_id
  RETURNING view_count INTO v_new_count;

  RETURN v_new_count;
END;
$$;

-- Function to get popular tags from public locations
CREATE OR REPLACE FUNCTION get_popular_tags(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  tag TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    unnest(l.tags) as tag,
    COUNT(*) as count
  FROM locations l
  WHERE l.visibility = 'public'
    AND l.tags IS NOT NULL
    AND array_length(l.tags, 1) > 0
  GROUP BY unnest(l.tags)
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$;

-- Function to check if user has favorited a location
CREATE OR REPLACE FUNCTION check_is_favorited(p_location_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS(
    SELECT 1 FROM location_favorites
    WHERE user_id = v_user_id AND location_id = p_location_id
  );
END;
$$;

-- Function to get user's favorited locations
CREATE OR REPLACE FUNCTION get_user_favorites(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  name TEXT,
  description TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_meters INTEGER,
  visibility TEXT,
  tags TEXT[],
  best_time_to_visit TEXT,
  view_count INTEGER,
  favorite_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  owner_name TEXT,
  favorited_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  RETURN QUERY
  SELECT
    l.id,
    l.user_id,
    l.name,
    l.description,
    ST_Y(l.coordinates::geometry) as lat,
    ST_X(l.coordinates::geometry) as lng,
    l.radius_meters,
    l.visibility,
    l.tags,
    l.best_time_to_visit,
    l.view_count,
    l.favorite_count,
    l.created_at,
    l.updated_at,
    COALESCE(p.name, 'Anonymous') as owner_name,
    f.created_at as favorited_at
  FROM location_favorites f
  JOIN locations l ON f.location_id = l.id
  LEFT JOIN profiles p ON l.user_id = p.id
  WHERE f.user_id = v_user_id
    AND l.visibility IN ('public', 'unlisted') -- Only show accessible locations
  ORDER BY f.created_at DESC
  LIMIT p_limit;
END;
$$;
