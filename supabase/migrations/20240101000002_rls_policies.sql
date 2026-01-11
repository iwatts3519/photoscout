-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Locations policies
CREATE POLICY "Users can read own locations" ON locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read public locations" ON locations FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own locations" ON locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON locations FOR DELETE USING (auth.uid() = user_id);

-- Weather alerts policies
CREATE POLICY "Users can manage own alerts" ON weather_alerts FOR ALL USING (auth.uid() = user_id);
