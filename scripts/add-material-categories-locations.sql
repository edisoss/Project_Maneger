-- Create material_categories table
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create material_locations table
CREATE TABLE IF NOT EXISTS material_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO material_categories (name, description, is_default) VALUES
('Concrete', 'Concrete and cement products', TRUE),
('Steel', 'Steel bars, beams, and structural steel', TRUE),
('Wood', 'Lumber, plywood, and wood products', TRUE),
('Electrical', 'Wiring, outlets, and electrical components', TRUE),
('Plumbing', 'Pipes, fittings, and plumbing supplies', TRUE),
('Tools', 'Construction tools and equipment', TRUE),
('Hardware', 'Screws, bolts, nails, and fasteners', TRUE),
('Insulation', 'Thermal and sound insulation materials', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default locations
INSERT INTO material_locations (name, description, is_default) VALUES
('Main Warehouse', 'Primary storage facility', TRUE),
('Site Storage', 'On-site temporary storage', TRUE),
('Tool Shed', 'Tools and small equipment storage', TRUE),
('Yard', 'Outdoor storage area', TRUE),
('Office', 'Office supplies and documents', TRUE),
('Vehicle', 'Mobile storage in work vehicles', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Add updated_at trigger for material_categories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_material_categories_updated_at 
    BEFORE UPDATE ON material_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_material_locations_updated_at 
    BEFORE UPDATE ON material_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
