const githubService = require('./github')
const DataRecorderService = require('./dataRecorder')

class WorkflowProcessorService {
  constructor() {
    this.dataRecorder = new DataRecorderService()
  }

  /**
   * Process and record a workflow run with all its artifacts
   * @param {string} runId - GitHub workflow run ID
   * @param {Object} runData - Optional run data (if already fetched)
   * @returns {Object} Processing results
   */
  async processAndRecordRun(runId, runData = null) {
    try {
      console.log(`🔄 Processing workflow run: ${runId}`)

      // Check if already processed
      const isAlreadyRecorded = await this.dataRecorder.isRunRecorded(runId)
      if (isAlreadyRecorded) {
        console.log(`⏭️ Run ${runId} already recorded, skipping`)
        return { skipped: true, reason: 'already_recorded' }
      }

      // Get run data if not provided
      if (!runData) {
        console.log(`Fetching run data for ${runId}`)
        // We'll need to add this method to github service
        runData = await this.getRunData(runId)
      }

      // Get jobs and their logs
      const jobs = await githubService.getWorkflowRunJobs(runId)
      console.log(`📋 Found ${jobs.length} jobs for run ${runId}`)
      
      // Get artifacts and process them
      const artifacts = await githubService.getWorkflowRunArtifacts(runId)
      const processedArtifacts = []

      for (const artifact of artifacts) {
        if (artifact.expired) {
          console.log(`⏭️ Skipping expired artifact: ${artifact.name}`)
          continue
        }

        console.log(`📦 Processing artifact: ${artifact.name}`)
        const processedArtifact = await this.processArtifact(runId, artifact)
        processedArtifacts.push(processedArtifact)
      }

      // Record everything in database
      const recordingResult = await this.dataRecorder.recordCompleteRun(runData, processedArtifacts, jobs)

      console.log(`✅ Successfully processed and recorded run ${runId}`)
      return {
        success: true,
        runId,
        ...recordingResult
      }

    } catch (error) {
      console.error(`❌ Failed to process run ${runId}:`, error)
      throw error
    }
  }

  /**
   * Process a single artifact and extract all files
   * @param {string} runId - Workflow run ID
   * @param {Object} artifact - GitHub artifact object
   * @returns {Object} Processed artifact with extracted files
   */
  async processArtifact(runId, artifact) {
    const path = require('path')
    const fs = require('fs-extra')

    try {
      const downloadPath = path.join('./temp', `${artifact.id}.zip`)
      const extractPath = path.join('./temp', `extracted_${artifact.id}`)

      // Download and extract artifact
      await githubService.downloadArtifact(artifact.id, downloadPath)
      const extractedFiles = await githubService.extractArtifact(downloadPath, extractPath)

      // Process each extracted file
      const processedFiles = []
      for (const filePath of extractedFiles) {
        const processedFile = await this.processExtractedFile(filePath, runId, artifact.name)
        if (processedFile) {
          processedFiles.push(processedFile)
        }
      }

      // Clean up temporary files
      await fs.remove(downloadPath)
      await fs.remove(extractPath)

      return {
        ...artifact,
        extractedFiles: processedFiles
      }

    } catch (error) {
      console.error(`Failed to process artifact ${artifact.name}:`, error)
      throw error
    }
  }

  /**
   * Process a single extracted file and categorize it
   * @param {string} filePath - Path to extracted file
   * @param {string} runId - Workflow run ID
   * @param {string} artifactName - Name of parent artifact
   * @returns {Object} Processed file data
   */
  async processExtractedFile(filePath, runId, artifactName) {
    const path = require('path')
    const fs = require('fs-extra')
    const crypto = require('crypto')

    try {
      const fileName = path.basename(filePath)
      const ext = path.extname(fileName).toLowerCase()
      const stats = await fs.stat(filePath)
      
      // Generate stored filename with unique hash to avoid collisions
      const hash = crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8)
      const storedFilename = `${runId}_${hash}_${fileName}`
      
      const baseFile = {
        originalPath: path.relative('./temp', filePath),
        size: stats.size,
        storedFilename,
        artifactName
      }

      // Process based on file type
      if (this.isImageFile(ext)) {
        return await this.processImageFile(filePath, runId, baseFile)
      } else if (ext === '.json') {
        return await this.processJsonFile(filePath, baseFile)
      } else if (this.isTextFile(ext)) {
        return await this.processTextFile(filePath, baseFile)
      } else {
        return await this.processBinaryFile(filePath, runId, baseFile)
      }

    } catch (error) {
      console.error(`Failed to process file ${filePath}:`, error)
      return null
    }
  }

  /**
   * Process an image file
   */
  async processImageFile(filePath, runId, baseFile) {
    const path = require('path')
    const fs = require('fs-extra')

    const screenshotDir = './data/screenshots'
    await fs.ensureDir(screenshotDir)
    
    const storedPath = path.join(screenshotDir, baseFile.storedFilename)
    await fs.copy(filePath, storedPath)

    return {
      ...baseFile,
      type: 'image',
      url: `/api/files/${baseFile.storedFilename}`
    }
  }

  /**
   * Process a JSON file
   */
  async processJsonFile(filePath, baseFile) {
    const fs = require('fs-extra')

    try {
      const content = await fs.readFile(filePath, 'utf8')
      const jsonContent = JSON.parse(content)

      return {
        ...baseFile,
        type: 'json',
        content: jsonContent
      }
    } catch (error) {
      console.error(`Failed to parse JSON file ${filePath}:`, error)
      return {
        ...baseFile,
        type: 'text',
        content: await fs.readFile(filePath, 'utf8')
      }
    }
  }

  /**
   * Process a text file
   */
  async processTextFile(filePath, baseFile) {
    const fs = require('fs-extra')

    const content = await fs.readFile(filePath, 'utf8')
    return {
      ...baseFile,
      type: 'text',
      content
    }
  }

  /**
   * Process a binary file
   */
  async processBinaryFile(filePath, runId, baseFile) {
    const path = require('path')
    const fs = require('fs-extra')

    const binaryDir = './data/files'
    await fs.ensureDir(binaryDir)
    
    const storedPath = path.join(binaryDir, baseFile.storedFilename)
    await fs.copy(filePath, storedPath)

    return {
      ...baseFile,
      type: 'binary',
      url: `/api/files/${baseFile.storedFilename}`
    }
  }

  /**
   * Get workflow run data from GitHub API
   */
  async getRunData(runId) {
    const { Octokit } = require('@octokit/rest')
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
    
    const { data } = await octokit.rest.actions.getWorkflowRun({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      run_id: runId
    })
    
    return data
  }

  /**
   * Process multiple workflow runs
   * @param {Array} runs - Array of workflow run objects
   * @returns {Array} Processing results
   */
  async processMultipleRuns(runs) {
    const results = []
    
    for (const run of runs) {
      try {
        const result = await this.processAndRecordRun(run.id, run)
        results.push(result)
      } catch (error) {
        console.error(`Failed to process run ${run.id}:`, error)
        results.push({
          success: false,
          runId: run.id,
          error: error.message
        })
      }
    }
    
    return results
  }

  // Helper methods
  isImageFile(ext) {
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)
  }

  isTextFile(ext) {
    return ['.txt', '.log', '.md', '.csv', '.xml', '.html', '.css', '.js', '.ts'].includes(ext)
  }
}

module.exports = WorkflowProcessorService
