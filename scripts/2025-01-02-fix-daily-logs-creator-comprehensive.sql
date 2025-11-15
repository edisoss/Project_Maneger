-- Comprehensive fix for daily logs creator information
-- This script addresses all aspects of the creator tracking issue

-- Step 1: Check current state
DO $$
DECLARE
    total_logs INTEGER;
    logs_with_creator INTEGER;
    logs_without_creator INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_logs FROM daily_logs;
    SELECT COUNT(*) INTO logs_with_creator FROM daily_logs WHERE created_by_user_id IS NOT NULL;
    logs_without_creator := total_logs - logs_with_creator;
    
    RAISE NOTICE 'Current state: Total logs: %, With creator: %, Without creator: %', 
        total_logs, logs_with_creator, logs_without_creator;
END $$;

-- Step 2: Create or update the trigger function to ensure created_by_user_id is set on INSERT only
CREATE OR REPLACE FUNCTION set_daily_log_creator()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set created_by_user_id on INSERT, never on UPDATE
  IF TG_OP = 'INSERT' THEN
    -- Set the created_by_user_id to the current user if not already set
    IF NEW.created_by_user_id IS NULL THEN
      NEW.created_by_user_id := auth.uid();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Drop and recreate the trigger to ensure it only fires on INSERT
DROP TRIGGER IF EXISTS trigger_set_daily_log_creator ON daily_logs;
CREATE TRIGGER trigger_set_daily_log_creator
  BEFORE INSERT ON daily_logs
  FOR EACH ROW
  EXECUTE FUNCTION set_daily_log_creator();

-- Step 4: Add a constraint to prevent created_by_user_id from being NULL on new records
-- But first, let's handle existing NULL values

-- Step 5: For existing logs without creator, try to assign to admin user
UPDATE daily_logs 
SET created_by_user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'admin@company.com' 
    LIMIT 1
)
WHERE created_by_user_id IS NULL 
AND EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = 'admin@company.com'
);

-- Step 6: If no admin user exists, create a system user entry in profiles
INSERT INTO profiles (id, email, full_name, role, is_admin, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'system@construction.local',
    'System User',
    'system',
    false,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE email = 'system@construction.local'
);

-- Step 7: Update remaining NULL creator logs to system user
UPDATE daily_logs 
SET created_by_user_id = (
    SELECT id 
    FROM profiles 
    WHERE email = 'system@construction.local' 
    LIMIT 1
)
WHERE created_by_user_id IS NULL;

-- Step 8: Add a check constraint to prevent future NULL values (optional)
-- ALTER TABLE daily_logs ADD CONSTRAINT daily_logs_creator_not_null 
-- CHECK (created_by_user_id IS NOT NULL);

-- Step 9: Verify the fix
DO $$
DECLARE
    total_logs INTEGER;
    logs_with_creator INTEGER;
    logs_without_creator INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_logs FROM daily_logs;
    SELECT COUNT(*) INTO logs_with_creator FROM daily_logs WHERE created_by_user_id IS NOT NULL;
    logs_without_creator := total_logs - logs_with_creator;
    
    RAISE NOTICE 'After fix: Total logs: %, With creator: %, Without creator: %', 
        total_logs, logs_with_creator, logs_without_creator;
END $$;

-- Step 10: Show sample of logs with creator information
SELECT 
    dl.id,
    dl.date,
    dl.title,
    dl.created_by,
    dl.created_by_user_id,
    COALESCE(p.full_name, p.email, 'Unknown User') as creator_name,
    dl.created_at
FROM daily_logs dl
LEFT JOIN profiles p ON dl.created_by_user_id = p.id
ORDER BY dl.created_at DESC
LIMIT 10;

-- Step 11: Create an index on created_by_user_id for better performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_created_by_user_id 
ON daily_logs(created_by_user_id);

COMMIT;
