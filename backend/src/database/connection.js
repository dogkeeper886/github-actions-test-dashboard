const { Pool } = require('pg')

let pool = null

async function initDatabase() {
  if (pool) {
    return pool
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: false // Disable SSL for local development
  })

  // Test the connection
  try {
    const client = await pool.connect()
    console.log('Database connected successfully')
    client.release()
  } catch (err) {
    console.error('Database connection failed:', err)
    throw err
  }

  return pool
}

async function getDatabase() {
  if (!pool) {
    await initDatabase()
  }
  return pool
}

async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
}
