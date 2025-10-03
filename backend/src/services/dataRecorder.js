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
  async recordWorkflow(workflowData) {
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
    return result.rows[0];
  }

  async recordWorkflows(workflows) {
    return Promise.all(
      workflows.map((workflow) => this.recordWorkflow(workflow)),
    );
  }

  async recordWorkflowRun(runData) {
    return WorkflowRun.create(runData);
  }

  async recordExtractedFiles(runId, artifactId, artifactName, files) {
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

    return storedFiles;
  }

  async recordCompleteRun(runData, artifacts = [], jobs = []) {
    const storedRun = await this.recordWorkflowRun(runData);

    let totalFiles = 0;
    const filesByArtifact = {};

    for (const artifact of artifacts) {
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

      if (job.status === "completed") {
        const logs = await githubService.getJobLogs(job.id);
        await JobLog.create(job.id, logs);

        if (job.steps && job.steps.length > 0) {
          const stepsWithLogs = parseJobLogsIntoSteps(logs, job.steps);
          await JobStep.createMultiple(job.id, stepsWithLogs);
        }
      } else {
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
  }

  async getWorkflowSummary(workflowId) {
    const runs = await WorkflowRun.findByWorkflowId(workflowId);

    const summary = {
      totalRuns: runs.length,
      successfulRuns: runs.filter((r) => r.conclusion === "success").length,
      failedRuns: runs.filter((r) => r.conclusion === "failure").length,
      latestRun: runs[0] || null,
      successRate: 0,
    };

    if (summary.totalRuns > 0) {
      summary.successRate = (summary.successfulRuns / summary.totalRuns) * 100;
    }

    return summary;
  }
}

module.exports = DataRecorderService;
