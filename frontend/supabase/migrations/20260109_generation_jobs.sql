-- Migration: Add generation_jobs table for tracking long-running background tasks
-- This table is used to monitor progress, errors, and timing for batch operations like mockup generation.

CREATE TABLE IF NOT EXISTS generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL, -- e.g., 'mockup_template'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_items INTEGER NOT NULL DEFAULT 0,
    processed_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    error_logs JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookup of active jobs
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_type_status ON generation_jobs(job_type, status);

-- RLS: Only authenticated users can read, admins can write
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read generation_jobs"
    ON generation_jobs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service role can manage generation_jobs"
    ON generation_jobs FOR ALL
    TO service_role
    USING (true);
