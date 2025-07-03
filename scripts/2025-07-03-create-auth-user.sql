-- Script to create the auth user for osseduards98@gmail.com
-- This should be run after the profiles table is created

-- First, let's create the auth user
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'osseduards98@gmail.com',
    crypt('Langusts1#', gen_salt('bf')),
    NOW(),
    NULL,
    '',
    NULL,
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Eduardo"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
) ON CONFLICT (email) DO NOTHING;

-- Then create/update the profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_admin,
    password
) 
SELECT 
    u.id,
    'osseduards98@gmail.com',
    'Eduardo',
    'admin',
    TRUE,
    'Langusts1#'
FROM auth.users u 
WHERE u.email = 'osseduards98@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_admin = EXCLUDED.is_admin,
    password = EXCLUDED.password,
    updated_at = NOW();
