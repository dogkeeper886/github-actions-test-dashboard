const express = require('express')
const router = express.Router()
const { getWorkflows, getWorkflowRuns } = require('../services/github')
const WorkflowProcessorService = require('../services/workflowProcessor')
const DataRecorderService = require('../services/dataRecorder')

const workflowProcessor = new WorkflowProcessorService()
const dataRecorder = new DataRecorderService()

// Manual refresh - collect and process latest workflow data
router.post('/', async (req, res) => {
  try {
    console.log('🔄 Manual refresh triggered')
    
    const startTime = Date.now()
    let totalNewRuns = 0
    let totalNewFiles = 0
    let processedWorkflows = 0
    
    // Get all workflows and record them first
    const workflows = await getWorkflows()
    console.log(`Found ${workflows.length} workflows`)
    
    // Record workflows in database first (required for foreign key constraints)
    await dataRecorder.recordWorkflows(workflows)
    console.log(`✅ Recorded ${workflows.length} workflows in database`)
    
    for (const workflow of workflows) {
      try {
        console.log(`Processing workflow: ${workflow.name}`)
        
        // Get recent runs (last 10)
        const runsData = await getWorkflowRuns(workflow.id, { per_page: 10 })
        const runs = runsData.workflow_runs || []
        
        console.log(`Found ${runs.length} recent runs for ${workflow.name}`)
        
        // Process each run
        const results = await workflowProcessor.processMultipleRuns(runs)
        
        // Count successful processing
        const newRuns = results.filter(r => r.success && !r.skipped).length
        const newFiles = results.reduce((sum, r) => sum + (r.totalFiles || 0), 0)
        
        totalNewRuns += newRuns
        totalNewFiles += newFiles
        processedWorkflows++
        
        console.log(`✅ Processed ${newRuns} new runs with ${newFiles} files for ${workflow.name}`)
        
      } catch (error) {
        console.error(`❌ Failed to process workflow ${workflow.name}:`, error)
        // Continue with other workflows
      }
    }
    
    const duration = Date.now() - startTime
    
    console.log(`✅ Manual refresh completed in ${duration}ms`)
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        processedWorkflows,
        totalWorkflows: workflows.length,
        newRuns: totalNewRuns,
        newFiles: totalNewFiles
      }
    })
    
  } catch (error) {
    console.error('❌ Manual refresh failed:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Get refresh status/history (future enhancement)
router.get('/status', async (req, res) => {
  res.json({
    status: 'ready',
    lastRefresh: null, // TODO: Store in database
    nextAutoRefresh: null // TODO: Implement periodic refresh
  })
})

module.exports = router
