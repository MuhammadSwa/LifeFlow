-- Enable logical replication if not already enabled globally
-- Run this once as a superuser and restart PostgreSQL:
-- ALTER SYSTEM SET wal_level = 'logical';
-- You might need to restart your PostgreSQL server after this if it's the first time.

-- project Table
CREATE TABLE IF NOT EXISTS project ( -- Singular name, matching table('project')
    name TEXT PRIMARY KEY -- Name is the PK and unique
);

-- Areas Table
CREATE TABLE IF NOT EXISTS area ( -- Singular name, matching table('area')
    name TEXT PRIMARY KEY -- Name is the PK and unique
);

-- todo Table
CREATE TABLE IF NOT EXISTS todo (
    id TEXT PRIMARY KEY,
    raw_text TEXT NOT NULL,
    description TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at BIGINT NOT NULL, -- For JS Date.now() timestamps

    project_name TEXT REFERENCES project(name) ON DELETE SET NULL ON UPDATE CASCADE,
    area_name TEXT REFERENCES area(name) ON DELETE SET NULL ON UPDATE CASCADE,

    completion_date BIGINT, -- For JS Date.now() timestamps
    priority TEXT CHECK (priority IS NULL OR priority IN ('A', 'B', 'C', 'D')), -- Check constraint for priority
    due_date BIGINT,       -- For JS Date.now() timestamps

    metadata JSONB -- JSONB is generally preferred over JSON in PostgreSQL
);

-- Indexes for foreign keys (PostgreSQL often creates them automatically for FKs, but explicit is fine)
CREATE INDEX IF NOT EXISTS idx_todo_project_name ON todo(project_name);
CREATE INDEX IF NOT EXISTS idx_todo_area_name ON todo(area_name);

-- Optional: Indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_todo_completed ON todo(completed);
CREATE INDEX IF NOT EXISTS idx_todo_created_at ON todo(created_at);
CREATE INDEX IF NOT EXISTS idx_todo_priority ON todo(priority);

-- Optional: Create a publication if you want to limit what Zero replicates
-- CREATE PUBLICATION zero_pub FOR TABLE todo, project, area;
