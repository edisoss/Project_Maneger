-- Fix: Set all existing materials without project_id to NULL (central storage)
-- This ensures all previously added materials appear in Central Storage

UPDATE materials 
SET project_id = NULL 
WHERE project_id IS NULL OR project_id = '';

-- Also ensure any orphaned materials (with non-existent project_ids) go to storage
UPDATE materials 
SET project_id = NULL 
WHERE project_id NOT IN (SELECT id FROM projects);

-- Add comment
COMMENT ON COLUMN materials.project_id IS 'NULL = Central Storage, otherwise assigned to project';
