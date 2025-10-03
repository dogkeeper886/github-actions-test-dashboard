const WorkflowRun = require("../models/WorkflowRun");
const ExtractedFile = require("../models/ExtractedFile");
const Artifact = require("../models/Artifact");
const Job = require("../models/Job");
const JobStep = require("../models/JobStep");
const JobLog = require("../models/JobLog");
const githubService = require("./github");
const { getDatabase } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");
const { parseJobLogsIntoSteps } = require("./logParser");

class DataRecorderService {
  /**
   * Record a workflow in the database
   * @param {Object} workflowData - GitHub workflow data
   * @returns {Object} Stored workflow
   */
  async recordWorkflow(workflowData) {
    try {
      console.log(
        `Recording workflow: ${workflowData.id} - ${workflowData.name}`,
      );

      const db = await getDatabase();

      const query = `
        INSERT INTO workflows (
          id, name, path, state, created_at, updated_at, url, html_url, badge_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          path = EXCLUDED.path,
          state = EXCLUDED.state,
          updated_at = EXCLUDED.updated_at,
          url = EXCLUDED.url,
          html_url = EXCLUDED.html_url,
          badge_url = EXCLUDED.badge_url
        RETURNING *
      `;

      const values = [
        workflowData.id,
        workflowData.name,
        workflowData.path,
        workflowData.state,
        workflowData.created_at,
        workflowData.updated_at,
        workflowData.url,
        workflowData.html_url,
        workflowData.badge_url,
      ];

      const result = await db.query(query, values);
      console.log(`✅ Workflow ${workflowData.id} recorded successfully`);

      return result.rows[0];
    } catch (error) {
      console.error(`❌ Failed to record workflow ${workflowData.id}:`, error);
      throw error;
    }
  }

  /**
   * Record multiple workflows
   * @param {Array} workflows - Array of GitHub workflow data
   * @returns {Array} Stored workflows
   */
  async recordWorkflows(workflows) {
    const results = [];

    for (const workflow of workflows) {
      try {
        const result = await this.recordWorkflow(workflow);
        results.push(result);
      } catch (error) {
        console.error(`Failed to record workflow ${workflow.id}:`, error);
        // Continue with other workflows
      }
    }

    return results;
  }

  /**
   * Record a workflow run in the database
   * @param {Object} runData - GitHub workflow run data
   * @returns {Object} Stored workflow run
   */
  async recordWorkflowRun(runData) {
    try {
      console.log(`Recording workflow run: ${runData.id} - ${runData.name}`);

      const storedRun = await WorkflowRun.create(runData);
      console.log(`✅ Workflow run ${runData.id} recorded successfully`);

      return storedRun;
    } catch (error) {
      console.error(`❌ Failed to record workflow run ${runData.id}:`, error);
      throw error;
    }
  }

  /**
   * Record extracted files from an artifact
   * @param {string} runId - Workflow run ID
   * @param {string} artifactId - Artifact ID
   * @param {string} artifactName - Artifact name
   * @param {Array} files - Array of extracted file objects
   * @returns {Array} Stored file records
   */
  async recordExtractedFiles(runId, artifactId, artifactName, files) {
    try {
      console.log(
        `Recording ${files.length} files for run ${runId}, artifact ${artifactName}`,
      );

      const storedFiles = [];

      for (const file of files) {
        const fileData = {
          runId,
          artifactId,
          artifactName,
          originalPath: file.originalPath,
          fileType: file.type,
          fileSize: file.size,
          storedFilename: file.storedFilename,
          storedUrl: file.url,
          content: file.content,
        };

        const storedFile = await ExtractedFile.create(fileData);
        storedFiles.push(storedFile);
      }

      console.log(
        `✅ Recorded ${storedFiles.length} files for artifact ${artifactName}`,
      );
      return storedFiles;
    } catch (error) {
      console.error(`❌ Failed to record files for run ${runId}:`, error);
      throw error;
    }
  }

  /**
   * Record a complete workflow run with all its artifacts and files
   * @param {Object} runData - GitHub workflow run data
   * @param {Array} artifacts - Array of artifacts with extracted files
   * @param {Array} jobs - Array of jobs from GitHub API
   * @returns {Object} Complete recording summary
   */
  async recordCompleteRun(runData, artifacts = [], jobs = []) {
    try {
      console.log(`🔄 Recording complete run: ${runData.id}`);

      // 1. Record the workflow run
      const storedRun = await this.recordWorkflowRun(runData);

      // 2. Record artifacts and their extracted files
      let totalFiles = 0;
      const filesByArtifact = {};

      for (const artifact of artifacts) {
        // Record the artifact itself
        await Artifact.create({
          id: artifact.id,
          runId: runData.id,
          name: artifact.name,
          size_in_bytes: artifact.size_in_bytes,
          expired: artifact.expired,
          created_at: artifact.created_at,
          updated_at: artifact.updated_at,
          expires_at: artifact.expires_at,
          url: artifact.url,
          archive_download_url: artifact.archive_download_url,
        });

        // Record extracted files if any
        if (artifact.extractedFiles && artifact.extractedFiles.length > 0) {
          const storedFiles = await this.recordExtractedFiles(
            runData.id,
            artifact.id,
            artifact.name,
            artifact.extractedFiles,
          );

          filesByArtifact[artifact.name] = storedFiles;
          totalFiles += storedFiles.length;
        }
      }

      // 3. Record jobs, steps, and logs
      let totalJobs = 0;
      for (const job of jobs) {
        await Job.create({
          id: job.id,
          run_id: runData.id,
          name: job.name,
          status: job.status,
          conclusion: job.conclusion,
          started_at: job.started_at,
          completed_at: job.completed_at,
          url: job.url,
          html_url: job.html_url,
        });

        // Fetch and record job logs, then parse into steps
        if (job.status === "completed") {
          try {
            const logs = await githubService.getJobLogs(job.id);
            await JobLog.create(job.id, logs);

            // Parse logs into steps and record with log content
            if (job.steps && job.steps.length > 0) {
              const stepsWithLogs = parseJobLogsIntoSteps(logs, job.steps);
              await JobStep.createMultiple(job.id, stepsWithLogs);
            }
          } catch (logError) {
            console.log(
              `⚠️ Could not fetch logs for job ${job.id}:`,
              logError.message,
            );
            // Still record steps without logs
            if (job.steps && job.steps.length > 0) {
              await JobStep.createMultiple(job.id, job.steps);
            }
          }
        } else {
          // For non-completed jobs, record steps without logs
          if (job.steps && job.steps.length > 0) {
            await JobStep.createMultiple(job.id, job.steps);
          }
        }

        totalJobs++;
      }

      return {
        run: storedRun,
        totalFiles,
        totalArtifacts: artifacts.length,
        totalJobs,
        filesByArtifact,
      };
    } catch (error) {
      console.error(`❌ Failed to record complete run ${runData.id}:`, error);
      throw error;
    }
  }

  /**
   * Check if a workflow run is already recorded
   * @param {string} runId - Workflow run ID
   * @returns {boolean} True if run exists in database
   */
  async isRunRecorded(runId) {
    try {
      const existingRun = await WorkflowRun.findById(runId);
      return !!existingRun;
    } catch (error) {
      console.error(`Error checking if run ${runId} exists:`, error);
      return false;
    }
  }

  /**
   * Get summary of recorded data for a workflow
   * @param {string} workflowId - GitHub workflow ID
   * @returns {Object} Summary statistics
   */
  async getWorkflowSummary(workflowId) {
    try {
      const runs = await WorkflowRun.findByWorkflowId(workflowId);

      const summary = {
        totalRuns: runs.length,
        successfulRuns: runs.filter((r) => r.conclusion === "success").length,
        failedRuns: runs.filter((r) => r.conclusion === "failure").length,
        latestRun: runs[0] || null, // Assuming runs are ordered by date desc
        successRate: 0,
      };

      if (summary.totalRuns > 0) {
        summary.successRate =
          (summary.successfulRuns / summary.totalRuns) * 100;
      }

      return summary;
    } catch (error) {
      console.error(`Error getting workflow summary for ${workflowId}:`, error);
      throw error;
    }
  }
}

module.exports = DataRecorderService;
