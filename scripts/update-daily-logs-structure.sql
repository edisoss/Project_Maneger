-- Add title column to daily_logs table
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS title VARCHAR(200);

-- Add project_id column and create foreign key relationship
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS project_id INTEGER;

-- Add temperature column
ALTER TABLE daily_logs ADD COLUMN IF NOT EXISTS temperature VARCHAR(50);

-- Create foreign key constraint to projects table
ALTER TABLE daily_logs 
ADD CONSTRAINT fk_daily_logs_project 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Update existing records to have a default title if they don't have one
UPDATE daily_logs 
SET title = 'Daily Work Log - ' || date 
WHERE title IS NULL OR title = '';

-- If there are existing daily_logs with project names but no project_id, 
-- try to match them with existing projects
UPDATE daily_logs 
SET project_id = (
    SELECT p.id 
    FROM projects p 
    WHERE p.name = daily_logs.project 
    LIMIT 1
)
WHERE project_id IS NULL AND project IS NOT NULL;
