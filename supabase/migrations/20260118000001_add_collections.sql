-- Add collections table for organizing saved locations
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#10b981',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add collection_id to locations table
ALTER TABLE locations ADD COLUMN collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Create indexes for efficient queries
CREATE INDEX collections_user_id_idx ON collections(user_id);
CREATE INDEX locations_collection_id_idx ON locations(collection_id);

-- Enable RLS on collections table
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS policies for collections
CREATE POLICY "Users can read own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for collections
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
