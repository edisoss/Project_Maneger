-- Insert sample materials
INSERT INTO public.materials (name, category, current_stock, min_stock, unit, location, status) VALUES
('Portland Cement', 'Cement', 50, 10, 'bags', 'Warehouse A', 'In Stock'),
('Rebar #4', 'Steel', 200, 50, 'pieces', 'Yard B', 'In Stock'),
('Concrete Mix', 'Concrete', 30, 15, 'cubic yards', 'Warehouse A', 'In Stock'),
('Lumber 2x4x8', 'Wood', 100, 25, 'pieces', 'Lumber Yard', 'In Stock'),
('Plywood 4x8', 'Wood', 40, 10, 'sheets', 'Lumber Yard', 'In Stock'),
('Roofing Shingles', 'Roofing', 25, 5, 'bundles', 'Warehouse C', 'In Stock'),
('Drywall 4x8', 'Interior', 60, 20, 'sheets', 'Warehouse B', 'In Stock'),
('Paint - White', 'Paint', 15, 5, 'gallons', 'Paint Storage', 'In Stock'),
('Electrical Wire 12AWG', 'Electrical', 500, 100, 'feet', 'Electrical Room', 'In Stock'),
('PVC Pipe 4inch', 'Plumbing', 80, 20, 'pieces', 'Plumbing Storage', 'In Stock'),
('Insulation Batts', 'Insulation', 35, 10, 'rolls', 'Warehouse B', 'In Stock'),
('Brick - Red', 'Masonry', 1000, 200, 'pieces', 'Yard A', 'In Stock'),
('Sand', 'Aggregate', 20, 5, 'tons', 'Yard C', 'In Stock'),
('Gravel', 'Aggregate', 15, 3, 'tons', 'Yard C', 'In Stock'),
('Nails - Framing', 'Hardware', 50, 10, 'pounds', 'Tool Storage', 'In Stock');

-- Insert sample workers (without hourly_rate)
INSERT INTO public.workers (name, email, phone, role, skills, status, hire_date) VALUES
('John Smith', 'john.smith@company.com', '555-0101', 'Foreman', ARRAY['Leadership', 'Project Management', 'Safety'], 'Active', '2023-01-15'),
('Maria Garcia', 'maria.garcia@company.com', '555-0102', 'Carpenter', ARRAY['Framing', 'Finish Work', 'Blueprint Reading'], 'Active', '2023-02-01'),
('David Johnson', 'david.johnson@company.com', '555-0103', 'Electrician', ARRAY['Wiring', 'Panel Installation', 'Code Compliance'], 'Active', '2023-01-20'),
('Sarah Wilson', 'sarah.wilson@company.com', '555-0104', 'Plumber', ARRAY['Pipe Installation', 'Fixture Setup', 'Troubleshooting'], 'Active', '2023-03-10'),
('Mike Brown', 'mike.brown@company.com', '555-0105', 'Mason', ARRAY['Bricklaying', 'Stone Work', 'Concrete'], 'Active', '2023-02-15'),
('Lisa Davis', 'lisa.davis@company.com', '555-0106', 'Painter', ARRAY['Interior Painting', 'Exterior Painting', 'Surface Prep'], 'Active', '2023-04-01'),
('Robert Miller', 'robert.miller@company.com', '555-0107', 'Roofer', ARRAY['Shingle Installation', 'Leak Repair', 'Safety'], 'Active', '2023-01-30'),
('Jennifer Taylor', 'jennifer.taylor@company.com', '555-0108', 'Drywall Specialist', ARRAY['Hanging', 'Taping', 'Texturing'], 'Active', '2023-03-20');

-- Insert sample projects (without budget)
INSERT INTO public.projects (name, description, status, start_date, end_date, progress) VALUES
('Residential Complex A', 'Construction of 24-unit residential complex with modern amenities', 'In Progress', '2024-01-15', '2024-12-15', 35),
('Office Building Downtown', 'Five-story office building with retail space on ground floor', 'In Progress', '2024-02-01', '2025-01-30', 20),
('School Renovation', 'Complete renovation of elementary school including new classrooms', 'Planning', '2024-04-01', '2024-08-30', 5),
('Shopping Center Phase 1', 'First phase of new shopping center development', 'In Progress', '2024-01-01', '2024-10-31', 45),
('Bridge Repair Project', 'Structural repairs and maintenance of city bridge', 'Completed', '2023-11-01', '2024-01-15', 100),
('Warehouse Expansion', 'Expansion of existing warehouse facility', 'Planning', '2024-05-01', '2024-09-30', 0);

-- Insert sample daily logs
INSERT INTO public.daily_logs (date, project, work_description, workers_present, hours_worked, materials_used, notes, weather, status, created_by) VALUES
('2024-01-15', 'Residential Complex A', 'Foundation excavation and concrete pouring for Building A', 
 ARRAY['John Smith', 'Mike Brown', 'David Johnson'], 8.5,
 '[{"material_id": 3, "material_name": "Concrete Mix", "quantity": 5, "unit": "cubic yards"}]',
 'Good progress on foundation work. Weather conditions favorable.', 'Sunny', 'Completed', 'john.smith@company.com'),

('2024-01-16', 'Office Building Downtown', 'Steel frame installation on second floor',
 ARRAY['John Smith', 'Maria Garcia', 'Robert Miller'], 8.0,
 '[{"material_id": 2, "material_name": "Rebar #4", "quantity": 25, "unit": "pieces"}]',
 'Steel frame progressing well. Safety protocols followed.', 'Cloudy', 'Completed', 'john.smith@company.com'),

('2024-01-17', 'Residential Complex A', 'Framing work on first floor units 1-4',
 ARRAY['Maria Garcia', 'Mike Brown'], 7.5,
 '[{"material_id": 4, "material_name": "Lumber 2x4x8", "quantity": 20, "unit": "pieces"}, {"material_id": 15, "material_name": "Nails - Framing", "quantity": 5, "unit": "pounds"}]',
 'Framing ahead of schedule. Quality inspections passed.', 'Partly Cloudy', 'Completed', 'maria.garcia@company.com'),

('2024-01-18', 'Shopping Center Phase 1', 'Electrical rough-in for retail spaces',
 ARRAY['David Johnson', 'Sarah Wilson'], 8.0,
 '[{"material_id": 9, "material_name": "Electrical Wire 12AWG", "quantity": 150, "unit": "feet"}]',
 'Electrical work on track. Coordination with plumbing team needed.', 'Rainy', 'Completed', 'david.johnson@company.com'),

('2024-01-19', 'Office Building Downtown', 'Plumbing installation in basement level',
 ARRAY['Sarah Wilson', 'Lisa Davis'], 8.5,
 '[{"material_id": 10, "material_name": "PVC Pipe 4inch", "quantity": 12, "unit": "pieces"}]',
 'Plumbing rough-in completed for basement. Ready for inspection.', 'Clear', 'Completed', 'sarah.wilson@company.com');

-- Insert material transactions for the daily log activities
INSERT INTO public.material_transactions (material_id, transaction_type, quantity, previous_stock, new_stock, reference_type, reference_id, project, notes, created_by) VALUES
-- Concrete usage for foundation
(3, 'used', 5, 30, 25, 'daily_log', 1, 'Residential Complex A', 'Used in daily work: Foundation excavation and concrete pouring for Building A', 'john.smith@company.com'),

-- Rebar usage for steel frame
(2, 'used', 25, 200, 175, 'daily_log', 2, 'Office Building Downtown', 'Used in daily work: Steel frame installation on second floor', 'john.smith@company.com'),

-- Lumber and nails usage for framing
(4, 'used', 20, 100, 80, 'daily_log', 3, 'Residential Complex A', 'Used in daily work: Framing work on first floor units 1-4', 'maria.garcia@company.com'),
(15, 'used', 5, 50, 45, 'daily_log', 3, 'Residential Complex A', 'Used in daily work: Framing work on first floor units 1-4', 'maria.garcia@company.com'),

-- Electrical wire usage
(9, 'used', 150, 500, 350, 'daily_log', 4, 'Shopping Center Phase 1', 'Used in daily work: Electrical rough-in for retail spaces', 'david.johnson@company.com'),

-- PVC pipe usage
(10, 'used', 12, 80, 68, 'daily_log', 5, 'Office Building Downtown', 'Used in daily work: Plumbing installation in basement level', 'sarah.wilson@company.com');

-- Update material stock levels to match transactions
UPDATE public.materials SET current_stock = 25 WHERE id = 3;  -- Concrete Mix
UPDATE public.materials SET current_stock = 175 WHERE id = 2; -- Rebar #4
UPDATE public.materials SET current_stock = 80 WHERE id = 4;  -- Lumber 2x4x8
UPDATE public.materials SET current_stock = 45 WHERE id = 15; -- Nails - Framing
UPDATE public.materials SET current_stock = 350 WHERE id = 9; -- Electrical Wire 12AWG
UPDATE public.materials SET current_stock = 68 WHERE id = 10; -- PVC Pipe 4inch
