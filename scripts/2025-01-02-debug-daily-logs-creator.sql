-- Debug script to check daily logs creator setup
-- This will help us understand the current state of the database

-- Check if the created_by_user_id column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'daily_logs' AND column_name = 'created_by_user_id';

-- Check foreign key constraints on daily_logs table
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'daily_logs';

-- Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_set_daily_log_creator';

-- Check current daily logs and their creators
SELECT 
    dl.id,
    dl.date,
    dl.title,
    dl.created_by,
    dl.created_by_user_id,
    p.full_name as profile_name,
    p.email as profile_email,
    au.email as auth_email
FROM daily_logs dl
LEFT JOIN profiles p ON p.id = dl.created_by_user_id
LEFT JOIN auth.users au ON au.id = dl.created_by_user_id
ORDER BY dl.created_at DESC
LIMIT 10;

-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Count users in different tables
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM profiles) as profiles_count,
    (SELECT COUNT(*) FROM daily_logs WHERE created_by_user_id IS NOT NULL) as logs_with_creator;
