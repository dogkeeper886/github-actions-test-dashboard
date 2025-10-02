const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowRuns } = require('../services/github')
const WorkflowRun = require('../models/WorkflowRun')
const DataRecorderService = require('../services/dataRecorder')

const dataRecorder = new DataRecorderService()

// Get all workflows with enhanced metadata
router.get('/', async (req, res) => {
  try {
    const workflows = await getWorkflows()
    
    // Enhance each workflow with database statistics
    const enhancedWorkflows = await Promise.all(
      workflows.map(async (workflow) => {
        const summary = await dataRecorder.getWorkflowSummary(workflow.id.toString())
        
        return {
          id: workflow.id,
          name: workflow.name,
          status: workflow.state,
          latestRun: summary.latestRun ? {
            id: summary.latestRun.id,
            status: summary.latestRun.status,
            conclusion: summary.latestRun.conclusion,
            createdAt: summary.latestRun.created_at,
            runNumber: summary.latestRun.run_number,
            duration: summary.latestRun.duration
          } : null,
          stats: {
            totalRuns: summary.totalRuns,
            successRate: Math.round(summary.successRate * 10) / 10,
            avgDuration: summary.latestRun?.duration || null
          }
        }
      })
    )
    
    res.json({ workflows: enhancedWorkflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get specific workflow by ID
router.get('/:workflowId', async (req, res) => {
  try {
    const workflows = await getWorkflows()
    const workflow = workflows.find(w => w.id == req.params.workflowId)
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    const summary = await dataRecorder.getWorkflowSummary(req.params.workflowId)
    
    res.json({
      ...workflow,
      stats: summary
    })
  } catch (error) {
    console.error('Error fetching workflow:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get workflow runs with enhanced metadata and pagination
router.get('/:workflowId/runs', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, conclusion } = req.query
    
    // Get runs from database with filtering and pagination
    const options = {
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    }
    
    if (status) options.status = status
    if (conclusion) options.conclusion = conclusion
    
    const runs = await WorkflowRun.findByWorkflowId(req.params.workflowId, options)
    
    // Get total count for pagination
    const allRuns = await WorkflowRun.findByWorkflowId(req.params.workflowId)
    const total = allRuns.length
    
    // Enhance runs with file summaries
    const enhancedRuns = await Promise.all(
      runs.map(async (run) => {
        // Get file summary from ExtractedFile model
        const ExtractedFile = require('../models/ExtractedFile')
        const files = await ExtractedFile.findByRunIdGrouped(run.id)
        
        const fileSummary = {
          totalFiles: Object.values(files).reduce((sum, arr) => sum + arr.length, 0),
          fileTypes: {
            images: files.images?.length || 0,
            json: files.json?.length || 0,
            text: files.text?.length || 0,
            binary: files.binary?.length || 0
          }
        }
        
        return {
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
          },
          branch: run.head_branch,
          event: run.event,
          fileSummary
        }
      })
    )
    
    res.json({
      runs: enhancedRuns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error fetching workflow runs:', error)
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
