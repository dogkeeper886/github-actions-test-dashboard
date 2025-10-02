const express = require('express')
const path = require('path')
const router = express.Router()

router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../../data/screenshots', req.params.filename)
  res.sendFile(filePath)
})

module.exports = router

