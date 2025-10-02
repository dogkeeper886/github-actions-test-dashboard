# Data Flow Design
## GitHub Actions Test Dashboard

**Version:** 1.0  
**Date:** October 2, 2025  
**Status:** Technical Specification

---

## 1. Overview

Complete data lifecycle from initial project launch through ongoing operation, including GitHub API integration, data recording, periodic updates, and manual refresh capabilities.

---

## 2. Data Flow Architecture

### 2.1 System Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub API    │───▶│  Data Collector │───▶│   PostgreSQL    │
│                 │    │    Service      │    │    Database     │
│ • Workflows     │    │                 │    │                 │
│ • Runs          │    │ • Fetch         │    │ • Workflows     │
│ • Artifacts     │    │ • Process       │    │ • Runs          │
│ • Files         │    │ • Extract       │    │ • Artifacts     │
└─────────────────┘    │ • Store         │    │ • Files         │
                       └─────────────────┘    └─────────────────┘
                                │                       ▲
                                ▼                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │◀───│   REST API      │◀───│  File Storage   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • /workflows    │    │ • Images        │
│ • Run History   │    │ • /runs         │    │ • JSON files    │
│ • File Viewer   │    │ • /files        │    │ • Log files     │
│ • Refresh Btn   │    │ • /refresh      │    │ • Binary files  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Data States
```
1. EMPTY STATE (First Launch)
   ├── No workflows in database
   ├── No runs or artifacts
   └── Frontend shows "Loading..." or "No data"

2. INITIAL SYNC (First Data Load)
   ├── Fetch all workflows from GitHub
   ├── Fetch recent runs (last 30 days)
   ├── Download and extract artifacts
   └── Populate database

3. OPERATIONAL STATE (Ongoing)
   ├── Periodic checks for new runs
   ├── Process new artifacts automatically
   ├── Update database incrementally
   └── Frontend shows real-time data

4. MANUAL REFRESH (User Triggered)
   ├── Force check for latest data
   ├── Process any missed runs
   ├── Update UI immediately
   └── Show refresh status
```

---

## 3. Initial Launch Sequence

### 3.1 First Startup Flow
```
1. 🚀 Server Starts
   ├── Database connection established
   ├── Migrations run
   └── Data collector service initializes

2. 🔍 Initial Discovery
   ├── Check if workflows exist in database
   ├── If empty → trigger initial sync
   └── If populated → start periodic polling

3. 📥 Initial Sync Process
   ├── Fetch all workflows from GitHub API
   ├── Store workflow metadata
   ├── Fetch recent runs (configurable period)
   ├── Download artifacts for each run
   ├── Extract and categorize files
   └── Update database with all data

4. ✅ Ready State
   ├── Frontend can display data
   ├── Periodic polling starts
   └── Manual refresh available
```

### 3.2 Initial Sync Implementation
```javascript
// backend/src/services/initialSync.js
class InitialSyncService {
  async performInitialSync() {
    console.log('Starting initial sync...')
    
    // 1. Fetch workflows
    const workflows = await this.githubService.getWorkflows()
    await this.storeWorkflows(workflows)
    
    // 2. For each workflow, fetch recent runs
    for (const workflow of workflows) {
      const runs = await this.githubService.getWorkflowRuns(
        workflow.id, 
        { 
          per_page: 50,  // Last 50 runs
          created: `>${this.getDateDaysAgo(30)}` // Last 30 days
        }
      )
      
      // 3. Process each run
      for (const run of runs) {
        await this.processWorkflowRun(run)
      }
    }
    
    console.log('Initial sync completed')
  }
  
  async processWorkflowRun(run) {
    // Store run metadata
    await WorkflowRun.create(run)
    
    // Get and process artifacts
    const artifacts = await this.githubService.getRunArtifacts(run.id)
    
    for (const artifact of artifacts) {
      await this.processArtifact(run.id, artifact)
    }
  }
}
```

---

## 4. Periodic Data Collection

### 4.1 Polling Strategy
```javascript
// backend/src/services/dataCollector.js
class DataCollectorService {
  constructor() {
    this.pollInterval = process.env.POLL_INTERVAL_MINUTES || 5
    this.isRunning = false
  }
  
  start() {
    console.log(`Starting data collector (${this.pollInterval}m intervals)`)
    this.isRunning = true
    this.scheduleNextPoll()
  }
  
  scheduleNextPoll() {
    if (!this.isRunning) return
    
    setTimeout(() => {
      this.collectNewData()
        .then(() => this.scheduleNextPoll())
        .catch(err => {
          console.error('Data collection failed:', err)
          this.scheduleNextPoll() // Continue despite errors
        })
    }, this.pollInterval * 60 * 1000)
  }
  
  async collectNewData() {
    console.log('Checking for new workflow runs...')
    
    // Get latest run timestamp from database
    const lastSync = await this.getLastSyncTimestamp()
    
    // Fetch only new runs since last sync
    const workflows = await this.getStoredWorkflows()
    
    for (const workflow of workflows) {
      const newRuns = await this.githubService.getWorkflowRuns(
        workflow.id,
        { 
          created: `>${lastSync}`,
          per_page: 100
        }
      )
      
      console.log(`Found ${newRuns.length} new runs for ${workflow.name}`)
      
      for (const run of newRuns) {
        await this.processWorkflowRun(run)
      }
    }
    
    await this.updateLastSyncTimestamp()
  }
}
```

### 4.2 Incremental Updates
```
┌─────────────────────────────────────────────────────┐
│ PERIODIC POLLING (Every 5 minutes)                 │
├─────────────────────────────────────────────────────┤
│ 1. Get last sync timestamp from database           │
│ 2. Query GitHub API for runs newer than timestamp  │
│ 3. Process only new/updated runs                   │
│ 4. Download new artifacts                          │
│ 5. Extract and store new files                     │
│ 6. Update sync timestamp                           │
│ 7. Notify frontend of new data (optional)          │
└─────────────────────────────────────────────────────┘
```

---

## 5. Manual Refresh System

### 5.1 Frontend Refresh Button
```javascript
// frontend/components/RefreshButton.jsx
function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    try {
      const response = await fetch('/api/refresh', {
        method: 'POST'
      })
      
      if (response.ok) {
        // Invalidate React Query cache to refetch data
        queryClient.invalidateQueries(['workflows'])
        queryClient.invalidateQueries(['runs'])
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }
  
  return (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded"
    >
      {isRefreshing ? (
        <>
          <Spinner className="w-4 h-4" />
          Refreshing...
        </>
      ) : (
        <>
          <RefreshIcon className="w-4 h-4" />
          Refresh
        </>
      )}
    </button>
  )
}
```

### 5.2 Backend Refresh Endpoint
```javascript
// backend/src/routes/refresh.js
router.post('/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered')
    
    // Trigger immediate data collection
    const collector = new DataCollectorService()
    await collector.collectNewData()
    
    // Return summary of what was updated
    const summary = await this.getRefreshSummary()
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        newRuns: summary.newRuns,
        newFiles: summary.newFiles,
        updatedWorkflows: summary.updatedWorkflows
      }
    })
  } catch (error) {
    console.error('Manual refresh failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})
```

---

## 6. Data Processing Pipeline

### 6.1 Workflow Run Processing
```
📥 New Run Detected
├── 1. Store run metadata (status, timing, commit info)
├── 2. Fetch artifacts list from GitHub API
├── 3. For each artifact:
│   ├── Download artifact zip file
│   ├── Extract all files from zip
│   ├── Categorize files by type (image/json/text/binary)
│   ├── Store file metadata in database
│   ├── Save file content (text/json) or reference (binary/image)
│   └── Clean up temporary files
└── 4. Update run status to "processed"
```

### 6.2 File Processing Logic
```javascript
// backend/src/services/fileProcessor.js
class FileProcessor {
  async processExtractedFile(filePath, runId, artifactId, artifactName) {
    const stats = fs.statSync(filePath)
    const ext = path.extname(filePath).toLowerCase()
    
    const fileData = {
      runId,
      artifactId,
      artifactName,
      originalPath: path.relative(tempDir, filePath),
      fileSize: stats.size,
      fileType: this.categorizeFile(ext),
      storedFilename: this.generateStoredFilename(filePath, runId),
      extractedAt: new Date()
    }
    
    // Handle different file types
    switch (fileData.fileType) {
      case 'image':
        fileData.storedUrl = await this.storeImageFile(filePath, fileData.storedFilename)
        break
        
      case 'json':
        fileData.content = await this.readJsonFile(filePath)
        fileData.storedUrl = await this.storeTextFile(filePath, fileData.storedFilename)
        break
        
      case 'text':
        fileData.content = await this.readTextFile(filePath)
        fileData.storedUrl = await this.storeTextFile(filePath, fileData.storedFilename)
        break
        
      case 'binary':
        fileData.storedUrl = await this.storeBinaryFile(filePath, fileData.storedFilename)
        break
    }
    
    // Save to database
    return await ExtractedFile.create(fileData)
  }
  
  categorizeFile(extension) {
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    const textExts = ['.txt', '.log', '.md', '.csv', '.xml']
    
    if (extension === '.json') return 'json'
    if (imageExts.includes(extension)) return 'image'
    if (textExts.includes(extension)) return 'text'
    return 'binary'
  }
}
```

---

## 7. Error Handling & Resilience

### 7.1 GitHub API Limits
```javascript
class GitHubService {
  async makeRequest(url, options = {}) {
    try {
      const response = await this.octokit.request(url, options)
      return response.data
    } catch (error) {
      if (error.status === 403 && error.response?.headers['x-ratelimit-remaining'] === '0') {
        // Rate limit hit - wait until reset
        const resetTime = error.response.headers['x-ratelimit-reset']
        const waitTime = (resetTime * 1000) - Date.now()
        
        console.log(`Rate limit hit, waiting ${waitTime}ms`)
        await this.sleep(waitTime)
        
        // Retry the request
        return this.makeRequest(url, options)
      }
      throw error
    }
  }
}
```

### 7.2 Processing Failures
```javascript
class DataCollectorService {
  async processWorkflowRun(run) {
    try {
      await this.doProcessWorkflowRun(run)
    } catch (error) {
      console.error(`Failed to process run ${run.id}:`, error)
      
      // Mark run as failed for retry later
      await WorkflowRun.markProcessingFailed(run.id, error.message)
      
      // Continue with other runs - don't let one failure stop everything
    }
  }
  
  async retryFailedRuns() {
    const failedRuns = await WorkflowRun.getFailedProcessing()
    
    for (const run of failedRuns) {
      console.log(`Retrying failed run ${run.id}`)
      await this.processWorkflowRun(run)
    }
  }
}
```

---

## 8. Configuration & Environment

### 8.1 Environment Variables
```bash
# Data Collection Configuration
POLL_INTERVAL_MINUTES=5           # How often to check for new data
INITIAL_SYNC_DAYS=30              # How far back to sync on first run
MAX_CONCURRENT_DOWNLOADS=3        # Parallel artifact downloads
RETRY_FAILED_RUNS=true            # Retry failed run processing

# GitHub API Configuration  
GITHUB_TOKEN=ghp_xxx              # GitHub personal access token
GITHUB_OWNER=dogkeeper886         # Repository owner
GITHUB_REPO=test-workbench        # Repository name
GITHUB_API_TIMEOUT=30000          # Request timeout in ms

# Storage Configuration
FILE_STORAGE_PATH=./data/files    # Where to store extracted files
MAX_FILE_SIZE_MB=100              # Skip files larger than this
CLEANUP_OLD_FILES_DAYS=90         # Delete files older than this
```

### 8.2 Startup Configuration
```javascript
// backend/src/server.js
async function startServer() {
  try {
    // Initialize database
    await initDatabase()
    await runMigrations()
    
    // Check if initial sync needed
    const workflowCount = await WorkflowRun.count()
    
    if (workflowCount === 0) {
      console.log('No data found, starting initial sync...')
      const initialSync = new InitialSyncService()
      await initialSync.performInitialSync()
    }
    
    // Start periodic data collection
    const collector = new DataCollectorService()
    collector.start()
    
    // Start web server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log('Data collection active')
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}
```

---

## 9. Frontend Data Integration

### 9.1 Real-time Updates
```javascript
// frontend/hooks/useWorkflows.js
function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetch('/api/workflows').then(res => res.json()),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000,       // Consider stale after 2 minutes
  })
}

// frontend/hooks/useRunHistory.js  
function useRunHistory(workflowId, options = {}) {
  return useQuery({
    queryKey: ['runs', workflowId, options],
    queryFn: () => fetch(`/api/workflows/${workflowId}/runs?${new URLSearchParams(options)}`).then(res => res.json()),
    enabled: !!workflowId,
    refetchInterval: 5 * 60 * 1000,
  })
}
```

### 9.2 Loading States
```javascript
// frontend/components/WorkflowList.jsx
function WorkflowList() {
  const { data: workflows, isLoading, error, refetch } = useWorkflows()
  
  if (isLoading) {
    return <WorkflowListSkeleton />
  }
  
  if (error) {
    return (
      <ErrorState 
        message="Failed to load workflows"
        onRetry={refetch}
      />
    )
  }
  
  if (!workflows?.length) {
    return (
      <EmptyState 
        title="No workflows found"
        description="Data collection may still be in progress"
        action={<RefreshButton />}
      />
    )
  }
  
  return (
    <div className="space-y-4">
      {workflows.map(workflow => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  )
}
```

---

## 10. Implementation Timeline

### Week 1: Core Data Collection
- [ ] Initial sync service
- [ ] Periodic polling service  
- [ ] Basic artifact processing
- [ ] Database integration

### Week 2: File Processing
- [ ] File extraction and categorization
- [ ] Content parsing (JSON/text)
- [ ] File storage system
- [ ] Error handling and retries

### Week 3: API Integration
- [ ] Enhanced API endpoints
- [ ] Manual refresh endpoint
- [ ] Frontend data hooks
- [ ] Loading and error states

### Week 4: Polish & Optimization
- [ ] Performance optimization
- [ ] Rate limit handling
- [ ] Monitoring and logging
- [ ] Configuration management

This data flow design ensures smooth operation from first launch through ongoing use, with robust error handling and user control over data freshness! 🚀
