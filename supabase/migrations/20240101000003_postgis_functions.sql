CREATE OR REPLACE FUNCTION locations_near_point(lng FLOAT, lat FLOAT, radius_meters INT)
RETURNS SETOF locations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM locations
  WHERE ST_DWithin(
    coordinates,
    ST_MakePoint(lng, lat)::geography,
    radius_meters
  );
END;
$$ LANGUAGE plpgsql;
