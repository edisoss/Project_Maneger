-- Drop existing table if it exists to start fresh
DROP TABLE IF EXISTS public.material_transactions CASCADE;

-- Create the material_transactions table
CREATE TABLE public.material_transactions (
    id BIGSERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('added', 'used', 'adjusted', 'returned')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_type TEXT,
    reference_id BIGINT,
    project TEXT,
    notes TEXT,
    created_by TEXT DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE public.material_transactions 
ADD CONSTRAINT fk_material_transactions_material_id 
FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX idx_material_transactions_material_id ON public.material_transactions(material_id);
CREATE INDEX idx_material_transactions_created_at ON public.material_transactions(created_at);
CREATE INDEX idx_material_transactions_type ON public.material_transactions(transaction_type);

-- Enable Row Level Security
ALTER TABLE public.material_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.material_transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.material_transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.material_transactions
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.material_transactions
    FOR DELETE USING (true);

-- Grant permissions
GRANT ALL ON public.material_transactions TO authenticated;
GRANT ALL ON public.material_transactions TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.material_transactions_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.material_transactions_id_seq TO anon;

-- Insert sample transaction data for existing materials
INSERT INTO public.material_transactions (material_id, transaction_type, quantity, previous_stock, new_stock, project, notes, created_by, created_at) VALUES
-- Assuming material IDs 1-10 exist, add some sample transactions
(1, 'added', 100, 0, 100, NULL, 'Initial stock', 'Admin', NOW() - INTERVAL '30 days'),
(1, 'used', 25, 100, 75, 'Office Building A', 'Used for network installation', 'John Doe', NOW() - INTERVAL '15 days'),
(1, 'used', 10, 75, 65, 'Office Building A', 'Additional network points', 'John Doe', NOW() - INTERVAL '10 days'),

(2, 'added', 50, 0, 50, NULL, 'Initial stock', 'Admin', NOW() - INTERVAL '25 days'),
(2, 'used', 15, 50, 35, 'Warehouse Security', 'Security camera installation', 'Jane Smith', NOW() - INTERVAL '12 days'),

(3, 'added', 200, 0, 200, NULL, 'Initial stock', 'Admin', NOW() - INTERVAL '20 days'),
(3, 'used', 50, 200, 150, 'Office Building A', 'Electrical wiring', 'Mike Johnson', NOW() - INTERVAL '8 days'),
(3, 'used', 30, 150, 120, 'Warehouse Security', 'Power supply installation', 'Mike Johnson', NOW() - INTERVAL '5 days'),

(4, 'added', 25, 0, 25, NULL, 'Initial stock', 'Admin', NOW() - INTERVAL '18 days'),
(4, 'used', 5, 25, 20, 'Office Building A', 'HVAC control installation', 'Sarah Wilson', NOW() - INTERVAL '7 days'),

(5, 'added', 40, 0, 40, NULL, 'Initial stock', 'Admin', NOW() - INTERVAL '22 days'),
(5, 'used', 8, 40, 32, 'Warehouse Security', 'Fire safety system', 'Tom Brown', NOW() - INTERVAL '6 days');

-- Create or replace the trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update materials table to have proper last_updated field
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for materials table
DROP TRIGGER IF EXISTS update_materials_updated_at ON public.materials;
CREATE TRIGGER update_materials_updated_at
    BEFORE UPDATE ON public.materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing materials to have recent updated_at timestamps
UPDATE public.materials SET updated_at = NOW() WHERE updated_at IS NULL;

COMMIT;
