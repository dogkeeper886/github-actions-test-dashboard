const { getDatabase } = require('../database/connection')

class JobLog {
  static async create(jobId, logs) {
    const db = await getDatabase()
    
    const query = `
      INSERT INTO job_logs (job_id, logs, fetched_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (job_id) DO UPDATE SET
        logs = EXCLUDED.logs,
        fetched_at = NOW()
      RETURNING *
    `
    
    const result = await db.query(query, [jobId, logs])
    return result.rows[0]
  }
  
  static async findByJobId(jobId) {
    const db = await getDatabase()
    const result = await db.query('SELECT * FROM job_logs WHERE job_id = $1', [jobId])
    return result.rows[0]
  }
}

module.exports = JobLog

