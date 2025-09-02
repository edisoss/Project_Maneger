-- Add created_by_user_id column to daily_logs table
-- This will track which user created each daily log

-- Add the column with foreign key reference to auth.users
ALTER TABLE daily_logs 
ADD COLUMN IF NOT EXISTS created_by_user_id UUID;

-- Add foreign key constraint
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'daily_logs_created_by_user_id_fkey' 
        AND table_name = 'daily_logs'
    ) THEN
        ALTER TABLE daily_logs 
        ADD CONSTRAINT daily_logs_created_by_user_id_fkey 
        FOREIGN KEY (created_by_user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_created_by_user_id ON daily_logs(created_by_user_id);

-- Create a function to automatically set the creator when inserting new logs
CREATE OR REPLACE FUNCTION set_daily_log_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the created_by_user_id to the current user if not already set
  IF NEW.created_by_user_id IS NULL THEN
    NEW.created_by_user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set creator on insert
DROP TRIGGER IF EXISTS trigger_set_daily_log_creator ON daily_logs;
CREATE TRIGGER trigger_set_daily_log_creator
  BEFORE INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_log_creator();

-- Update existing logs to have a creator
-- First try to find an admin user from profiles table
DO $$
DECLARE
  admin_user_id UUID;
  any_user_id UUID;
BEGIN
  -- Try to find an admin user from profiles
  SELECT p.id INTO admin_user_id 
  FROM profiles p
  WHERE p.is_admin = true 
  LIMIT 1;
  
  -- If no admin found in profiles, try to find any user from auth.users
  IF admin_user_id IS NULL THEN
    SELECT au.id INTO any_user_id
    FROM auth.users au
    LIMIT 1;
    
    -- Use any available user
    admin_user_id := any_user_id;
  END IF;
  
  -- Update existing logs if we found a user
  IF admin_user_id IS NOT NULL THEN
    UPDATE daily_logs 
    SET created_by_user_id = admin_user_id 
    WHERE created_by_user_id IS NULL;
    
    RAISE NOTICE 'Updated existing daily logs with creator ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No users found to assign as creators for existing logs';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN daily_logs.created_by_user_id IS 'References the user who created this daily log entry';

-- Verify the setup
DO $$
DECLARE
  log_count INTEGER;
  logs_with_creator INTEGER;
BEGIN
  SELECT COUNT(*) INTO log_count FROM daily_logs;
  SELECT COUNT(*) INTO logs_with_creator FROM daily_logs WHERE created_by_user_id IS NOT NULL;
  
  RAISE NOTICE 'Total daily logs: %, Logs with creator: %', log_count, logs_with_creator;
END $$;
