const { Octokit } = require('@octokit/rest')
const fs = require('fs-extra')
const path = require('path')
const yauzl = require('yauzl')
const axios = require('axios')

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
const owner = process.env.GITHUB_OWNER
const repo = process.env.GITHUB_REPO
const screenshotPath = process.env.SCREENSHOT_STORAGE_PATH || './data/screenshots'

async function getWorkflows() {
  const { data } = await octokit.rest.actions.listRepoWorkflows({ owner, repo })
  
  return data.workflows.map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    path: workflow.path,
    state: workflow.state,
    created_at: workflow.created_at,
    updated_at: workflow.updated_at,
    url: workflow.html_url
  }))
}

async function getWorkflowRuns(workflowId, options = {}) {
  const params = {
    owner,
    repo,
    workflow_id: workflowId,
    per_page: options.per_page || 30,
    page: options.page || 1
  }

  if (options.status) params.status = options.status
  if (options.branch) params.branch = options.branch

  const { data } = await octokit.rest.actions.listWorkflowRuns(params)
  
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
}

async function getWorkflowRunJobs(runId) {
  const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
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
}

async function getWorkflowRunArtifacts(runId) {
  const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
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
}

async function downloadArtifact(artifactId, downloadPath) {
  const { data } = await octokit.rest.actions.downloadArtifact({
    owner,
    repo,
    artifact_id: artifactId,
    archive_format: 'zip'
  })

  const response = await axios({
    method: 'GET',
    url: data.url,
    responseType: 'stream'
  })

  await fs.ensureDir(path.dirname(downloadPath))
  const writer = fs.createWriteStream(downloadPath)
  response.data.pipe(writer)

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(downloadPath))
    writer.on('error', reject)
  })
}

async function extractArtifact(zipPath, extractPath) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)

      const extractedFiles = []
      zipfile.readEntry()
      
      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
        } else {
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

      zipfile.on('end', () => resolve(extractedFiles))
    })
  })
}

async function processTestResults(runId) {
  const artifacts = await getWorkflowRunArtifacts(runId)
  
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

    const downloadPath = path.join('./temp', `${artifact.id}.zip`)
    const extractPath = path.join('./temp', `extracted_${artifact.id}`)

    await downloadArtifact(artifact.id, downloadPath)
    const extractedFiles = await extractArtifact(downloadPath, extractPath)

    for (const filePath of extractedFiles) {
      const fileName = path.basename(filePath)
      const ext = path.extname(fileName).toLowerCase()

      if (ext === '.json' && fileName.includes('results')) {
        const testData = await fs.readJson(filePath)
        results.tests.push(...parseTestResults(testData, artifact.name))
      } else if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const screenshotName = `${runId}_${Date.now()}_${fileName}`
        const screenshotStorePath = path.join(screenshotPath, screenshotName)
        await fs.ensureDir(screenshotPath)
        await fs.copy(filePath, screenshotStorePath)
        
        results.screenshots.push({
          originalName: fileName,
          storedName: screenshotName,
          path: screenshotStorePath,
          artifactName: artifact.name
        })
      } else if (ext === '.log' || ext === '.txt') {
        const logContent = await fs.readFile(filePath, 'utf8')
        results.logs.push({
          name: fileName,
          content: logContent,
          artifactName: artifact.name
        })
      }
    }

    await fs.remove(downloadPath)
    await fs.remove(extractPath)
  }

  return results
}

function parseTestResults(testData, artifactName) {
  const tests = []

  if (testData.suites) {
    parsePlaywrightResults(testData, tests, artifactName)
  } else if (testData.testResults) {
    parseJestResults(testData, tests, artifactName)
  } else if (Array.isArray(testData.tests)) {
    tests.push(...testData.tests.map(test => ({
      name: test.name || test.title,
      status: test.status || test.state,
      duration: test.duration || test.time,
      error: test.error || test.err,
      file: test.file || test.fullFile,
      artifactName
    })))
  }

  return tests
}

function parsePlaywrightResults(data, tests, artifactName) {
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

function parseJestResults(data, tests, artifactName) {
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

module.exports = {
  getWorkflows,
  getWorkflowRuns,
  getWorkflowRunJobs,
  getWorkflowRunArtifacts,
  processTestResults
}