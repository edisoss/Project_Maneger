-- Fix creator persistence issues in daily logs
-- This script ensures that created_by_user_id is never overwritten during updates

-- 1. First, let's check the current state
SELECT 
    id,
    title,
    created_by,
    created_by_user_id,
    created_at,
    updated_at
FROM daily_logs 
WHERE created_by_user_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 2. Drop the existing trigger that might be causing issues
DROP TRIGGER IF EXISTS set_daily_logs_creator ON daily_logs;
DROP FUNCTION IF EXISTS set_daily_logs_creator();

-- 3. Create a new trigger that ONLY sets creator on INSERT, never on UPDATE
CREATE OR REPLACE FUNCTION set_daily_logs_creator_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run on INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Only set created_by_user_id if it's not already provided
        IF NEW.created_by_user_id IS NULL THEN
            -- Try to get the current user from auth.users
            NEW.created_by_user_id := auth.uid();
        END IF;
        
        -- Set legacy created_by field if not provided
        IF NEW.created_by IS NULL OR NEW.created_by = '' THEN
            NEW.created_by := 'admin@company.com';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create the trigger for INSERT only
CREATE TRIGGER set_daily_logs_creator_on_insert
    BEFORE INSERT ON daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION set_daily_logs_creator_on_insert();

-- 5. Verify the trigger was created correctly
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'daily_logs'
AND trigger_name = 'set_daily_logs_creator_on_insert';

-- 6. Check for any logs that might have lost their creator info
SELECT 
    COUNT(*) as logs_without_creator,
    COUNT(CASE WHEN created_by_user_id IS NOT NULL THEN 1 END) as logs_with_user_id,
    COUNT(CASE WHEN created_by = 'admin@company.com' THEN 1 END) as logs_with_legacy_creator
FROM daily_logs;

-- 7. Show recent logs to verify current state
SELECT 
    id,
    title,
    created_by,
    created_by_user_id,
    created_at::date as date_created,
    updated_at::date as date_updated
FROM daily_logs 
ORDER BY created_at DESC
LIMIT 10;

COMMIT;
