const express = require('express')
const router = express.Router()
const GitHubService = require('../services/github')

// Get run details by ID
router.get('/:runId', async (req, res) => {
  try {
    const github = new GitHubService()
    const jobs = await github.getWorkflowRunJobs(req.params.runId)
    const artifacts = await github.getWorkflowRunArtifacts(req.params.runId)
    
    res.json({
      runId: req.params.runId,
      jobs,
      artifacts
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get run jobs
router.get('/:runId/jobs', async (req, res) => {
  try {
    const github = new GitHubService()
    const jobs = await github.getWorkflowRunJobs(req.params.runId)
    res.json({ jobs })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get run artifacts
router.get('/:runId/artifacts', async (req, res) => {
  try {
    const github = new GitHubService()
    const artifacts = await github.getWorkflowRunArtifacts(req.params.runId)
    res.json({ artifacts })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Process and get test results for a run
router.get('/:runId/test-results', async (req, res) => {
  try {
    const github = new GitHubService()
    const results = await github.processTestResults(req.params.runId)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
