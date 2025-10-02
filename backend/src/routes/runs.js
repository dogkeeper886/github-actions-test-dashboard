const express = require('express')
const router = express.Router()
const { getWorkflowRunJobs, getWorkflowRunArtifacts, processTestResults } = require('../services/github')
const WorkflowRun = require('../models/WorkflowRun')
const ExtractedFile = require('../models/ExtractedFile')
const WorkflowProcessorService = require('../services/workflowProcessor')

const workflowProcessor = new WorkflowProcessorService()

// Get run details by ID with enhanced data
router.get('/:runId', async (req, res) => {
  try {
    // Get run data from database
    const run = await WorkflowRun.findById(req.params.runId)
    
    if (!run) {
      return res.status(404).json({ error: 'Run not found' })
    }
    
    // Get jobs and artifacts from GitHub API (for completeness)
    const jobs = await getWorkflowRunJobs(req.params.runId)
    const artifacts = await getWorkflowRunArtifacts(req.params.runId)
    
    res.json({ 
      run: {
        id: run.id,
        workflowId: run.workflow_id,
        workflowName: run.workflow_name,
        runNumber: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        updatedAt: run.updated_at,
        duration: run.duration,
        commit: {
          sha: run.head_sha,
          message: run.commit_message,
          author: run.commit_author
        },
        branch: run.head_branch,
        event: run.event
      },
      jobs, 
      artifacts 
    })
  } catch (error) {
    console.error('Error fetching run details:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get run jobs
router.get('/:runId/jobs', async (req, res) => {
  try {
    const jobs = await getWorkflowRunJobs(req.params.runId)
    res.json(jobs)
  } catch (error) {
    console.error('Error fetching run jobs:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get run artifacts
router.get('/:runId/artifacts', async (req, res) => {
  try {
    const artifacts = await getWorkflowRunArtifacts(req.params.runId)
    res.json(artifacts)
  } catch (error) {
    console.error('Error fetching run artifacts:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all files for a run (categorized)
router.get('/:runId/files', async (req, res) => {
  try {
    // Get run data
    const run = await WorkflowRun.findById(req.params.runId)
    
    if (!run) {
      return res.status(404).json({ error: 'Run not found' })
    }
    
    // Get all files grouped by type
    const files = await ExtractedFile.findByRunIdGrouped(req.params.runId)
    
    // Get artifacts summary
    const artifacts = await getWorkflowRunArtifacts(req.params.runId)
    
    const summary = {
      totalFiles: Object.values(files).reduce((sum, arr) => sum + arr.length, 0),
      fileTypes: {
        images: files.images?.length || 0,
        json: files.json?.length || 0,
        text: files.text?.length || 0,
        binary: files.binary?.length || 0
      }
    }
    
    res.json({
      run: {
        id: run.id,
        runNumber: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        createdAt: run.created_at,
        duration: run.duration,
        commit: {
          sha: run.head_sha,
          message: run.commit_message,
          author: run.commit_author
        }
      },
      summary,
      files,
      artifacts: artifacts.map(a => ({
        id: a.id,
        name: a.name,
        size: a.size,
        expired: a.expired
      }))
    })
  } catch (error) {
    console.error('Error fetching run files:', error)
    res.status(500).json({ error: error.message })
  }
})

// Process and record a run (manual trigger)
router.post('/:runId/process', async (req, res) => {
  try {
    console.log(`Manual processing triggered for run ${req.params.runId}`)
    
    const result = await workflowProcessor.processAndRecordRun(req.params.runId)
    
    res.json({
      success: true,
      message: 'Run processed and recorded successfully',
      result
    })
  } catch (error) {
    console.error('Error processing run:', error)
    res.status(500).json({ 
      success: false,
      error: error.message 
    })
  }
})

// Legacy endpoint - process and get test results for a run
router.get('/:runId/test-results', async (req, res) => {
  try {
    const results = await processTestResults(req.params.runId)
    res.json(results)
  } catch (error) {
    console.error('Error processing test results:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
