const express = require('express')
const router = express.Router()

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'github-actions-test-dashboard-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Detailed health check with dependencies
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'github-actions-test-dashboard-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    dependencies: {
      github: {
        status: 'unknown',
        configured: !!process.env.GITHUB_TOKEN
      }
    }
  }

  // Check GitHub API connectivity
  if (process.env.GITHUB_TOKEN) {
    try {
      const GitHubService = require('../services/github')
      const github = new GitHubService()
      await github.testConnection()
      health.dependencies.github.status = 'healthy'
    } catch (error) {
      health.dependencies.github.status = 'unhealthy'
      health.dependencies.github.error = error.message
      health.status = 'degraded'
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(health)
})

module.exports = router
