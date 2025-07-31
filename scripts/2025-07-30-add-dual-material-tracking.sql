-- Add dual material tracking support to daily_logs table
-- This script updates the materials_used column to support both actual_quantity and visible_quantity

-- First, let's add a comment to document the new structure
COMMENT ON COLUMN daily_logs.materials_used IS 'JSON array containing material usage with dual tracking: [{"material_id": "uuid", "actual_quantity": number, "visible_quantity": number}]. Actual quantity affects inventory, visible quantity shown to non-admins.';

-- Add an index on the materials_used column for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_materials_used ON daily_logs USING GIN (materials_used);

-- Update the material_transactions table to support better notes
ALTER TABLE material_transactions 
ALTER COLUMN notes TYPE TEXT;

-- Add a comment to document the enhanced notes field
COMMENT ON COLUMN material_transactions.notes IS 'Detailed notes about the transaction, including work descriptions for better context';

-- Create a function to help migrate existing data from old format to new format
CREATE OR REPLACE FUNCTION migrate_material_usage_format()
RETURNS void AS $$
DECLARE
    log_record RECORD;
    material_record RECORD;
    updated_materials JSONB := '[]'::jsonb;
BEGIN
    -- Loop through all daily logs that have materials_used
    FOR log_record IN 
        SELECT id, materials_used 
        FROM daily_logs 
        WHERE materials_used IS NOT NULL 
        AND jsonb_array_length(materials_used) > 0
    LOOP
        updated_materials := '[]'::jsonb;
        
        -- Process each material in the materials_used array
        FOR material_record IN 
            SELECT * FROM jsonb_array_elements(log_record.materials_used)
        LOOP
            -- Check if the material already has the new format
            IF material_record.value ? 'actual_quantity' AND material_record.value ? 'visible_quantity' THEN
                -- Already in new format, keep as is
                updated_materials := updated_materials || material_record.value;
            ELSE
                -- Convert from old format to new format
                -- If only 'quantity' exists, use it for both actual and visible
                updated_materials := updated_materials || jsonb_build_object(
                    'material_id', material_record.value->>'material_id',
                    'actual_quantity', COALESCE((material_record.value->>'quantity')::numeric, 0),
                    'visible_quantity', COALESCE((material_record.value->>'quantity')::numeric, 0)
                );
            END IF;
        END LOOP;
        
        -- Update the daily log with the new format
        UPDATE daily_logs 
        SET materials_used = updated_materials 
        WHERE id = log_record.id;
        
        RAISE NOTICE 'Updated daily log % with % materials', log_record.id, jsonb_array_length(updated_materials);
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document the migration function
COMMENT ON FUNCTION migrate_material_usage_format() IS 'Migrates existing materials_used data from old format (quantity) to new format (actual_quantity, visible_quantity)';

-- Create a view to help analyze material usage patterns
CREATE OR REPLACE VIEW material_usage_analysis AS
SELECT 
    dl.id as daily_log_id,
    dl.date,
    dl.project_id,
    p.name as project_name,
    dl.work_description,
    material_usage.material_id,
    m.name as material_name,
    m.unit,
    (material_usage.value->>'actual_quantity')::numeric as actual_quantity,
    (material_usage.value->>'visible_quantity')::numeric as visible_quantity,
    CASE 
        WHEN (material_usage.value->>'actual_quantity')::numeric != (material_usage.value->>'visible_quantity')::numeric 
        THEN true 
        ELSE false 
    END as has_dual_tracking,
    dl.created_at
FROM daily_logs dl
JOIN projects p ON dl.project_id = p.id
CROSS JOIN LATERAL jsonb_array_elements(dl.materials_used) as material_usage
LEFT JOIN materials m ON m.id = (material_usage.value->>'material_id')::uuid
WHERE dl.materials_used IS NOT NULL 
AND jsonb_array_length(dl.materials_used) > 0
ORDER BY dl.date DESC, dl.created_at DESC;

-- Add a comment to document the analysis view
COMMENT ON VIEW material_usage_analysis IS 'Provides detailed analysis of material usage with dual tracking information';

-- Create an index on the date column for better performance in the analysis view
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs (date);

-- Create a function to validate material usage data
CREATE OR REPLACE FUNCTION validate_material_usage(materials_data JSONB)
RETURNS boolean AS $$
DECLARE
    material_item JSONB;
BEGIN
    -- Check if materials_data is a valid JSON array
    IF NOT jsonb_typeof(materials_data) = 'array' THEN
        RETURN false;
    END IF;
    
    -- Validate each material item
    FOR material_item IN SELECT * FROM jsonb_array_elements(materials_data)
    LOOP
        -- Check required fields
        IF NOT (material_item ? 'material_id' AND 
                material_item ? 'actual_quantity' AND 
                material_item ? 'visible_quantity') THEN
            RETURN false;
        END IF;
        
        -- Check that quantities are non-negative numbers
        IF (material_item->>'actual_quantity')::numeric < 0 OR 
           (material_item->>'visible_quantity')::numeric < 0 THEN
            RETURN false;
        END IF;
        
        -- Check that material_id is a valid UUID format
        BEGIN
            PERFORM (material_item->>'material_id')::uuid;
        EXCEPTION WHEN invalid_text_representation THEN
            RETURN false;
        END;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document the validation function
COMMENT ON FUNCTION validate_material_usage(JSONB) IS 'Validates that material usage data follows the correct dual tracking format';

-- Create a trigger to validate materials_used data before insert/update
CREATE OR REPLACE FUNCTION validate_daily_log_materials()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if materials_used is not null and not empty
    IF NEW.materials_used IS NOT NULL AND jsonb_array_length(NEW.materials_used) > 0 THEN
        IF NOT validate_material_usage(NEW.materials_used) THEN
            RAISE EXCEPTION 'Invalid materials_used format. Expected: [{"material_id": "uuid", "actual_quantity": number, "visible_quantity": number}]';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS validate_materials_trigger ON daily_logs;
CREATE TRIGGER validate_materials_trigger
    BEFORE INSERT OR UPDATE ON daily_logs
    FOR EACH ROW
    EXECUTE FUNCTION validate_daily_log_materials();

-- Add helpful comments
COMMENT ON TRIGGER validate_materials_trigger ON daily_logs IS 'Validates materials_used data format before insert/update operations';

-- Create a function to get material usage summary for reporting
CREATE OR REPLACE FUNCTION get_material_usage_summary(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    project_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    material_id UUID,
    material_name TEXT,
    unit TEXT,
    total_actual_quantity NUMERIC,
    total_visible_quantity NUMERIC,
    usage_count BIGINT,
    dual_tracking_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as material_id,
        m.name as material_name,
        m.unit,
        COALESCE(SUM((material_usage.value->>'actual_quantity')::numeric), 0) as total_actual_quantity,
        COALESCE(SUM((material_usage.value->>'visible_quantity')::numeric), 0) as total_visible_quantity,
        COUNT(*) as usage_count,
        SUM(CASE 
            WHEN (material_usage.value->>'actual_quantity')::numeric != (material_usage.value->>'visible_quantity')::numeric 
            THEN 1 
            ELSE 0 
        END) as dual_tracking_count
    FROM daily_logs dl
    CROSS JOIN LATERAL jsonb_array_elements(dl.materials_used) as material_usage
    JOIN materials m ON m.id = (material_usage.value->>'material_id')::uuid
    WHERE dl.materials_used IS NOT NULL 
    AND jsonb_array_length(dl.materials_used) > 0
    AND (start_date IS NULL OR dl.date >= start_date)
    AND (end_date IS NULL OR dl.date <= end_date)
    AND (project_id_filter IS NULL OR dl.project_id = project_id_filter)
    GROUP BY m.id, m.name, m.unit
    ORDER BY total_actual_quantity DESC;
END;
$$ LANGUAGE plpgsql;

-- Add a comment to document the summary function
COMMENT ON FUNCTION get_material_usage_summary(DATE, DATE, UUID) IS 'Returns material usage summary with dual tracking statistics for a given date range and optional project filter';

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON material_usage_analysis TO your_read_only_role;
-- GRANT EXECUTE ON FUNCTION get_material_usage_summary(DATE, DATE, UUID) TO your_reporting_role;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '=== Dual Material Tracking Setup Complete ===';
    RAISE NOTICE 'Schema updated successfully with dual tracking support';
    RAISE NOTICE 'Run migrate_material_usage_format() to convert existing data';
    RAISE NOTICE 'Use material_usage_analysis view for reporting';
    RAISE NOTICE 'Use get_material_usage_summary() function for summaries';
END $$;
