const { getDatabase } = require("../database/connection");

class WorkflowRun {
  static async create(runData) {
    const db = await getDatabase();

    const query = `
      INSERT INTO workflow_runs (
        id, workflow_id, workflow_name, run_number, status, conclusion,
        created_at, updated_at, run_started_at, duration, head_branch,
        head_sha, commit_message, commit_author, event, url, html_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        conclusion = EXCLUDED.conclusion,
        updated_at = EXCLUDED.updated_at,
        duration = EXCLUDED.duration
      RETURNING *
    `;

    const values = [
      runData.id,
      runData.workflow_id,
      runData.name || runData.workflow_name,
      runData.run_number,
      runData.status,
      runData.conclusion,
      runData.created_at,
      runData.updated_at,
      runData.run_started_at,
      runData.duration || this.calculateDuration(runData),
      runData.head_branch,
      runData.head_sha,
      runData.display_title || runData.commit_message,
      runData.triggering_actor?.login || runData.actor?.login,
      runData.event,
      runData.url,
      runData.html_url,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findById(id) {
    const db = await getDatabase();
    const result = await db.query("SELECT * FROM workflow_runs WHERE id = $1", [
      id,
    ]);
    return result.rows[0];
  }

  static async findByWorkflowId(workflowId, options = {}) {
    const db = await getDatabase();

    let query = "SELECT * FROM workflow_runs WHERE workflow_id = $1";
    const values = [workflowId];

    // Add filtering
    if (options.status) {
      query += " AND status = $" + (values.length + 1);
      values.push(options.status);
    }

    if (options.conclusion) {
      query += " AND conclusion = $" + (values.length + 1);
      values.push(options.conclusion);
    }

    // Add ordering
    query += " ORDER BY created_at DESC";

    // Add pagination
    if (options.limit) {
      query += " LIMIT $" + (values.length + 1);
      values.push(options.limit);
    }

    if (options.offset) {
      query += " OFFSET $" + (values.length + 1);
      values.push(options.offset);
    }

    const result = await db.query(query, values);
    return result.rows;
  }

  static async getLatestByWorkflowId(workflowId) {
    const db = await getDatabase();
    const result = await db.query(
      "SELECT * FROM workflow_runs WHERE workflow_id = $1 ORDER BY created_at DESC LIMIT 1",
      [workflowId],
    );
    return result.rows[0];
  }

  static async findAllInProgress() {
    const db = await getDatabase();
    const result = await db.query(
      "SELECT * FROM workflow_runs WHERE status = 'in_progress' ORDER BY created_at DESC",
    );
    return result.rows;
  }

  static calculateDuration(runData) {
    const start = new Date(runData.run_started_at);
    const end = new Date(runData.updated_at);
    return end.getTime() - start.getTime();
  }
}

module.exports = WorkflowRun;
