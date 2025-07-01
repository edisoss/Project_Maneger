-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO roles (name, description, is_default) VALUES
('Foreman', 'Site supervisor and team leader', true),
('Electrician', 'Electrical systems installation and maintenance', true),
('Plumber', 'Plumbing and water systems specialist', true),
('Carpenter', 'Wood construction and finishing work', true),
('Mason', 'Concrete, brick, and stone work', true),
('Roofer', 'Roofing installation and repair', true),
('HVAC Technician', 'Heating, ventilation, and air conditioning', true),
('General Laborer', 'General construction support work', true),
('Heavy Equipment Operator', 'Operation of construction machinery', true),
('Safety Inspector', 'Site safety compliance and inspection', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default skills
INSERT INTO skills (name, description, category, is_default) VALUES
('Blueprint Reading', 'Ability to read and interpret construction drawings', 'Technical', true),
('Welding', 'Metal joining and fabrication skills', 'Technical', true),
('Concrete Work', 'Concrete mixing, pouring, and finishing', 'Construction', true),
('Electrical Wiring', 'Installation of electrical systems', 'Technical', true),
('Plumbing Installation', 'Installation of water and drainage systems', 'Technical', true),
('Framing', 'Wood and steel frame construction', 'Construction', true),
('Drywall Installation', 'Interior wall finishing', 'Construction', true),
('Painting', 'Interior and exterior painting', 'Finishing', true),
('Tile Work', 'Ceramic and stone tile installation', 'Finishing', true),
('Safety Protocols', 'Knowledge of construction safety procedures', 'Safety', true),
('Equipment Operation', 'Operation of construction equipment', 'Equipment', true),
('Project Management', 'Planning and coordination of construction projects', 'Management', true),
('Quality Control', 'Inspection and quality assurance', 'Management', true),
('Site Preparation', 'Land clearing and site setup', 'Construction', true),
('Roofing', 'Roof installation and repair techniques', 'Construction', true)
ON CONFLICT (name) DO NOTHING;
