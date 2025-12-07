-- Add folder path column to photo tables
ALTER TABLE daily_log_photos 
ADD COLUMN IF NOT EXISTS folder_path TEXT;

ALTER TABLE project_photos 
ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- Update existing photos with default folder paths (optional)
UPDATE daily_log_photos 
SET folder_path = 'uncategorized' 
WHERE folder_path IS NULL;

UPDATE project_photos 
SET folder_path = 'uncategorized' 
WHERE folder_path IS NULL;
