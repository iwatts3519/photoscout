-- Function to get locations with extracted lat/lng coordinates
CREATE OR REPLACE FUNCTION get_locations_with_coords(location_ids UUID[])
RETURNS TABLE (
  id UUID,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    locations.id,
    ST_Y(locations.coordinates::geometry) as lat,
    ST_X(locations.coordinates::geometry) as lng
  FROM locations
  WHERE locations.id = ANY(location_ids);
END;
$$ LANGUAGE plpgsql;
