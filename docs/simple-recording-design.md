# Simple Recording Design - Single Repo, Framework Agnostic

## Core Principle: Record What Actually Happens

Just observe and record what GitHub Actions produces, without interpreting or assuming test frameworks.

## What We Record

### 1. Workflow Runs (What Ran)
```javascript
{
  runId: "18171696019",
  workflowId: "173699523", 
  workflowName: "Main Flow Playwright Test",
  status: "completed",
  conclusion: "success",
  createdAt: "2025-10-01T18:22:38Z",
  updatedAt: "2025-10-01T18:26:01Z",
  duration: 218000,
  commit: {
    sha: "e8c0585a6ebdc4280dadde1349cdb7911942b950",
    message: "Fix login flow", 
    author: "john.doe"
  },
  branch: "main",
  event: "push"
}
```

### 2. Artifacts (What Was Saved)
```javascript
{
  runId: "18171696019",
  artifacts: [
    {
      id: "4157692041",
      name: "playwright-test-results", 
      size: 1424441,
      expired: false,
      createdAt: "2025-10-01T18:26:01Z"
    }
  ]
}
```

### 3. Extracted Files (What We Found Inside)
```javascript
{
  runId: "18171696019",
  artifactId: "4157692041", 
  artifactName: "playwright-test-results",
  extractedFiles: [
    {
      path: "test-finished-1.png",
      type: "image",
      size: 102618,
      storedAs: "18171696019_1759378417871_test-finished-1.png",
      url: "/api/files/18171696019_1759378417871_test-finished-1.png"
    },
    {
      path: "results.json", 
      type: "json",
      size: 5420,
      content: { /* whatever was in the JSON */ }
    },
    {
      path: "test.log",
      type: "text", 
      size: 15230,
      content: "Test execution log content..."
    }
  ]
}
```

## Simple Data Model

### Core Tables
```sql
-- What ran
CREATE TABLE workflow_runs (
  id VARCHAR(255) PRIMARY KEY,
  workflow_id VARCHAR(255),
  workflow_name VARCHAR(255),
  status VARCHAR(50),
  conclusion VARCHAR(50), 
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  duration INTEGER,
  commit_sha VARCHAR(255),
  commit_message TEXT,
  commit_author VARCHAR(255),
  branch VARCHAR(255),
  event VARCHAR(100)
);

-- What was saved (artifacts)
CREATE TABLE artifacts (
  id VARCHAR(255) PRIMARY KEY,
  run_id VARCHAR(255),
  name VARCHAR(255),
  size INTEGER,
  expired BOOLEAN,
  created_at TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
);

-- What we found inside artifacts
CREATE TABLE extracted_files (
  id UUID PRIMARY KEY,
  run_id VARCHAR(255),
  artifact_id VARCHAR(255),
  artifact_name VARCHAR(255),
  original_path VARCHAR(500),
  file_type VARCHAR(50), -- image, json, text, binary
  file_size INTEGER,
  stored_filename VARCHAR(255),
  stored_url VARCHAR(500),
  content TEXT, -- for text/json files
  extracted_at TIMESTAMP,
  FOREIGN KEY (run_id) REFERENCES workflow_runs(id),
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
);
```

## Simple API Enhancement

### Enhanced Endpoints (No Framework Assumptions)

#### 1. Workflow Runs with Summary
```
GET /api/workflows/:id/runs
```
```javascript
{
  runs: [
    {
      id: "18171696019",
      workflowId: "173699523",
      workflowName: "Main Flow Playwright Test", 
      status: "completed",
      conclusion: "success",
      createdAt: "2025-10-01T18:22:38Z",
      duration: 218000,
      commit: {
        sha: "e8c0585a...",
        message: "Fix login flow",
        author: "john.doe"
      },
      branch: "main",
      event: "push",
      
      // Simple counts of what we found
      summary: {
        totalArtifacts: 1,
        totalFiles: 25,
        fileTypes: {
          images: 17,
          json: 3, 
          text: 5
        }
      }
    }
  ]
}
```

#### 2. Run Details with All Files
```
GET /api/runs/:runId
```
```javascript
{
  run: {
    id: "18171696019",
    // ... run metadata
  },
  artifacts: [
    {
      id: "4157692041", 
      name: "playwright-test-results",
      size: 1424441,
      fileCount: 25
    }
  ],
  files: {
    images: [
      {
        id: "uuid1",
        originalPath: "test-finished-1.png",
        storedFilename: "18171696019_1759378417871_test-finished-1.png", 
        url: "/api/files/18171696019_1759378417871_test-finished-1.png",
        size: 102618,
        artifactName: "playwright-test-results"
      }
      // ... more images
    ],
    json: [
      {
        id: "uuid2", 
        originalPath: "results.json",
        content: { /* parsed JSON content */ },
        size: 5420,
        artifactName: "playwright-test-results"
      }
    ],
    text: [
      {
        id: "uuid3",
        originalPath: "test.log", 
        content: "Test execution log...",
        size: 15230,
        artifactName: "playwright-test-results"
      }
    ]
  }
}
```

#### 3. File Serving
```
GET /api/files/:filename
```
Serve any extracted file (images, logs, etc.)

## Implementation Plan

### Step 1: Add Database Layer
```javascript
// backend/src/models/database.js
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function initDatabase() {
  const db = await open({
    filename: './data/dashboard.db',
    driver: sqlite3.Database
  })
  
  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT,
      workflow_name TEXT,
      status TEXT,
      conclusion TEXT,
      created_at TEXT,
      updated_at TEXT,
      duration INTEGER,
      commit_sha TEXT,
      commit_message TEXT,
      commit_author TEXT,
      branch TEXT,
      event TEXT
    )
  `)
  
  // ... other tables
  
  return db
}
```

### Step 2: Enhance Data Collection
```javascript
// backend/src/services/dataRecorder.js
async function recordWorkflowRun(runData) {
  // Store run metadata in database
  await db.run(`
    INSERT OR REPLACE INTO workflow_runs 
    (id, workflow_id, workflow_name, status, conclusion, ...)
    VALUES (?, ?, ?, ?, ?, ...)
  `, [runData.id, runData.workflow_id, ...])
}

async function recordExtractedFiles(runId, artifactId, artifactName, files) {
  for (const file of files) {
    await db.run(`
      INSERT INTO extracted_files 
      (id, run_id, artifact_id, artifact_name, original_path, file_type, ...)
      VALUES (?, ?, ?, ?, ?, ?, ...)
    `, [generateId(), runId, artifactId, artifactName, ...])
  }
}
```

### Step 3: Enhance Existing Functions
```javascript
// Modify processTestResults to record everything
async function processTestResults(runId) {
  const artifacts = await getWorkflowRunArtifacts(runId)
  
  // Record artifacts
  for (const artifact of artifacts) {
    await recordArtifact(runId, artifact)
  }
  
  const results = { runId, files: { images: [], json: [], text: [] } }
  
  for (const artifact of artifacts) {
    if (artifact.expired) continue
    
    const files = await extractAndProcessArtifact(artifact, runId)
    
    // Record all extracted files
    await recordExtractedFiles(runId, artifact.id, artifact.name, files)
    
    // Categorize by type
    files.forEach(file => {
      if (file.type === 'image') results.files.images.push(file)
      else if (file.type === 'json') results.files.json.push(file)  
      else if (file.type === 'text') results.files.text.push(file)
    })
  }
  
  return results
}
```

## Benefits of This Approach

1. **Framework Agnostic** - Works with any test tool
2. **Simple** - Just record what we observe
3. **Extensible** - Easy to add interpretation later
4. **CLAUDE.md Compliant** - No assumptions or over-engineering
5. **Debuggable** - Can see exactly what was produced

## What Frontend Gets

- List of workflow runs with basic metadata
- All files extracted from artifacts, categorized by type
- Direct access to any file (images, logs, JSON data)
- Simple counts and summaries
- No framework-specific interpretation

The frontend can then decide how to display and interpret the data based on what it finds!
