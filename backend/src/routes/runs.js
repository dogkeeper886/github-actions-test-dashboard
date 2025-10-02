const express = require('express')
const router = express.Router()
const { getWorkflowRunJobs, getWorkflowRunArtifacts, processTestResults } = require('../services/github')

// Get run details by ID
router.get('/:runId', async (req, res) => {
  const jobs = await getWorkflowRunJobs(req.params.runId)
  const artifacts = await getWorkflowRunArtifacts(req.params.runId)
  
  res.json({ jobs, artifacts })
})

// Get run jobs
router.get('/:runId/jobs', async (req, res) => {
  const jobs = await getWorkflowRunJobs(req.params.runId)
  res.json(jobs)
})

// Get run artifacts
router.get('/:runId/artifacts', async (req, res) => {
  const artifacts = await getWorkflowRunArtifacts(req.params.runId)
  res.json(artifacts)
})

// Process and get test results for a run
router.get('/:runId/test-results', async (req, res) => {
  const results = await processTestResults(req.params.runId)
  res.json(results)
})

module.exports = router
