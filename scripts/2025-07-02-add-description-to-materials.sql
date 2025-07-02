-- Add a “description” text column to materials (nullable for existing rows)
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Make sure the new column shows up in views / policies automatically
-- (no extra steps needed because we use SELECT * in Supabase queries).
