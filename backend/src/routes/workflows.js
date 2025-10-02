const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowRuns } = require('../services/github')

// Get all workflows
router.get('/', async (req, res) => {
  const workflows = await getWorkflows()
  res.json({ workflows })
})

// Get specific workflow by ID
router.get('/:workflowId', async (req, res) => {
  const workflows = await getWorkflows()
  const workflow = workflows.find(w => w.id.toString() === req.params.workflowId)
  res.json({ workflow })
})

// Get workflow runs
router.get('/:workflowId/runs', async (req, res) => {
  const options = {
    per_page: parseInt(req.query.per_page) || 30,
    page: parseInt(req.query.page) || 1,
    status: req.query.status,
    branch: req.query.branch
  }
  
  const runs = await getWorkflowRuns(req.params.workflowId, options)
  res.json(runs)
})

module.exports = router
