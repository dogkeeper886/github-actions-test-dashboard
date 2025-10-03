const { getDatabase } = require("../database/connection");
const { v4: uuidv4 } = require("uuid");

class ExtractedFile {
  static async create(fileData) {
    const db = await getDatabase();

    const query = `
      INSERT INTO extracted_files (
        id, run_id, artifact_id, artifact_name, original_path,
        file_type, file_size, stored_filename, stored_url, content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (run_id, stored_filename) DO UPDATE SET
        file_size = EXCLUDED.file_size,
        content = EXCLUDED.content
      RETURNING *
    `;

    const values = [
      uuidv4(),
      fileData.runId,
      fileData.artifactId,
      fileData.artifactName,
      fileData.originalPath,
      fileData.fileType,
      fileData.fileSize,
      fileData.storedFilename,
      fileData.storedUrl,
      fileData.content,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByRunId(runId) {
    const db = await getDatabase();
    const result = await db.query(
      "SELECT * FROM extracted_files WHERE run_id = $1 ORDER BY extracted_at DESC",
      [runId],
    );
    return result.rows;
  }

  static async findByRunIdGrouped(runId) {
    const files = await this.findByRunId(runId);

    const grouped = {
      images: [],
      json: [],
      text: [],
      binary: [],
    };

    files.forEach((file) => {
      const category =
        file.file_type === "image"
          ? "images"
          : file.file_type === "json"
            ? "json"
            : file.file_type === "text"
              ? "text"
              : "binary";

      grouped[category].push({
        id: file.id,
        originalPath: file.original_path,
        storedFilename: file.stored_filename,
        url: file.stored_url,
        size: file.file_size,
        artifactName: file.artifact_name,
        content: file.content,
        extractedAt: file.extracted_at,
      });
    });

    return grouped;
  }

  static async findById(id) {
    const db = await getDatabase();
    const result = await db.query(
      "SELECT * FROM extracted_files WHERE id = $1",
      [id],
    );
    return result.rows[0];
  }

  static async search(query, options = {}) {
    const db = await getDatabase();

    let sql = `
      SELECT * FROM extracted_files
      WHERE (original_path ILIKE $1 OR content ILIKE $1)
    `;
    const values = [`%${query}%`];

    if (options.fileType) {
      sql += " AND file_type = $" + (values.length + 1);
      values.push(options.fileType);
    }

    if (options.runId) {
      sql += " AND run_id = $" + (values.length + 1);
      values.push(options.runId);
    }

    sql += " ORDER BY extracted_at DESC";

    if (options.limit) {
      sql += " LIMIT $" + (values.length + 1);
      values.push(options.limit);
    }

    const result = await db.query(sql, values);
    return result.rows;
  }

  static async getFileTypeCounts(runId) {
    const db = await getDatabase();
    const result = await db.query(
      `
      SELECT file_type, COUNT(*) as count
      FROM extracted_files
      WHERE run_id = $1
      GROUP BY file_type
    `,
      [runId],
    );

    const counts = {};
    result.rows.forEach((row) => {
      counts[row.file_type] = parseInt(row.count);
    });

    return counts;
  }
}

module.exports = ExtractedFile;
