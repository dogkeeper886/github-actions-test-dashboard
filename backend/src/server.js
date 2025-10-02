const express = require('express')
const cors = require('cors')
require('dotenv').config()

const { initDatabase } = require('./database/connection')
const { runMigrations } = require('./database/migrations')
const DataCollectorService = require('./services/dataCollector')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/workflows', require('./routes/workflows'))
app.use('/api/runs', require('./routes/runs'))
app.use('/api/tests', require('./routes/tests'))
app.use('/api/refresh', require('./routes/refresh'))

async function startServer() {
  try {
    // Initialize database connection
    await initDatabase()
    
    // Run database migrations
    await runMigrations()
    
    // Start periodic data collection
    const dataCollector = new DataCollectorService()
    dataCollector.start()
    
    // Store collector instance for graceful shutdown
    app.locals.dataCollector = dataCollector
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('Database connected and migrations completed')
      console.log(`Periodic data collection started (${dataCollector.pollInterval}m intervals)`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  if (app.locals.dataCollector) {
    app.locals.dataCollector.stop()
  }
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  if (app.locals.dataCollector) {
    app.locals.dataCollector.stop()
  }
  process.exit(0)
})

startServer()

module.exports = app
