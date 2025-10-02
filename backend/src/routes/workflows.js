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
  const runs = await getWorkflowRuns(req.params.workflowId, req.query)
  res.json(runs)
})

module.exports = router
