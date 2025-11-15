-- Add project_id column to materials table for project-based inventory tracking
-- NULL project_id means material is in central storage
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_materials_project_id ON materials(project_id);

-- Add comment for clarity
COMMENT ON COLUMN materials.project_id IS 'Project assignment - NULL indicates material is in central storage';

-- Create material_transfers table to track material movements between projects and storage
CREATE TABLE IF NOT EXISTS material_transfers (
  id SERIAL PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  from_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  to_project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  transfer_type VARCHAR(50) NOT NULL CHECK (transfer_type IN ('assign', 'transfer', 'to_storage', 'from_storage')),
  notes TEXT,
  transferred_by VARCHAR(255),
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for material transfers
CREATE INDEX IF NOT EXISTS idx_material_transfers_material_id ON material_transfers(material_id);
CREATE INDEX IF NOT EXISTS idx_material_transfers_from_project ON material_transfers(from_project_id);
CREATE INDEX IF NOT EXISTS idx_material_transfers_to_project ON material_transfers(to_project_id);

-- Enable RLS on material_transfers
ALTER TABLE material_transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones (PostgreSQL doesn't support IF NOT EXISTS for policies)
DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON material_transfers;
DROP POLICY IF EXISTS "Allow authenticated users to create transfers" ON material_transfers;

-- Create policy for authenticated users to view all transfers
CREATE POLICY "Allow authenticated users to view transfers"
  ON material_transfers FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for authenticated users to create transfers
CREATE POLICY "Allow authenticated users to create transfers"
  ON material_transfers FOR INSERT
  TO authenticated
  WITH CHECK (true);
