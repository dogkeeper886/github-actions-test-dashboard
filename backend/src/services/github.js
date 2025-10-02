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
  return data.workflows
}

async function getWorkflowRuns(workflowId, options = {}) {
  const params = {
    owner,
    repo,
    workflow_id: workflowId,
    per_page: 30,
    page: 1,
    ...options
  }

  const { data } = await octokit.rest.actions.listWorkflowRuns(params)
  return data
}

async function getWorkflowRunJobs(runId) {
  const { data } = await octokit.rest.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: runId
  })
  return data.jobs
}

async function getWorkflowRunArtifacts(runId) {
  const { data } = await octokit.rest.actions.listWorkflowRunArtifacts({
    owner,
    repo,
    run_id: runId
  })
  return data.artifacts
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

function isTestArtifact(artifact) {
  return artifact.name.toLowerCase().includes('test') ||
         artifact.name.toLowerCase().includes('results') ||
         artifact.name.toLowerCase().includes('report') ||
         artifact.name.toLowerCase().includes('playwright') ||
         artifact.name.toLowerCase().includes('cypress')
}

async function processArtifactFile(filePath, runId, artifactName) {
  const fileName = path.basename(filePath)
  const ext = path.extname(fileName).toLowerCase()

  if (ext === '.json' && fileName.includes('results')) {
    const testData = await fs.readJson(filePath)
    return { type: 'tests', data: parseTestResults(testData, artifactName) }
  }
  
  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    const screenshotName = `${runId}_${Date.now()}_${fileName}`
    const screenshotStorePath = path.join(screenshotPath, screenshotName)
    await fs.ensureDir(screenshotPath)
    await fs.copy(filePath, screenshotStorePath)
    
    return {
      type: 'screenshots',
      data: {
        originalName: fileName,
        storedName: screenshotName,
        path: screenshotStorePath,
        artifactName
      }
    }
  }
  
  if (ext === '.log' || ext === '.txt') {
    const logContent = await fs.readFile(filePath, 'utf8')
    return {
      type: 'logs',
      data: {
        name: fileName,
        content: logContent,
        artifactName
      }
    }
  }
  
  return null
}

async function processTestResults(runId) {
  const artifacts = await getWorkflowRunArtifacts(runId)
  const testArtifacts = artifacts.filter(isTestArtifact)

  const results = { runId, tests: [], screenshots: [], logs: [] }

  for (const artifact of testArtifacts) {
    if (artifact.expired) continue

    const downloadPath = path.join('./temp', `${artifact.id}.zip`)
    const extractPath = path.join('./temp', `extracted_${artifact.id}`)

    await downloadArtifact(artifact.id, downloadPath)
    const extractedFiles = await extractArtifact(downloadPath, extractPath)

    for (const filePath of extractedFiles) {
      const processed = await processArtifactFile(filePath, runId, artifact.name)
      if (processed) {
        if (processed.type === 'tests') {
          results.tests.push(...processed.data)
        } else {
          results[processed.type].push(processed.data)
        }
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