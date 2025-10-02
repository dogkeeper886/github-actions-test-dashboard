const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')

// Search tests across runs (placeholder for future DB implementation)
router.get('/search', async (req, res) => {
  try {
    const { q, status, file } = req.query
    
    // This will be implemented with database later
    // For now, return empty results
    res.json({
      query: q,
      filters: { status, file },
      results: [],
      total: 0,
      message: 'Search functionality will be available after database implementation'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get test history (placeholder for future DB implementation)
router.get('/:testName/history', async (req, res) => {
  try {
    const { testName } = req.params
    const { limit = 50 } = req.query
    
    // This will be implemented with database later
    res.json({
      testName,
      history: [],
      total: 0,
      message: 'Test history will be available after database implementation'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Serve screenshot files
router.get('/screenshots/:filename', async (req, res) => {
  try {
    const { filename } = req.params
    const screenshotPath = process.env.SCREENSHOT_STORAGE_PATH || './data/screenshots'
    const filePath = path.join(screenshotPath, filename)
    
    // Check if file exists
    if (!await fs.pathExists(filePath)) {
      return res.status(404).json({ error: 'Screenshot not found' })
    }
    
    // Serve the image file
    res.sendFile(path.resolve(filePath))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
