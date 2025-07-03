-- Add equipment_used column to daily_logs table
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS equipment_used TEXT[] DEFAULT '{}';

-- Update existing records to have empty array instead of null
UPDATE daily_logs 
SET equipment_used = '{}' 
WHERE equipment_used IS NULL;
