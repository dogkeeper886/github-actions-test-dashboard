const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')

// Search tests across runs (placeholder for future DB implementation)
router.get('/search', async (req, res) => {
  const { q, status, file } = req.query
  
  res.json({
    query: q,
    filters: { status, file },
    results: [],
    total: 0,
    message: 'Search functionality will be available after database implementation'
  })
})

// Get test history (placeholder for future DB implementation)
router.get('/:testName/history', async (req, res) => {
  const { testName } = req.params
  const { limit = 50 } = req.query
  
  res.json({
    testName,
    history: [],
    total: 0,
    message: 'Test history will be available after database implementation'
  })
})

// Serve screenshot files
router.get('/screenshots/:filename', async (req, res) => {
  const { filename } = req.params
  const screenshotPath = process.env.SCREENSHOT_STORAGE_PATH || './data/screenshots'
  const filePath = path.join(screenshotPath, filename)
  
  if (!await fs.pathExists(filePath)) {
    return res.status(404).json({ error: 'Screenshot not found' })
  }
  
  res.sendFile(path.resolve(filePath))
})

module.exports = router
