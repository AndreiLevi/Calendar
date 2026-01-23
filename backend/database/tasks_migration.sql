-- Tasks table migration for User Context Agent
-- Run this in Supabase SQL Editor

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Type and Status
    task_type VARCHAR(20) DEFAULT 'flexible' CHECK (task_type IN ('rigid', 'flexible', 'recurring', 'intention')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'snoozed')),
    
    -- Time constraints
    scheduled_at TIMESTAMPTZ,
    due_date DATE,
    estimated_duration INT, -- minutes
    
    -- Relationships
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    life_sphere VARCHAR(50),
    
    -- Recurrence (RRULE format)
    recurrence_rule TEXT,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create projects table (for future use)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    progress FLOAT DEFAULT 0 CHECK (progress >= 0 AND progress <= 1),
    life_sphere VARCHAR(50),
    priority INT DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    start_date DATE,
    target_end_date DATE,
    actual_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_life_sphere ON tasks(life_sphere);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Service role bypass (for backend API)
CREATE POLICY "Service role full access to tasks" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to projects" ON projects
    FOR ALL USING (auth.role() = 'service_role');

-- ==================== MILESTONES ====================

CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON milestones(project_id);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage milestones via projects" ON milestones
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()::text::uuid)
    );

CREATE POLICY "Service role full access to milestones" ON milestones
    FOR ALL USING (auth.role() = 'service_role');

-- ==================== LIFE SPHERES ====================

CREATE TABLE IF NOT EXISTS life_spheres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,  -- NULL for system spheres
    key VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    icon VARCHAR(10),  -- emoji
    color VARCHAR(7),  -- hex color
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system spheres
INSERT INTO life_spheres (key, name, is_system, priority) VALUES
    ('career', 'Карьера', TRUE, 5),
    ('health', 'Здоровье', TRUE, 5),
    ('relationships', 'Отношения', TRUE, 5),
    ('finance', 'Финансы', TRUE, 5),
    ('family', 'Семья', TRUE, 5),
    ('creativity', 'Творчество', TRUE, 5),
    ('spirituality', 'Духовность', TRUE, 5),
    ('education', 'Образование', TRUE, 5)
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_life_spheres_user_id ON life_spheres(user_id);
CREATE INDEX IF NOT EXISTS idx_life_spheres_key ON life_spheres(key);

ALTER TABLE life_spheres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system and own spheres" ON life_spheres
    FOR SELECT USING (is_system = TRUE OR user_id = auth.uid()::text::uuid);

CREATE POLICY "Users can manage own spheres" ON life_spheres
    FOR ALL USING (user_id = auth.uid()::text::uuid);

CREATE POLICY "Service role full access to life_spheres" ON life_spheres
    FOR ALL USING (auth.role() = 'service_role');
