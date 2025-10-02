const express = require('express')
const router = express.Router()
const GitHubService = require('../services/github')

// Get all workflows
router.get('/', async (req, res) => {
  try {
    const github = new GitHubService()
    const workflows = await github.getWorkflows()
    res.json({ workflows })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get specific workflow by ID
router.get('/:workflowId', async (req, res) => {
  try {
    const github = new GitHubService()
    const workflows = await github.getWorkflows()
    const workflow = workflows.find(w => w.id.toString() === req.params.workflowId)
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    res.json({ workflow })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get workflow runs
router.get('/:workflowId/runs', async (req, res) => {
  try {
    const github = new GitHubService()
    const options = {
      per_page: parseInt(req.query.per_page) || 30,
      page: parseInt(req.query.page) || 1,
      status: req.query.status,
      branch: req.query.branch
    }
    
    const runs = await github.getWorkflowRuns(req.params.workflowId, options)
    res.json(runs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
