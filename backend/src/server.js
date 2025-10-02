const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/workflows', require('./routes/workflows'))
app.use('/api/runs', require('./routes/runs'))
app.use('/api/tests', require('./routes/tests'))

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = app
