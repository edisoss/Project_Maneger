-- Create activities table for tracking system activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('project', 'worker', 'material', 'daily_log', 'user', 'system')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  variant TEXT DEFAULT 'default' CHECK (variant IN ('default', 'secondary', 'destructive', 'outline')),
  reference_type TEXT,
  reference_id TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read all activities
CREATE POLICY "Users can view all activities" ON activities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert activities
CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_reference ON activities(reference_type, reference_id);

-- Insert some sample activities
INSERT INTO activities (type, title, description, icon, variant, created_by) VALUES
('system', 'System Initialized', 'Construction management system has been set up successfully', 'Settings', 'default', 'system'),
('system', 'Database Ready', 'All database tables and relationships have been created', 'Database', 'default', 'system'),
('system', 'Activities Tracking Enabled', 'Real-time activity tracking is now active', 'Activity', 'default', 'system');
