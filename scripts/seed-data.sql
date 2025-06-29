-- Insert sample materials
INSERT INTO public.materials (name, category, current_stock, min_stock, unit, location, status) VALUES
('Cat6 Ethernet Cable', 'Network', 500, 50, 'meters', 'Warehouse A', 'In Stock'),
('Security Camera (IP)', 'Security', 25, 5, 'pieces', 'Warehouse A', 'In Stock'),
('Access Control Reader', 'Security', 12, 3, 'pieces', 'Warehouse B', 'In Stock'),
('BMS Controller', 'BMS', 8, 2, 'pieces', 'Office', 'In Stock'),
('Temperature Sensor', 'BMS', 45, 10, 'pieces', 'Warehouse A', 'In Stock'),
('HVAC Damper Actuator', 'HVAC', 15, 3, 'pieces', 'Warehouse B', 'In Stock'),
('Fire Alarm Panel', 'Fire Safety', 3, 1, 'pieces', 'Office', 'In Stock'),
('Smoke Detector', 'Fire Safety', 80, 15, 'pieces', 'Warehouse A', 'In Stock'),
('Electrical Conduit', 'Electrical', 200, 25, 'meters', 'Site Storage', 'In Stock'),
('Junction Box', 'Electrical', 60, 10, 'pieces', 'Site Storage', 'In Stock'),
('Concrete Mix', 'Concrete', 100, 20, 'bags', 'Site Storage', 'In Stock'),
('Steel Rebar', 'Steel', 150, 30, 'pieces', 'Site Storage', 'In Stock'),
('Power Drill', 'Tools', 8, 2, 'pieces', 'Tool Shed', 'In Stock'),
('Wire Strippers', 'Tools', 12, 3, 'pieces', 'Tool Shed', 'In Stock'),
('Network Switch 24-port', 'Network', 6, 2, 'pieces', 'Warehouse A', 'Low Stock');

-- Insert sample projects
INSERT INTO public.projects (name, description, status, start_date, end_date, budget, progress) VALUES
('Office Building Security System', 'Complete security system installation with cameras, access control, and alarms', 'In Progress', '2024-01-15', '2024-06-30', 150000.00, 45),
('Hospital BMS Installation', 'Building Management System for climate control and energy monitoring', 'In Progress', '2024-02-01', '2024-08-15', 200000.00, 30),
('School Network Cabling', 'Structured cabling installation for entire school campus', 'Planning', '2024-03-01', '2024-07-31', 75000.00, 10),
('Warehouse HVAC System', 'Complete HVAC system installation and automation', 'Completed', '2023-10-01', '2024-01-31', 120000.00, 100),
('Hotel Fire Safety System', 'Fire detection and suppression system installation', 'In Progress', '2024-01-20', '2024-05-30', 95000.00, 60);

-- Insert sample workers
INSERT INTO public.workers (name, email, phone, role, skills, status, hire_date, hourly_rate) VALUES
('John Smith', 'john.smith@company.com', '+1-555-0101', 'Project Manager', '{"Project Management", "Team Leadership", "Budget Planning"}', 'Active', '2020-03-15', 45.00),
('Sarah Johnson', 'sarah.johnson@company.com', '+1-555-0102', 'Network Technician', '{"Network Installation", "Cable Management", "Switch Configuration"}', 'Active', '2021-06-20', 35.00),
('Mike Davis', 'mike.davis@company.com', '+1-555-0103', 'Security Specialist', '{"CCTV Installation", "Access Control", "Security Systems"}', 'Active', '2019-11-10', 38.00),
('Emily Chen', 'emily.chen@company.com', '+1-555-0104', 'BMS Technician', '{"Building Automation", "HVAC Controls", "Energy Management"}', 'Active', '2022-01-08', 40.00),
('David Wilson', 'david.wilson@company.com', '+1-555-0105', 'Electrician', '{"Electrical Installation", "Conduit Running", "Panel Wiring"}', 'Active', '2020-09-12', 42.00),
('Lisa Brown', 'lisa.brown@company.com', '+1-555-0106', 'Fire Safety Technician', '{"Fire Alarm Systems", "Sprinkler Installation", "Safety Compliance"}', 'Active', '2021-04-25', 37.00),
('Robert Taylor', 'robert.taylor@company.com', '+1-555-0107', 'HVAC Technician', '{"HVAC Installation", "Ductwork", "Climate Control"}', 'Active', '2019-07-30', 39.00),
('Jennifer Martinez', 'jennifer.martinez@company.com', '+1-555-0108', 'Assistant Technician', '{"General Labor", "Tool Management", "Site Preparation"}', 'Active', '2023-02-14', 28.00);

-- Insert sample daily logs
INSERT INTO public.daily_logs (date, project, work_description, workers_present, hours_worked, materials_used, notes, weather, status, created_by) VALUES
('2024-01-15', 'Office Building Security System', 'Installed security cameras on first floor', '["Mike Davis", "Jennifer Martinez"]', 8.0, '[{"material_id": 2, "material_name": "Security Camera (IP)", "quantity": 8, "unit": "pieces"}]', 'All cameras tested and working properly', 'Clear', 'Completed', 'mike.davis@company.com'),
('2024-01-16', 'Office Building Security System', 'Ran network cables for security system', '["Sarah Johnson", "David Wilson"]', 8.0, '[{"material_id": 1, "material_name": "Cat6 Ethernet Cable", "quantity": 150, "unit": "meters"}, {"material_id": 9, "material_name": "Electrical Conduit", "quantity": 50, "unit": "meters"}]', 'Cable runs completed for first floor', 'Partly Cloudy', 'Completed', 'sarah.johnson@company.com'),
('2024-01-17', 'Hospital BMS Installation', 'Installed temperature sensors in patient rooms', '["Emily Chen", "Robert Taylor"]', 8.0, '[{"material_id": 5, "material_name": "Temperature Sensor", "quantity": 12, "unit": "pieces"}]', 'Sensors calibrated and connected to BMS', 'Clear', 'Completed', 'emily.chen@company.com'),
('2024-01-18', 'Office Building Security System', 'Installed access control readers at main entrances', '["Mike Davis", "David Wilson"]', 7.5, '[{"material_id": 3, "material_name": "Access Control Reader", "quantity": 4, "unit": "pieces"}, {"material_id": 1, "material_name": "Cat6 Ethernet Cable", "quantity": 80, "unit": "meters"}]', 'All readers tested and integrated with main system', 'Light Rain', 'Completed', 'mike.davis@company.com'),
('2024-01-19', 'Hotel Fire Safety System', 'Installed smoke detectors in guest rooms', '["Lisa Brown", "Jennifer Martinez"]', 8.0, '[{"material_id": 8, "material_name": "Smoke Detector", "quantity": 25, "unit": "pieces"}]', 'All detectors tested and connected to fire panel', 'Clear', 'Completed', 'lisa.brown@company.com');

-- Insert sample material transactions
INSERT INTO public.material_transactions (material_id, transaction_type, quantity, previous_stock, new_stock, reference_type, reference_id, project, notes, created_by) VALUES
-- Initial stock entries
(1, 'added', 500, 0, 500, 'initial_stock', NULL, NULL, 'Initial inventory stock', 'admin@company.com'),
(2, 'added', 25, 0, 25, 'initial_stock', NULL, NULL, 'Initial inventory stock', 'admin@company.com'),
(3, 'added', 12, 0, 12, 'initial_stock', NULL, NULL, 'Initial inventory stock', 'admin@company.com'),
(4, 'added', 8, 0, 8, 'initial_stock', NULL, NULL, 'Initial inventory stock', 'admin@company.com'),
(5, 'added', 45, 0, 45, 'initial_stock', NULL, NULL, 'Initial inventory stock', 'admin@company.com'),
-- Usage from daily logs
(2, 'used', 8, 25, 17, 'daily_log', 1, 'Office Building Security System', 'Used for first floor camera installation', 'mike.davis@company.com'),
(1, 'used', 150, 500, 350, 'daily_log', 2, 'Office Building Security System', 'Network cable for security system', 'sarah.johnson@company.com'),
(9, 'used', 50, 200, 150, 'daily_log', 2, 'Office Building Security System', 'Conduit for cable protection', 'sarah.johnson@company.com'),
(5, 'used', 12, 45, 33, 'daily_log', 3, 'Hospital BMS Installation', 'Temperature sensors for patient rooms', 'emily.chen@company.com'),
(3, 'used', 4, 12, 8, 'daily_log', 4, 'Office Building Security System', 'Access control readers for main entrances', 'mike.davis@company.com'),
(1, 'used', 80, 350, 270, 'daily_log', 4, 'Office Building Security System', 'Network cable for access control', 'mike.davis@company.com'),
(8, 'used', 25, 80, 55, 'daily_log', 5, 'Hotel Fire Safety System', 'Smoke detectors for guest rooms', 'lisa.brown@company.com');
