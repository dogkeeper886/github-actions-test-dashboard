const { getWorkflows, getWorkflowRuns } = require("./github");
const WorkflowProcessorService = require("./workflowProcessor");
const DataRecorderService = require("./dataRecorder");

class DataCollectorService {
  constructor() {
    this.pollInterval = parseInt(process.env.POLL_INTERVAL_MINUTES) || 5;
    this.isRunning = false;
    this.isCollecting = false;
    this.workflowProcessor = new WorkflowProcessorService();
    this.dataRecorder = new DataRecorderService();
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    await this.collectNewData();
    this.scheduleNextPoll();
  }

  stop() {
    this.isRunning = false;
  }

  scheduleNextPoll() {
    if (!this.isRunning) return;

    setTimeout(
      async () => {
        try {
          await this.collectNewData();
        } finally {
          this.scheduleNextPoll();
        }
      },
      this.pollInterval * 60 * 1000,
    );
  }

  async collectNewData() {
    if (this.isCollecting) {
      throw new Error("Collection already in progress");
    }

    this.isCollecting = true;

    try {
      const startTime = Date.now();
      let totalNewRuns = 0;
      let totalNewFiles = 0;
      let processedWorkflows = 0;

      const lastSync = await this.getLastSyncTimestamp();
      const workflows = await getWorkflows();
      await this.dataRecorder.recordWorkflows(workflows);

      const WorkflowRun = require("../models/WorkflowRun");
      const inProgressRuns = await WorkflowRun.findAllInProgress();
      const inProgressRunIds = new Set(inProgressRuns.map((r) => r.id));

      for (const workflow of workflows) {
        const options = { per_page: 50 };
        if (lastSync) {
          options.created = `>${new Date(lastSync).toISOString()}`;
        }

        const runsData = await getWorkflowRuns(workflow.id, options);
        let runs = runsData.workflow_runs || [];

        const workflowInProgressRuns = inProgressRuns.filter(
          (r) => r.workflow_id === workflow.id,
        );
        for (const inProgressRun of workflowInProgressRuns) {
          if (!runs.find((r) => r.id == inProgressRun.id)) {
            const freshRunData = await this.workflowProcessor.getRunData(
              inProgressRun.id,
            );
            runs.push(freshRunData);
          }
        }

        if (runs.length === 0) continue;

        const results = await this.workflowProcessor.processMultipleRuns(runs);
        const newRuns = results.filter((r) => r.success && !r.skipped).length;
        const newFiles = results.reduce(
          (sum, r) => sum + (r.totalFiles || 0),
          0,
        );

        totalNewRuns += newRuns;
        totalNewFiles += newFiles;
        processedWorkflows++;
      }

      await this.updateLastSyncTimestamp();

      const duration = Date.now() - startTime;
      return {
        success: true,
        duration,
        summary: {
          processedWorkflows,
          totalWorkflows: workflows.length,
          newRuns: totalNewRuns,
          newFiles: totalNewFiles,
        },
      };
    } finally {
      this.isCollecting = false;
    }
  }

  async getLastSyncTimestamp() {
    const { getDatabase } = require("../database/connection");
    const db = await getDatabase();

    await db.query(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id SERIAL PRIMARY KEY,
        last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    const result = await db.query(
      "SELECT last_sync_at FROM sync_status ORDER BY id DESC LIMIT 1",
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new Date(result.rows[0].last_sync_at).getTime();
  }

  async updateLastSyncTimestamp() {
    const { getDatabase } = require("../database/connection");
    const db = await getDatabase();

    await db.query("INSERT INTO sync_status (last_sync_at) VALUES (NOW())");
  }

  async forceCollection() {
    return await this.collectNewData();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      isCollecting: this.isCollecting,
      pollInterval: this.pollInterval,
      nextPollIn: this.isRunning ? `${this.pollInterval} minutes` : "stopped",
    };
  }
}

module.exports = DataCollectorService;
