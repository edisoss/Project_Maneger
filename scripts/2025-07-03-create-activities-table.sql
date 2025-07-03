-- Create activities table to store system activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50),
  variant VARCHAR(20) DEFAULT 'default',
  reference_type VARCHAR(50),
  reference_id UUID,
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Allow authenticated users full access to activities" ON activities
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert some sample activities
INSERT INTO activities (type, title, description, icon, variant, created_by) VALUES
('system', 'System Initialized', 'Construction management system was set up', 'Settings', 'default', 'system'),
('user', 'Welcome', 'Welcome to your construction management dashboard', 'Users', 'default', 'system');
