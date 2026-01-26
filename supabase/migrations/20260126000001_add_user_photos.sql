-- Phase 12A: User Photos Database Schema
-- Adds user_photos table for storing uploaded photos with EXIF metadata

-- =============================================================================
-- 1. Create user_photos table
-- =============================================================================

CREATE TABLE user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Storage info
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),

  -- Image dimensions
  width INTEGER,
  height INTEGER,

  -- EXIF data (stored as JSON for full data, with common fields extracted)
  exif_data JSONB,
  taken_at TIMESTAMPTZ,
  camera_make TEXT,
  camera_model TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,

  -- GPS from EXIF (for auto-suggesting locations)
  exif_latitude DOUBLE PRECISION,
  exif_longitude DOUBLE PRECISION,

  -- User metadata
  title TEXT,
  description TEXT,
  tags TEXT[],

  -- Privacy
  is_public BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. Create indexes for efficient queries
-- =============================================================================

-- User's photos (most common query)
CREATE INDEX user_photos_user_id_idx ON user_photos(user_id);

-- Location's photos
CREATE INDEX user_photos_location_id_idx ON user_photos(location_id);

-- Chronological ordering
CREATE INDEX user_photos_created_at_idx ON user_photos(created_at DESC);
CREATE INDEX user_photos_taken_at_idx ON user_photos(taken_at DESC);

-- Tag filtering with GIN index
CREATE INDEX user_photos_tags_idx ON user_photos USING GIN(tags);

-- Public photos discovery
CREATE INDEX user_photos_public_idx ON user_photos(is_public) WHERE is_public = true;

-- =============================================================================
-- 3. Add updated_at trigger
-- =============================================================================

CREATE TRIGGER user_photos_updated_at BEFORE UPDATE ON user_photos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- 4. Enable Row Level Security
-- =============================================================================

ALTER TABLE user_photos ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. RLS Policies
-- =============================================================================

-- Users can read their own photos
CREATE POLICY "Users can read own photos" ON user_photos
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read public photos
CREATE POLICY "Anyone can read public photos" ON user_photos
  FOR SELECT USING (is_public = true);

-- Users can insert their own photos
CREATE POLICY "Users can insert own photos" ON user_photos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own photos
CREATE POLICY "Users can update own photos" ON user_photos
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own photos
CREATE POLICY "Users can delete own photos" ON user_photos
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- 6. Database Functions
-- =============================================================================

-- Function to get user's storage usage in bytes
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID DEFAULT NULL)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_usage BIGINT;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COALESCE(SUM(file_size), 0)
  INTO v_usage
  FROM user_photos
  WHERE user_id = v_user_id;

  RETURN v_usage;
END;
$$;

-- Function to get photos for a location
CREATE OR REPLACE FUNCTION get_location_photos(
  p_location_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location_id UUID,
  storage_path TEXT,
  filename TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  taken_at TIMESTAMPTZ,
  camera_make TEXT,
  camera_model TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.location_id,
    p.storage_path,
    p.filename,
    p.original_filename,
    p.file_size,
    p.mime_type,
    p.width,
    p.height,
    p.taken_at,
    p.camera_make,
    p.camera_model,
    p.focal_length,
    p.aperture,
    p.shutter_speed,
    p.iso,
    p.title,
    p.description,
    p.tags,
    p.is_public,
    p.created_at
  FROM user_photos p
  WHERE p.location_id = p_location_id
    AND (p.user_id = v_user_id OR p.is_public = true)
  ORDER BY p.taken_at DESC NULLS LAST, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get photo counts per location for current user
CREATE OR REPLACE FUNCTION get_user_location_photo_counts()
RETURNS TABLE (
  location_id UUID,
  photo_count BIGINT
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
    p.location_id,
    COUNT(*)::BIGINT as photo_count
  FROM user_photos p
  WHERE p.user_id = v_user_id
    AND p.location_id IS NOT NULL
  GROUP BY p.location_id;
END;
$$;

-- Function to get user's photos with filtering and sorting
CREATE OR REPLACE FUNCTION get_user_photos(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_location_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  location_id UUID,
  storage_path TEXT,
  filename TEXT,
  original_filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  exif_data JSONB,
  taken_at TIMESTAMPTZ,
  camera_make TEXT,
  camera_model TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  exif_latitude DOUBLE PRECISION,
  exif_longitude DOUBLE PRECISION,
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  location_name TEXT
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
    p.id,
    p.user_id,
    p.location_id,
    p.storage_path,
    p.filename,
    p.original_filename,
    p.file_size,
    p.mime_type,
    p.width,
    p.height,
    p.exif_data,
    p.taken_at,
    p.camera_make,
    p.camera_model,
    p.focal_length,
    p.aperture,
    p.shutter_speed,
    p.iso,
    p.exif_latitude,
    p.exif_longitude,
    p.title,
    p.description,
    p.tags,
    p.is_public,
    p.created_at,
    p.updated_at,
    l.name as location_name
  FROM user_photos p
  LEFT JOIN locations l ON p.location_id = l.id
  WHERE p.user_id = v_user_id
    AND (p_location_id IS NULL OR p.location_id = p_location_id)
    AND (p_tags IS NULL OR p.tags && p_tags)
  ORDER BY
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN p.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN p.created_at END ASC,
    CASE WHEN p_sort_by = 'taken_at' AND p_sort_order = 'desc' THEN p.taken_at END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'taken_at' AND p_sort_order = 'asc' THEN p.taken_at END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'filename' AND p_sort_order = 'asc' THEN p.filename END ASC,
    CASE WHEN p_sort_by = 'filename' AND p_sort_order = 'desc' THEN p.filename END DESC,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to count user's photos (for pagination)
CREATE OR REPLACE FUNCTION count_user_photos(
  p_location_id UUID DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_count BIGINT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)
  INTO v_count
  FROM user_photos p
  WHERE p.user_id = v_user_id
    AND (p_location_id IS NULL OR p.location_id = p_location_id)
    AND (p_tags IS NULL OR p.tags && p_tags);

  RETURN v_count;
END;
$$;
