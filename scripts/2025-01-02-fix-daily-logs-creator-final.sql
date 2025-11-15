-- Fix daily logs creator information
-- This script ensures all daily logs have proper creator information

-- First, let's check the current state
SELECT 
    id,
    date,
    created_by,
    created_by_user_id,
    created_at
FROM daily_logs 
WHERE created_by_user_id IS NULL 
ORDER BY created_at DESC
LIMIT 10;

-- Update daily logs that have NULL created_by_user_id
-- Try to match with existing profiles based on email or other criteria
UPDATE daily_logs 
SET created_by_user_id = (
    SELECT p.id 
    FROM profiles p 
    WHERE p.email = 'admin@company.com' 
    LIMIT 1
)
WHERE created_by_user_id IS NULL 
AND created_by = 'admin@company.com';

-- For any remaining NULL values, we'll leave them as NULL
-- The application will handle these gracefully by showing "Unknown User"

-- Verify the fix
SELECT 
    COUNT(*) as total_logs,
    COUNT(created_by_user_id) as logs_with_user_id,
    COUNT(*) - COUNT(created_by_user_id) as logs_without_user_id
FROM daily_logs;

-- Show sample of fixed logs
SELECT 
    dl.id,
    dl.date,
    dl.created_by,
    dl.created_by_user_id,
    p.full_name,
    p.email
FROM daily_logs dl
LEFT JOIN profiles p ON dl.created_by_user_id = p.id
ORDER BY dl.created_at DESC
LIMIT 5;
