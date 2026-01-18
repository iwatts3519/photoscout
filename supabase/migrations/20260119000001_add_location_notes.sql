-- Add notes, last_visited, and best_time_to_visit fields to locations table
-- These fields allow users to add detailed annotations to their saved locations

-- Add notes field for longer-form notes and tips about the location
ALTER TABLE locations ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add last_visited field to track when the user last visited this location
ALTER TABLE locations ADD COLUMN IF NOT EXISTS last_visited TIMESTAMPTZ;

-- Add best_time_to_visit field for notes about optimal times to visit
ALTER TABLE locations ADD COLUMN IF NOT EXISTS best_time_to_visit TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN locations.notes IS 'Longer-form notes and tips about this location';
COMMENT ON COLUMN locations.last_visited IS 'When the user last visited this location';
COMMENT ON COLUMN locations.best_time_to_visit IS 'Notes about the best time to visit (e.g., "Golden hour in autumn", "Low tide only")';
