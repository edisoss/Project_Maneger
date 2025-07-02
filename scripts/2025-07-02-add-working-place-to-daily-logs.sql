-- Add working_place column to daily_logs table
ALTER TABLE daily_logs 
ADD COLUMN working_place TEXT;

-- Add comment to the column
COMMENT ON COLUMN daily_logs.working_place IS 'Location or place where the work was performed';
