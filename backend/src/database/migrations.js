const fs = require('fs')
const path = require('path')
const { getDatabase } = require('./connection')

async function runMigrations() {
  const db = await getDatabase()
  
  try {
    console.log('Running database migrations...')
    
    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    
    await db.query(schemaSql)
    
    console.log('Database migrations completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

module.exports = {
  runMigrations
}
