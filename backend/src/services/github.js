const { Octokit } = require('@octokit/rest')
const fs = require('fs-extra')
const path = require('path')
const yauzl = require('yauzl')
const axios = require('axios')

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    })
    this.owner = process.env.GITHUB_OWNER
    this.repo = process.env.GITHUB_REPO
    this.screenshotPath = process.env.SCREENSHOT_STORAGE_PATH || './data/screenshots'
  }

  async testConnection() {
    try {
      const { data } = await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      })
      return { success: true, repo: data.full_name }
    } catch (error) {
      throw new Error(`GitHub API connection failed: ${error.message}`)
    }
  }

  async getWorkflows() {
    try {
      const { data } = await this.octokit.rest.actions.listRepoWorkflows({
        owner: this.owner,
        repo: this.repo
      })
      
      return data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        path: workflow.path,
        state: workflow.state,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        url: workflow.html_url
      }))
    } catch (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`)
    }
  }

  async getWorkflowRuns(workflowId, options = {}) {
    try {
      const params = {
        owner: this.owner,
        repo: this.repo,
        workflow_id: workflowId,
        per_page: options.per_page || 30,
        page: options.page || 1
      }

      if (options.status) params.status = options.status
      if (options.branch) params.branch = options.branch

      const { data } = await this.octokit.rest.actions.listWorkflowRuns(params)
      
      return {
        total_count: data.total_count,
        runs: data.workflow_runs.map(run => ({
          id: run.id,
          name: run.name,
          head_branch: run.head_branch,
          head_sha: run.head_sha,
          status: run.status,
          conclusion: run.conclusion,
          created_at: run.created_at,
          updated_at: run.updated_at,
          run_number: run.run_number,
          event: run.event,
          actor: run.actor ? {
            login: run.actor.login,
            avatar_url: run.actor.avatar_url
          } : null,
          run_started_at: run.run_started_at,
          url: run.html_url
        }))
      }
    } catch (error) {
      throw new Error(`Failed to fetch workflow runs: ${error.message}`)
    }
  }

  async getWorkflowRunJobs(runId) {
    try {
      const { data } = await this.octokit.rest.actions.listJobsForWorkflowRun({
        owner: this.owner,
        repo: this.repo,
        run_id: runId
      })

      return data.jobs.map(job => ({
        id: job.id,
        name: job.name,
        status: job.status,
        conclusion: job.conclusion,
        started_at: job.started_at,
        completed_at: job.completed_at,
        steps: job.steps.map(step => ({
          name: step.name,
          status: step.status,
          conclusion: step.conclusion,
          number: step.number,
          started_at: step.started_at,
          completed_at: step.completed_at
        }))
      }))
    } catch (error) {
      throw new Error(`Failed to fetch workflow run jobs: ${error.message}`)
    }
  }

  async getWorkflowRunArtifacts(runId) {
    try {
      const { data } = await this.octokit.rest.actions.listWorkflowRunArtifacts({
        owner: this.owner,
        repo: this.repo,
        run_id: runId
      })

      return data.artifacts.map(artifact => ({
        id: artifact.id,
        name: artifact.name,
        size_in_bytes: artifact.size_in_bytes,
        created_at: artifact.created_at,
        expired: artifact.expired,
        expires_at: artifact.expires_at,
        archive_download_url: artifact.archive_download_url
      }))
    } catch (error) {
      throw new Error(`Failed to fetch workflow run artifacts: ${error.message}`)
    }
  }

  async downloadArtifact(artifactId, downloadPath) {
    try {
      // Get download URL
      const { data } = await this.octokit.rest.actions.downloadArtifact({
        owner: this.owner,
        repo: this.repo,
        artifact_id: artifactId,
        archive_format: 'zip'
      })

      // Download the zip file
      const response = await axios({
        method: 'GET',
        url: data.url,
        responseType: 'stream'
      })

      // Ensure download directory exists
      await fs.ensureDir(path.dirname(downloadPath))

      // Save the zip file
      const writer = fs.createWriteStream(downloadPath)
      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(downloadPath))
        writer.on('error', reject)
      })
    } catch (error) {
      throw new Error(`Failed to download artifact: ${error.message}`)
    }
  }

  async extractArtifact(zipPath, extractPath) {
    return new Promise((resolve, reject) => {
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err)

        const extractedFiles = []

        zipfile.readEntry()
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            zipfile.readEntry()
          } else {
            // File entry
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err)

              const filePath = path.join(extractPath, entry.fileName)
              fs.ensureDirSync(path.dirname(filePath))

              const writeStream = fs.createWriteStream(filePath)
              readStream.pipe(writeStream)

              writeStream.on('close', () => {
                extractedFiles.push(filePath)
                zipfile.readEntry()
              })
            })
          }
        })

        zipfile.on('end', () => {
          resolve(extractedFiles)
        })
      })
    })
  }

  async processTestResults(runId) {
    try {
      // Get artifacts for this run
      const artifacts = await this.getWorkflowRunArtifacts(runId)
      
      // Look for test result artifacts (common names)
      const testArtifacts = artifacts.filter(artifact => 
        artifact.name.toLowerCase().includes('test') ||
        artifact.name.toLowerCase().includes('results') ||
        artifact.name.toLowerCase().includes('report') ||
        artifact.name.toLowerCase().includes('playwright') ||
        artifact.name.toLowerCase().includes('cypress')
      )

      const results = {
        runId,
        tests: [],
        screenshots: [],
        logs: []
      }

      for (const artifact of testArtifacts) {
        if (artifact.expired) continue

        try {
          // Download and extract artifact
          const downloadPath = path.join('./temp', `${artifact.id}.zip`)
          const extractPath = path.join('./temp', `extracted_${artifact.id}`)

          await this.downloadArtifact(artifact.id, downloadPath)
          const extractedFiles = await this.extractArtifact(downloadPath, extractPath)

          // Process extracted files
          for (const filePath of extractedFiles) {
            const fileName = path.basename(filePath)
            const ext = path.extname(fileName).toLowerCase()

            if (ext === '.json' && fileName.includes('results')) {
              // Parse test results JSON
              const testData = await fs.readJson(filePath)
              results.tests.push(...this.parseTestResults(testData, artifact.name))
            } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
              // Copy screenshots to storage
              const screenshotName = `${runId}_${Date.now()}_${fileName}`
              const screenshotPath = path.join(this.screenshotPath, screenshotName)
              await fs.ensureDir(this.screenshotPath)
              await fs.copy(filePath, screenshotPath)
              
              results.screenshots.push({
                originalName: fileName,
                storedName: screenshotName,
                path: screenshotPath,
                artifactName: artifact.name
              })
            } else if (ext === '.log' || ext === '.txt') {
              // Store log files
              const logContent = await fs.readFile(filePath, 'utf8')
              results.logs.push({
                name: fileName,
                content: logContent,
                artifactName: artifact.name
              })
            }
          }

          // Clean up temp files
          await fs.remove(downloadPath)
          await fs.remove(extractPath)
        } catch (error) {
          console.error(`Error processing artifact ${artifact.name}:`, error.message)
        }
      }

      return results
    } catch (error) {
      throw new Error(`Failed to process test results: ${error.message}`)
    }
  }

  parseTestResults(testData, artifactName) {
    // This is a flexible parser that handles common test result formats
    const tests = []

    try {
      // Handle Playwright format
      if (testData.suites) {
        this.parsePlaywrightResults(testData, tests, artifactName)
      }
      // Handle Jest format
      else if (testData.testResults) {
        this.parseJestResults(testData, tests, artifactName)
      }
      // Handle generic format
      else if (Array.isArray(testData.tests)) {
        tests.push(...testData.tests.map(test => ({
          name: test.name || test.title,
          status: test.status || test.state,
          duration: test.duration || test.time,
          error: test.error || test.err,
          file: test.file || test.fullFile,
          artifactName
        })))
      }
    } catch (error) {
      console.error(`Error parsing test results from ${artifactName}:`, error.message)
    }

    return tests
  }

  parsePlaywrightResults(data, tests, artifactName) {
    const traverse = (suites) => {
      for (const suite of suites) {
        if (suite.tests) {
          for (const test of suite.tests) {
            tests.push({
              name: test.title,
              status: test.outcome,
              duration: test.results?.[0]?.duration,
              error: test.results?.[0]?.error?.message,
              file: suite.file,
              suite: suite.title,
              artifactName
            })
          }
        }
        if (suite.suites) {
          traverse(suite.suites)
        }
      }
    }
    traverse(data.suites)
  }

  parseJestResults(data, tests, artifactName) {
    for (const testResult of data.testResults) {
      for (const assertionResult of testResult.assertionResults) {
        tests.push({
          name: assertionResult.title,
          status: assertionResult.status,
          duration: assertionResult.duration,
          error: assertionResult.failureMessages?.[0],
          file: testResult.name,
          artifactName
        })
      }
    }
  }
}

module.exports = GitHubService
