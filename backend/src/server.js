const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { initDatabase } = require('./database/connection')
const { runMigrations } = require('./database/migrations')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/workflows', require('./routes/workflows'))
app.use('/api/runs', require('./routes/runs'))
app.use('/api/tests', require('./routes/tests'))

async function startServer() {
  try {
    // Initialize database connection
    await initDatabase()
    
    // Run database migrations
    await runMigrations()
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('Database connected and migrations completed')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
