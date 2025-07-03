-- Fix authentication and RLS policies

-- First, ensure the profiles table exists and has proper structure
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    status TEXT NOT NULL DEFAULT 'active',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete other profiles" ON profiles;
DROP POLICY IF EXISTS "authenticated_full_access" ON profiles;

-- Create simple policies for profiles
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Update other tables to have simpler RLS policies
-- Materials
DROP POLICY IF EXISTS "authenticated-all" ON materials;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON materials;

CREATE POLICY "Enable all for authenticated users" ON materials
    FOR ALL USING (auth.role() = 'authenticated');

-- Material Transactions
DROP POLICY IF EXISTS "authenticated-all" ON material_transactions;
DROP POLICY IF EXISTS "authenticated_full_access" ON material_transactions;
DROP POLICY IF EXISTS "Enable read access for all users" ON material_transactions;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON material_transactions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON material_transactions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON material_transactions;

CREATE POLICY "Enable all for authenticated users" ON material_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Workers
DROP POLICY IF EXISTS "authenticated-all" ON workers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON workers;

CREATE POLICY "Enable all for authenticated users" ON workers
    FOR ALL USING (auth.role() = 'authenticated');

-- Projects
DROP POLICY IF EXISTS "authenticated-all" ON projects;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON projects;

CREATE POLICY "Enable all for authenticated users" ON projects
    FOR ALL USING (auth.role() = 'authenticated');

-- Daily Logs
DROP POLICY IF EXISTS "authenticated-all" ON daily_logs;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON daily_logs;

CREATE POLICY "Enable all for authenticated users" ON daily_logs
    FOR ALL USING (auth.role() = 'authenticated');

-- Roles
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON roles;
CREATE POLICY "Enable all for authenticated users" ON roles
    FOR ALL USING (auth.role() = 'authenticated');

-- Skills
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON skills;
CREATE POLICY "Enable all for authenticated users" ON skills
    FOR ALL USING (auth.role() = 'authenticated');

-- Material Categories
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON material_categories;
CREATE POLICY "Enable all for authenticated users" ON material_categories
    FOR ALL USING (auth.role() = 'authenticated');

-- Material Locations
ALTER TABLE material_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON material_locations;
CREATE POLICY "Enable all for authenticated users" ON material_locations
    FOR ALL USING (auth.role() = 'authenticated');

-- Create or replace the trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- Count existing profiles to determine if this is the first user
    SELECT COUNT(*) INTO user_count FROM profiles;
    
    -- Insert new profile
    INSERT INTO public.profiles (id, email, full_name, role, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        CASE WHEN user_count = 0 THEN 'admin' ELSE 'user' END,
        CASE WHEN user_count = 0 THEN TRUE ELSE FALSE END
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;