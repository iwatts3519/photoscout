-- Phase 13A: Route Planning - Trips Database Schema
-- Enable users to plan multi-location photo shoots with route optimization

-- Create trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trip_date DATE,
  start_time TIME,
  transport_mode TEXT DEFAULT 'driving' CHECK (transport_mode IN ('driving', 'walking', 'cycling')),
  total_distance_meters INTEGER,
  total_duration_seconds INTEGER,
  is_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trip_stops table
CREATE TABLE trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  custom_name TEXT,
  custom_lat FLOAT,
  custom_lng FLOAT,
  stop_order INTEGER NOT NULL,
  planned_arrival TIME,
  planned_duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  distance_to_next_meters INTEGER,
  duration_to_next_seconds INTEGER,
  route_geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX trips_user_id_idx ON trips(user_id);
CREATE INDEX trips_trip_date_idx ON trips(trip_date);
CREATE INDEX trip_stops_trip_id_idx ON trip_stops(trip_id);
CREATE INDEX trip_stops_order_idx ON trip_stops(trip_id, stop_order);
CREATE INDEX trip_stops_location_id_idx ON trip_stops(location_id);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips

-- Users can view their own trips
CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own trips
CREATE POLICY "Users can create own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own trips
CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own trips
CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for trip_stops

-- Users can view stops for their own trips
CREATE POLICY "Users can view own trip stops"
  ON trip_stops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_stops.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can create stops for their own trips
CREATE POLICY "Users can create own trip stops"
  ON trip_stops FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_stops.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can update stops for their own trips
CREATE POLICY "Users can update own trip stops"
  ON trip_stops FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_stops.trip_id
      AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_stops.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Users can delete stops for their own trips
CREATE POLICY "Users can delete own trip stops"
  ON trip_stops FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = trip_stops.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at on trips
CREATE OR REPLACE FUNCTION update_trips_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_updated_at_trigger
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_trips_updated_at();

-- Function to get trip with all stops and location details
CREATE OR REPLACE FUNCTION get_trip_with_stops(p_trip_id UUID)
RETURNS TABLE (
  trip_id UUID,
  trip_name TEXT,
  trip_description TEXT,
  trip_date DATE,
  start_time TIME,
  transport_mode TEXT,
  total_distance_meters INTEGER,
  total_duration_seconds INTEGER,
  is_optimized BOOLEAN,
  trip_created_at TIMESTAMPTZ,
  trip_updated_at TIMESTAMPTZ,
  stop_id UUID,
  location_id UUID,
  location_name TEXT,
  stop_custom_name TEXT,
  stop_lat FLOAT,
  stop_lng FLOAT,
  stop_order INTEGER,
  planned_arrival TIME,
  planned_duration_minutes INTEGER,
  stop_notes TEXT,
  distance_to_next_meters INTEGER,
  duration_to_next_seconds INTEGER,
  route_geometry JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS trip_id,
    t.name AS trip_name,
    t.description AS trip_description,
    t.trip_date,
    t.start_time,
    t.transport_mode,
    t.total_distance_meters,
    t.total_duration_seconds,
    t.is_optimized,
    t.created_at AS trip_created_at,
    t.updated_at AS trip_updated_at,
    ts.id AS stop_id,
    ts.location_id,
    l.name AS location_name,
    ts.custom_name AS stop_custom_name,
    COALESCE(ts.custom_lat, ST_Y(l.coordinates::geometry)) AS stop_lat,
    COALESCE(ts.custom_lng, ST_X(l.coordinates::geometry)) AS stop_lng,
    ts.stop_order,
    ts.planned_arrival,
    ts.planned_duration_minutes,
    ts.notes AS stop_notes,
    ts.distance_to_next_meters,
    ts.duration_to_next_seconds,
    ts.route_geometry
  FROM trips t
  LEFT JOIN trip_stops ts ON ts.trip_id = t.id
  LEFT JOIN locations l ON l.id = ts.location_id
  WHERE t.id = p_trip_id
    AND t.user_id = auth.uid()
  ORDER BY ts.stop_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reorder stops within a trip
CREATE OR REPLACE FUNCTION reorder_trip_stops(
  p_trip_id UUID,
  p_stop_ids UUID[]
)
RETURNS VOID AS $$
DECLARE
  v_index INTEGER := 0;
  v_stop_id UUID;
BEGIN
  -- Verify trip ownership
  IF NOT EXISTS (
    SELECT 1 FROM trips WHERE id = p_trip_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Trip not found or access denied';
  END IF;

  -- Update each stop's order based on array position
  FOREACH v_stop_id IN ARRAY p_stop_ids LOOP
    UPDATE trip_stops
    SET stop_order = v_index
    WHERE id = v_stop_id AND trip_id = p_trip_id;
    v_index := v_index + 1;
  END LOOP;

  -- Update trip's updated_at timestamp
  UPDATE trips SET updated_at = NOW() WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
