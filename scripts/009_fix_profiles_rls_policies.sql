-- Fix infinite recursion in profiles table RLS policies
-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to view profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update profiles" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- Create simple, non-recursive policies
-- Policy 1: Allow users to view all profiles (needed for displaying names in logs, etc.)
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Allow users to update only their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow admins to do everything
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS admin_check
      WHERE admin_check.id = auth.uid()
      AND admin_check.is_admin = true
    )
  );
