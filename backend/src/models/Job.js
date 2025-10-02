const { getDatabase } = require('../database/connection')

class Job {
  static async create(jobData) {
    const db = await getDatabase()
    
    const query = `
      INSERT INTO jobs (
        id, run_id, name, status, conclusion,
        started_at, completed_at, url, html_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        conclusion = EXCLUDED.conclusion,
        completed_at = EXCLUDED.completed_at
      RETURNING *
    `
    
    const values = [
      jobData.id,
      jobData.run_id,
      jobData.name,
      jobData.status,
      jobData.conclusion,
      jobData.started_at,
      jobData.completed_at,
      jobData.url,
      jobData.html_url
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }
  
  static async findById(id) {
    const db = await getDatabase()
    const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id])
    return result.rows[0]
  }
  
  static async findByRunId(runId) {
    const db = await getDatabase()
    const result = await db.query(
      'SELECT * FROM jobs WHERE run_id = $1 ORDER BY started_at ASC',
      [runId]
    )
    return result.rows
  }
}

module.exports = Job

