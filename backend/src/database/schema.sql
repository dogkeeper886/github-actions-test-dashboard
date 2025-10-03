-- GitHub Actions Test Dashboard Database Schema

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  path VARCHAR(500) NOT NULL,
  state VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  url VARCHAR(500),
  html_url VARCHAR(500),
  badge_url VARCHAR(500)
);

-- Workflow runs table
CREATE TABLE IF NOT EXISTS workflow_runs (
  id BIGINT PRIMARY KEY,
  workflow_id BIGINT NOT NULL,
  workflow_name VARCHAR(255),
  run_number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL,
  conclusion VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  run_started_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in milliseconds
  head_branch VARCHAR(255),
  head_sha VARCHAR(255),
  commit_message TEXT,
  commit_author VARCHAR(255),
  event VARCHAR(100),
  url VARCHAR(500),
  html_url VARCHAR(500),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id BIGINT PRIMARY KEY,
  run_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  size_in_bytes BIGINT,
  expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  url VARCHAR(500),
  archive_download_url VARCHAR(500),
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
);

-- Extracted files table
CREATE TABLE IF NOT EXISTS extracted_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id BIGINT NOT NULL,
  artifact_id BIGINT NOT NULL,
  artifact_name VARCHAR(255) NOT NULL,
  original_path VARCHAR(1000) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- image, json, text, binary
  file_size BIGINT,
  stored_filename VARCHAR(255),
  stored_url VARCHAR(500),
  content TEXT, -- for text/json files
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id),
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT PRIMARY KEY,
  run_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  conclusion VARCHAR(50),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  url VARCHAR(500),
  html_url VARCHAR(500),
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
);

-- Job steps table
CREATE TABLE IF NOT EXISTS job_steps (
  id SERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL,
  name VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL,
  conclusion VARCHAR(50),
  number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  log_content TEXT,
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Job logs table
CREATE TABLE IF NOT EXISTS job_logs (
  job_id BIGINT PRIMARY KEY,
  logs TEXT NOT NULL,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON workflow_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_conclusion ON workflow_runs(conclusion);

CREATE INDEX IF NOT EXISTS idx_artifacts_run_id ON artifacts(run_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_expired ON artifacts(expired);

CREATE INDEX IF NOT EXISTS idx_extracted_files_run_id ON extracted_files(run_id);
CREATE INDEX IF NOT EXISTS idx_extracted_files_artifact_id ON extracted_files(artifact_id);
CREATE INDEX IF NOT EXISTS idx_extracted_files_type ON extracted_files(file_type);
CREATE INDEX IF NOT EXISTS idx_extracted_files_extracted_at ON extracted_files(extracted_at DESC);

CREATE INDEX IF NOT EXISTS idx_jobs_run_id ON jobs(run_id);
CREATE INDEX IF NOT EXISTS idx_job_steps_job_id ON job_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_job_steps_number ON job_steps(number);
