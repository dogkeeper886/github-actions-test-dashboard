-- Add log_content column to job_steps table
ALTER TABLE job_steps ADD COLUMN IF NOT EXISTS log_content TEXT;
