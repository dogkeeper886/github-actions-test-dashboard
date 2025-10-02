const { getWorkflows, getWorkflowRuns } = require('./github')
const WorkflowProcessorService = require('./workflowProcessor')
const DataRecorderService = require('./dataRecorder')

class DataCollectorService {
  constructor() {
    this.pollInterval = parseInt(process.env.POLL_INTERVAL_MINUTES) || 5
    this.isRunning = false
    this.isCollecting = false
    this.workflowProcessor = new WorkflowProcessorService()
    this.dataRecorder = new DataRecorderService()
  }

  /**
   * Start periodic data collection
   */
  async start() {
    if (this.isRunning) {
      console.log('Data collector already running')
      return
    }

    console.log(`🔄 Starting periodic data collection (${this.pollInterval}m intervals)`)
    this.isRunning = true
    
    // Run initial collection immediately on startup
    await this.collectNewData()
    
    // Then schedule periodic polls
    this.scheduleNextPoll()
  }

  /**
   * Stop periodic data collection
   */
  stop() {
    console.log('⏹️ Stopping periodic data collection')
    this.isRunning = false
  }

  /**
   * Schedule the next polling cycle
   */
  scheduleNextPoll() {
    if (!this.isRunning) return

    setTimeout(() => {
      this.collectNewData()
        .then(() => {
          console.log(`✅ Data collection completed, next poll in ${this.pollInterval} minutes`)
          this.scheduleNextPoll()
        })
        .catch(err => {
          console.error('❌ Data collection failed:', err)
          console.log(`🔄 Continuing despite error, next poll in ${this.pollInterval} minutes`)
          this.scheduleNextPoll() // Continue despite errors - CLAUDE.md compliant
        })
    }, this.pollInterval * 60 * 1000)
  }

  /**
   * Collect new workflow data since last sync
   */
  async collectNewData() {
    if (this.isCollecting) {
      console.log('⏳ Collection already in progress, skipping')
      throw new Error('Collection already in progress')
    }

    try {
      this.isCollecting = true
      console.log('🔍 Checking for new workflow data...')
      
      const startTime = Date.now()
      let totalNewRuns = 0
      let totalNewFiles = 0
      let processedWorkflows = 0

      // Get last sync timestamp for incremental updates
      const lastSync = await this.getLastSyncTimestamp()
      console.log(`Last sync: ${lastSync ? new Date(lastSync).toISOString() : 'never'}`)

      // Get all workflows and ensure they're recorded
      const workflows = await getWorkflows()
      await this.dataRecorder.recordWorkflows(workflows)

      // Process each workflow for new runs
      for (const workflow of workflows) {
        try {
          console.log(`📋 Checking workflow: ${workflow.name}`)

          // Get runs newer than last sync
          const options = { per_page: 50 }
          if (lastSync) {
            // GitHub API uses ISO 8601 format for created filter
            options.created = `>${new Date(lastSync).toISOString()}`
          }

          const runsData = await getWorkflowRuns(workflow.id, options)
          const runs = runsData.workflow_runs || []

          if (runs.length === 0) {
            console.log(`  No new runs for ${workflow.name}`)
            continue
          }

          console.log(`  Found ${runs.length} new runs for ${workflow.name}`)

          // Process new runs
          const results = await this.workflowProcessor.processMultipleRuns(runs)

          // Count successful processing
          const newRuns = results.filter(r => r.success && !r.skipped).length
          const newFiles = results.reduce((sum, r) => sum + (r.totalFiles || 0), 0)

          totalNewRuns += newRuns
          totalNewFiles += newFiles
          processedWorkflows++

          console.log(`  ✅ Processed ${newRuns} new runs with ${newFiles} files`)

        } catch (error) {
          console.error(`❌ Failed to process workflow ${workflow.name}:`, error)
          // Continue with other workflows - don't let one failure stop everything
        }
      }

      // Update last sync timestamp
      await this.updateLastSyncTimestamp()

      const duration = Date.now() - startTime
      console.log(`🎉 Periodic collection completed in ${duration}ms`)
      console.log(`📊 Summary: ${totalNewRuns} new runs, ${totalNewFiles} new files across ${processedWorkflows} workflows`)

      return {
        success: true,
        duration,
        summary: {
          processedWorkflows,
          totalWorkflows: workflows.length,
          newRuns: totalNewRuns,
          newFiles: totalNewFiles
        }
      }

    } catch (error) {
      console.error('❌ Periodic data collection failed:', error)
      throw error
    } finally {
      this.isCollecting = false
    }
  }

  /**
   * Get the timestamp of the last successful sync
   * @returns {number|null} Timestamp in milliseconds, or null if never synced
   */
  async getLastSyncTimestamp() {
    try {
      const { getDatabase } = require('../database/connection')
      const db = await getDatabase()

      // Create sync_status table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS sync_status (
          id SERIAL PRIMARY KEY,
          last_sync_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)

      const result = await db.query(
        'SELECT last_sync_at FROM sync_status ORDER BY id DESC LIMIT 1'
      )

      if (result.rows.length === 0) {
        return null // Never synced
      }

      return new Date(result.rows[0].last_sync_at).getTime()

    } catch (error) {
      console.error('Error getting last sync timestamp:', error)
      return null // Assume never synced on error
    }
  }

  /**
   * Update the last sync timestamp to now
   */
  async updateLastSyncTimestamp() {
    try {
      const { getDatabase } = require('../database/connection')
      const db = await getDatabase()

      await db.query(
        'INSERT INTO sync_status (last_sync_at) VALUES (NOW())'
      )

      console.log('📅 Updated last sync timestamp')

    } catch (error) {
      console.error('Error updating last sync timestamp:', error)
      // Don't throw - this is not critical for operation
    }
  }

  /**
   * Force an immediate data collection (manual trigger)
   * @returns {Object} Collection results
   */
  async forceCollection() {
    console.log('🔄 Force collection triggered')
    return await this.collectNewData()
  }

  /**
   * Get collection status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isCollecting: this.isCollecting,
      pollInterval: this.pollInterval,
      nextPollIn: this.isRunning ? `${this.pollInterval} minutes` : 'stopped'
    }
  }
}

module.exports = DataCollectorService
