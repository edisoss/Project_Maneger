-- Fix RLS policies for material_categories and material_locations tables
-- This script addresses the "new row violates row-level security policy" error

-- Enable RLS on material_categories table (if not already enabled)
ALTER TABLE material_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read material_categories" ON material_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert material_categories" ON material_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update material_categories" ON material_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete material_categories" ON material_categories;

-- Create new policies for material_categories
CREATE POLICY "Allow authenticated users to read material_categories" 
ON material_categories FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert material_categories" 
ON material_categories FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update material_categories" 
ON material_categories FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete material_categories" 
ON material_categories FOR DELETE 
TO authenticated 
USING (true);

-- Enable RLS on material_locations table (if not already enabled)
ALTER TABLE material_locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read material_locations" ON material_locations;
DROP POLICY IF EXISTS "Allow authenticated users to insert material_locations" ON material_locations;
DROP POLICY IF EXISTS "Allow authenticated users to update material_locations" ON material_locations;
DROP POLICY IF EXISTS "Allow authenticated users to delete material_locations" ON material_locations;

-- Create new policies for material_locations
CREATE POLICY "Allow authenticated users to read material_locations" 
ON material_locations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert material_locations" 
ON material_locations FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update material_locations" 
ON material_locations FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete material_locations" 
ON material_locations FOR DELETE 
TO authenticated 
USING (true);

-- Create default categories if they don't exist
INSERT INTO material_categories (name, description) VALUES
  ('Concrete', 'Concrete materials and related products'),
  ('Steel', 'Steel materials and reinforcement'),
  ('Tools', 'Construction tools and equipment'),
  ('Electrical', 'Electrical components and wiring'),
  ('Plumbing', 'Plumbing materials and fixtures'),
  ('Lumber', 'Wood materials and lumber'),
  ('Hardware', 'Bolts, screws, and hardware'),
  ('Safety', 'Safety equipment and materials')
ON CONFLICT (name) DO NOTHING;

-- Create default locations if they don't exist (preserve existing ones)
INSERT INTO material_locations (name, description, address) VALUES
  ('Main Warehouse', 'Primary storage facility', 'Main construction site'),
  ('Site Storage', 'On-site material storage', 'Construction site location'),
  ('Tool Shed', 'Tool and equipment storage', 'Site tool storage area')
ON CONFLICT (name) DO NOTHING;

-- Verify the setup
SELECT 'Categories created:' as info, count(*) as count FROM material_categories;
SELECT 'Locations created:' as info, count(*) as count FROM material_locations;
