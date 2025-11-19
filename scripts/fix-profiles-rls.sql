-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Allow all authenticated users to VIEW profiles
-- This breaks recursion because it doesn't check any table data, just the auth role.
CREATE POLICY "profiles_select_all" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow users to UPDATE their own profile
CREATE POLICY "profiles_update_own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 3. Allow admins to do EVERYTHING
-- This subquery is safe now because the SELECT policy above allows reading the 'is_admin' column without further checks.
CREATE POLICY "profiles_admin_all" 
ON profiles 
FOR ALL 
TO authenticated 
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid())
);

-- 4. Allow users to INSERT their own profile (for signup)
CREATE POLICY "profiles_insert_own" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
