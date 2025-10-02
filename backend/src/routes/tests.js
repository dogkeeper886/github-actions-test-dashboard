const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs-extra')


// Serve screenshot files
router.get('/screenshots/:filename', (req, res) => {
  const { filename } = req.params
  const screenshotPath = process.env.SCREENSHOT_STORAGE_PATH || './data/screenshots'
  const filePath = path.join(screenshotPath, filename)
  
  res.sendFile(path.resolve(filePath))
})

module.exports = router
