-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Planning',
    progress INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create workers table
CREATE TABLE IF NOT EXISTS workers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    specialty VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    unit VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    worker_id INTEGER REFERENCES workers(id),
    hours_worked DECIMAL(4,2) NOT NULL,
    tasks_completed TEXT NOT NULL,
    materials_used TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create project_workers junction table
CREATE TABLE IF NOT EXISTS project_workers (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    worker_id INTEGER REFERENCES workers(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    role VARCHAR(100),
    UNIQUE(project_id, worker_id)
);

-- Create material_usage table
CREATE TABLE IF NOT EXISTS material_usage (
    id SERIAL PRIMARY KEY,
    daily_log_id INTEGER REFERENCES daily_logs(id),
    material_id INTEGER REFERENCES materials(id),
    quantity_used INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_project ON daily_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_worker ON daily_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
