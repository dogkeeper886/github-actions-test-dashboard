const { getDatabase } = require("../database/connection");

class JobStep {
  static async createMultiple(jobId, steps) {
    const db = await getDatabase();

    const values = [];
    const placeholders = [];

    steps.forEach((step, index) => {
      const offset = index * 7;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      values.push(
        jobId,
        step.name,
        step.status,
        step.conclusion,
        step.number,
        step.completed_at || step.started_at,
        step.log_content || null,
      );
    });

    if (placeholders.length === 0) return [];

    const query = `
      INSERT INTO job_steps (
        job_id, name, status, conclusion, number, completed_at, log_content
      ) VALUES ${placeholders.join(", ")}
      ON CONFLICT (job_id, number) DO UPDATE SET
        status = EXCLUDED.status,
        conclusion = EXCLUDED.conclusion,
        completed_at = EXCLUDED.completed_at,
        log_content = EXCLUDED.log_content
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows;
  }

  static async findByJobId(jobId) {
    const db = await getDatabase();
    const result = await db.query(
      "SELECT * FROM job_steps WHERE job_id = $1 ORDER BY number ASC",
      [jobId],
    );
    return result.rows;
  }
}

module.exports = JobStep;
