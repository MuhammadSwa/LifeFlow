-- Enable logical replication if not already enabled globally
-- Run this once as a superuser and restart PostgreSQL:
-- ALTER SYSTEM SET wal_level = 'logical';
-- You might need to restart your PostgreSQL server after this if it's the first time.

-- project Table
CREATE TABLE IF NOT EXISTS project (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE -- Assuming project names should be unique
);

-- area Table
CREATE TABLE IF NOT EXISTS area (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE -- Assuming area names should be unique
);

-- todo Table
CREATE TABLE IF NOT EXISTS todo (
    id TEXT PRIMARY KEY,
    raw_text TEXT NOT NULL,
    description TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL, -- For JS Date.now() timestamps

    project_id TEXT REFERENCES project(id) ON DELETE SET NULL ON UPDATE CASCADE, -- Foreign Key
    area_id TEXT REFERENCES area(id) ON DELETE SET NULL ON UPDATE CASCADE, -- Foreign Key

    completion_date BIGINT, -- For JS Date.now() timestamps
    priority TEXT CHECK (priority IS NULL OR priority IN ('A', 'B', 'C', 'D')), -- Check constraint for priority
    due_date BIGINT,       -- For JS Date.now() timestamps

    metadata JSONB -- JSONB is generally preferred over JSON in PostgreSQL
);

-- Indexes for foreign keys (PostgreSQL often creates them automatically for FKs, but explicit is fine)
CREATE INDEX IF NOT EXISTS idx_todo_project_id ON todo(project_id);
CREATE INDEX IF NOT EXISTS idx_todo_area_id ON todo(area_id);

-- Optional: Indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_todo_completed ON todo(completed);
CREATE INDEX IF NOT EXISTS idx_todo_created_at ON todo(created_at);
CREATE INDEX IF NOT EXISTS idx_todo_priority ON todo(priority);

-- Optional: Create a publication if you want to limit what Zero replicates
-- CREATE PUBLICATION zero_pub FOR TABLE todo, project, area;
