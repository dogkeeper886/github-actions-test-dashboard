-- Add unique constraint for job_steps (job_id, number)
-- First, delete duplicate steps (keep the ones with higher IDs which are more recent)
DELETE FROM job_steps a USING job_steps b
WHERE a.job_id = b.job_id 
  AND a.number = b.number 
  AND a.id < b.id;

-- Add unique constraint
ALTER TABLE job_steps 
  ADD CONSTRAINT job_steps_job_id_number_unique UNIQUE (job_id, number);

-- Add unique constraint for extracted_files (run_id, stored_filename)
-- First, delete duplicates if any (keep the most recent)
DELETE FROM extracted_files a USING extracted_files b
WHERE a.run_id = b.run_id 
  AND a.stored_filename = b.stored_filename 
  AND a.extracted_at < b.extracted_at;

-- Add unique constraint
ALTER TABLE extracted_files 
  ADD CONSTRAINT extracted_files_run_id_filename_unique UNIQUE (run_id, stored_filename);
