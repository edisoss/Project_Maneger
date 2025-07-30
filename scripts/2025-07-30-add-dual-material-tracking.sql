-- Add dual material tracking to daily logs
-- This script updates the materials_used column structure to support both actual and visible quantities

-- Note: This is a data migration script that should be run carefully
-- The materials_used column in daily_logs table will be updated to support the new format:
-- Old format: [{"material_id": "id", "quantity": 10}]
-- New format: [{"material_id": "id", "actual_quantity": 10, "visible_quantity": 8}]

-- For existing records, we'll assume actual_quantity = visible_quantity = quantity
-- This maintains backward compatibility while enabling the new dual tracking feature

-- Add a comment to document the new structure
COMMENT ON COLUMN daily_logs.materials_used IS 'JSON array of materials with dual tracking: [{"material_id": "uuid", "actual_quantity": number, "visible_quantity": number}]. actual_quantity affects inventory, visible_quantity shown to non-admins.';

-- Update material_transactions table to include notes about dual tracking
COMMENT ON COLUMN material_transactions.notes IS 'Transaction notes, may include dual tracking information (Actual: X, Visible: Y)';

-- Create an index on material_transactions for better performance when querying by reference_type
CREATE INDEX IF NOT EXISTS idx_material_transactions_reference_type ON material_transactions(reference_type);

-- Create an index on daily_logs for better performance when querying by date
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);

-- Add a function to help migrate existing data (optional, for manual migration)
CREATE OR REPLACE FUNCTION migrate_materials_used_to_dual_tracking()
RETURNS void AS $$
DECLARE
    log_record RECORD;
    updated_materials_used JSONB;
    material_item JSONB;
BEGIN
    -- Loop through all daily logs that have materials_used
    FOR log_record IN 
        SELECT id, materials_used 
        FROM daily_logs 
        WHERE materials_used IS NOT NULL 
        AND materials_used != '[]'::jsonb
        AND NOT (materials_used::text LIKE '%actual_quantity%')
    LOOP
        -- Initialize the updated materials array
        updated_materials_used := '[]'::jsonb;
        
        -- Process each material in the materials_used array
        FOR material_item IN 
            SELECT * FROM jsonb_array_elements(log_record.materials_used)
        LOOP
            -- Check if this is old format (has 'quantity' but not 'actual_quantity')
            IF material_item ? 'quantity' AND NOT material_item ? 'actual_quantity' THEN
                -- Convert old format to new format
                updated_materials_used := updated_materials_used || jsonb_build_array(
                    jsonb_build_object(
                        'material_id', material_item->>'material_id',
                        'actual_quantity', (material_item->>'quantity')::numeric,
                        'visible_quantity', (material_item->>'quantity')::numeric
                    )
                );
            ELSE
                -- Keep existing format if already updated
                updated_materials_used := updated_materials_used || jsonb_build_array(material_item);
            END IF;
        END LOOP;
        
        -- Update the record with the new format
        UPDATE daily_logs 
        SET materials_used = updated_materials_used 
        WHERE id = log_record.id;
        
        RAISE NOTICE 'Updated daily log % with % materials', log_record.id, jsonb_array_length(updated_materials_used);
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Note: To run the migration, execute: SELECT migrate_materials_used_to_dual_tracking();
-- This function can be dropped after migration is complete
