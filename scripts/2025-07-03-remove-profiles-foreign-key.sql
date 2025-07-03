-- Remove the foreign key constraint from profiles table
-- This allows us to create profile records without requiring auth users

-- First, drop the foreign key constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make sure the id column is still a UUID type but not constrained to auth.users
-- The profiles table can now store any UUID as the primary key
