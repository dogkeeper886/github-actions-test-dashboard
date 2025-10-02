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

Based on analysis of current backend vs PRD requirements, here's what we need to implement:

### Current Status ✅
- GitHub API integration working
- Artifact download and extraction working  
- Basic file serving working (screenshots)
- Docker setup working
- 17 screenshots successfully processed in testing

### What We Need to Add

### Phase 1: Add Database Layer (Priority 1)
**Goal:** Enable persistent storage and historical data

```javascript
// backend/src/models/database.js
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

async function initDatabase() {
  const db = await open({
    filename: './data/dashboard.db',
    driver: sqlite3.Database
  })
  
  // Create tables matching our discovered data structure
  await db.exec(`
    CREATE TABLE IF NOT EXISTS workflow_runs (
      id TEXT PRIMARY KEY,
      workflow_id TEXT,
      workflow_name TEXT,
      status TEXT,
      conclusion TEXT,
      created_at TEXT,
      updated_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      duration INTEGER,
      commit_sha TEXT,
      commit_message TEXT,
      commit_author TEXT,
      head_branch TEXT,
      event TEXT,
      run_number INTEGER
    );

    CREATE TABLE IF NOT EXISTS artifacts (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      name TEXT,
      size INTEGER,
      expired BOOLEAN,
      created_at TEXT,
      FOREIGN KEY (run_id) REFERENCES workflow_runs(id)
    );

    CREATE TABLE IF NOT EXISTS extracted_files (
      id TEXT PRIMARY KEY,
      run_id TEXT,
      artifact_id TEXT,
      artifact_name TEXT,
      original_path TEXT,
      file_type TEXT, -- image, json, text, binary
      file_size INTEGER,
      stored_filename TEXT,
      stored_url TEXT,
      content TEXT, -- for text/json files
      extracted_at TEXT,
      FOREIGN KEY (run_id) REFERENCES workflow_runs(id),
      FOREIGN KEY (artifact_id) REFERENCES artifacts(id)
    );
  `)
  
  return db
}
```

### Phase 2: Enhance Data Recording (Priority 1)
**Goal:** Store everything we extract for historical access

```javascript
// backend/src/services/dataRecorder.js
async function recordWorkflowRun(runData) {
  // Store enhanced run metadata from GitHub API
  await db.run(`
    INSERT OR REPLACE INTO workflow_runs 
    (id, workflow_id, workflow_name, status, conclusion, created_at, 
     updated_at, started_at, completed_at, duration, commit_sha, 
     commit_message, commit_author, head_branch, event, run_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    runData.id, runData.workflow_id, runData.name, runData.status,
    runData.conclusion, runData.created_at, runData.updated_at,
    runData.run_started_at, runData.updated_at, 
    calculateDuration(runData), runData.head_sha, 
    runData.display_title, runData.triggering_actor?.login,
    runData.head_branch, runData.event, runData.run_number
  ])
}

async function recordExtractedFiles(runId, artifactId, artifactName, files) {
  for (const file of files) {
    await db.run(`
      INSERT OR REPLACE INTO extracted_files 
      (id, run_id, artifact_id, artifact_name, original_path, file_type,
       file_size, stored_filename, stored_url, content, extracted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      generateId(), runId, artifactId, artifactName, file.originalPath,
      file.type, file.size, file.storedFilename, file.url, 
      file.content, new Date().toISOString()
    ])
  }
}
```

### Phase 3: Enhance File Processing (Priority 2)
**Goal:** Better categorization and content extraction

```javascript
// Enhance existing processArtifactFile functions
async function processArtifactFile(filePath, runId, artifactName) {
  const fileName = path.basename(filePath)
  const ext = path.extname(fileName).toLowerCase()
  const stats = await fs.stat(filePath)
  
  const baseFile = {
    originalPath: filePath,
    size: stats.size,
    artifactName,
    extractedAt: new Date().toISOString()
  }

  // Enhanced image processing
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
    return await processImageFile(filePath, runId, baseFile)
  }
  
  // Enhanced JSON processing
  if (ext === '.json') {
    return await processJsonFile(filePath, baseFile)
  }
  
  // Enhanced text processing  
  if (['.log', '.txt', '.md', '.xml', '.csv'].includes(ext)) {
    return await processTextFile(filePath, baseFile)
  }
  
  // Binary files - store but don't process content
  return await processBinaryFile(filePath, runId, baseFile)
}
```

### Phase 4: Enhanced API Endpoints (Priority 2)
**Goal:** Match PRD requirements for UI

```javascript
// Enhanced endpoints
GET /api/workflows
// Add latest run status, success rates

GET /api/workflows/:id/runs?page=1&limit=20&status=failed
// Add pagination, filtering, enhanced metadata

GET /api/runs/:runId/files
// Return categorized files instead of test-specific structure
{
  run: { /* enhanced run metadata */ },
  summary: {
    totalArtifacts: 1,
    totalFiles: 25,
    fileTypes: { images: 17, json: 3, text: 5 }
  },
  files: {
    images: [{ id, originalPath, storedFilename, url, size, artifactName }],
    json: [{ id, originalPath, content, size, artifactName }],
    text: [{ id, originalPath, content, size, artifactName }]
  }
}

GET /api/files/:fileId
// Serve any extracted file by database ID

GET /api/search?q=login&type=files
// Search across all extracted files
```

### Phase 5: Background Data Collection (Priority 3)
**Goal:** Automatic data collection as per PRD

```javascript
// backend/src/services/collector.js
async function collectWorkflowData() {
  const workflows = await getWorkflows()
  
  for (const workflow of workflows) {
    const runs = await getWorkflowRuns(workflow.id, { per_page: 10 })
    
    for (const run of runs.workflow_runs) {
      // Check if we already have this run
      const existing = await db.get('SELECT id FROM workflow_runs WHERE id = ?', run.id)
      if (!existing) {
        await recordWorkflowRun(run)
        await processTestResults(run.id) // This will record files
      }
    }
  }
}

// Run every 5 minutes as per PRD
setInterval(collectWorkflowData, 5 * 60 * 1000)
```

## Implementation Priority

### Phase 1 (Essential - 2-3 days)
- ✅ **Database layer** - Enable persistence and historical data
- ✅ **Enhanced data recording** - Store all extracted information
- ✅ **Basic file categorization** - image/json/text/binary

### Phase 2 (Important - 1-2 days)  
- ✅ **Enhanced file processing** - Better content extraction
- ✅ **Updated API endpoints** - Match PRD requirements
- ✅ **File serving by ID** - Database-backed file access

### Phase 3 (Nice to have - 1 day)
- ✅ **Background collection** - Automatic data gathering
- ✅ **Search functionality** - Find files across runs
- ✅ **Analytics endpoints** - Success rates, trends

## Benefits of This Approach

1. **Framework Agnostic** - Works with any test tool or workflow
2. **Simple** - Just record what we observe, no assumptions
3. **Extensible** - Easy to add interpretation later without breaking existing functionality
4. **CLAUDE.md Compliant** - No assumptions or over-engineering
5. **Debuggable** - Can see exactly what was produced by any workflow
6. **Incremental** - Enhance existing working backend, don't rewrite
7. **Data-Driven** - Based on actual analysis of what GitHub Actions provides

## What Frontend Will Get

After implementation, the frontend will have access to:

- **Enhanced workflow list** with latest run status and success rates
- **Paginated run history** with full metadata (commit, author, timing)
- **Categorized file access** - all files organized by type (image/json/text)
- **File content** - JSON parsed, text content available, images served
- **Historical data** - Track patterns and changes over time
- **Search capabilities** - Find specific files or content across all runs
- **Direct file access** - No more artifact downloads needed

The frontend can then build rich UI components for file galleries, content viewers, and analytics dashboards based on this comprehensive data!
