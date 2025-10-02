const { getDatabase } = require('../database/connection')

class Artifact {
  static async create(artifactData) {
    const db = await getDatabase()
    
    const query = `
      INSERT INTO artifacts (
        id, run_id, name, size_in_bytes, expired,
        created_at, updated_at, expires_at, url, archive_download_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        expired = EXCLUDED.expired,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `
    
    const values = [
      artifactData.id,
      artifactData.runId || artifactData.run_id,
      artifactData.name,
      artifactData.size_in_bytes || artifactData.size,
      artifactData.expired || false,
      artifactData.created_at || new Date().toISOString(),
      artifactData.updated_at || new Date().toISOString(),
      artifactData.expires_at || null,
      artifactData.url || null,
      artifactData.archive_download_url || null
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }
  
  static async findById(id) {
    const db = await getDatabase()
    const result = await db.query('SELECT * FROM artifacts WHERE id = $1', [id])
    return result.rows[0]
  }
  
  static async findByRunId(runId) {
    const db = await getDatabase()
    const result = await db.query('SELECT * FROM artifacts WHERE run_id = $1', [runId])
    return result.rows
  }
}

module.exports = Artifact

