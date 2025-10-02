# Product Requirements Document (PRD)
## GitHub Actions Test Dashboard

**Version:** 1.0  
**Date:** October 2, 2025  
**Status:** Draft

---

## 1. Product Overview

### 1.1 Purpose
A self-hosted web dashboard that displays GitHub Actions workflow results by recording and presenting what actually happens in workflow runs. Framework-agnostic approach that extracts and categorizes all artifacts (images, logs, JSON files) without making assumptions about test frameworks.

### 1.2 Problem Statement
- GitHub Actions workflow artifacts are difficult to access and navigate
- Screenshots and logs are buried in downloadable zip files
- No unified view of what was actually produced by workflow runs
- Time-consuming to download and extract artifacts for debugging
- No historical view of workflow outputs and patterns

### 1.3 Goals
- Automatically extract and categorize all workflow artifacts
- Display images, logs, and data files inline without downloads
- Provide unified view of what each workflow run produced
- Record workflow run history and artifact patterns
- Reduce artifact investigation time from 5+ minutes to under 1 minute

---

## 2. Target Users

**Primary:** QA Engineers / Test Automation Engineers
- Need to quickly access workflow artifacts
- Want to see screenshots and logs immediately
- Need to understand what workflows actually produced

**Secondary:** Development Team Leads
- Need to monitor workflow reliability
- Want to track workflow output patterns over time

---

## 3. Core Features

### 3.1 Workflow Management

#### Feature: Workflow List
**What:** Display all GitHub Actions workflows for the configured repository

**User needs:**
- See all workflows at a glance
- Know which workflows are currently failing
- Quick access to workflow run history

**Must have:**
- Workflow name
- Latest run status (success/failure/in-progress)
- Last run timestamp
- Click to view run history

**Nice to have:**
- Filter workflows by name
- Sort by various criteria
- Show workflow trigger type

---

#### Feature: Workflow Run History
**What:** Show all historical runs for a selected workflow

**User needs:**
- Track workflow stability over time
- Find specific runs by date or status
- See trends in test results

**Must have:**
- List of runs with: run number, status, date, duration
- Color-coded status (green=success, red=failure)
- Click run to view test results
- Pagination for long lists

**Nice to have:**
- Filter by date range, status, trigger type
- Success rate chart (last 30 runs)
- Export run data

---

### 3.2 Test Results

#### Feature: Workflow Run Results Dashboard
**What:** Detailed view of all artifacts and files extracted from a workflow run

**User needs:**
- Immediately see what the workflow produced
- Access all extracted files by category
- Navigate to specific files quickly

**Must have:**
- Run execution summary: status, duration, commit info
- **Files categorized by type (images, JSON, text logs)**
- Each file shows: original path, size, artifact source
- Click file to view content inline
- Direct download links for all files

**Nice to have:**
- Search files by name or content
- Filter by file type or artifact
- Group files by artifact source
- Compare with previous run outputs

---

#### Feature: File Content Viewer
**What:** View content of extracted files (logs, JSON, text files)

**User needs:**
- Read file contents easily
- Navigate large files quickly
- Copy or download file content

**Must have:**
- Display text file content with formatting
- Show JSON files with proper structure
- Line numbers for text files
- Copy entire content
- Download original files

**Nice to have:**
- Search within file content
- Syntax highlighting for different file types
- Collapsible JSON structure
- Side-by-side file comparison

---

#### Feature: Image Gallery
**What:** Display all extracted images inline

**User needs:**
- See all images produced by workflow runs
- View images without downloading artifacts
- Zoom into images for details

**Must have:**
- Display image thumbnails grouped by artifact
- Click thumbnail to view full-size
- Show image metadata (filename, size, source artifact)
- Download individual images

**Nice to have:**
- Lightbox/modal viewer
- Navigate between images with keyboard
- Show image timestamps and paths
- Image zoom and pan controls

---

### 3.3 Historical Data & Analytics

#### Feature: Workflow Output History
**What:** Track workflow artifacts and outputs over time

**User needs:**
- See what workflows consistently produce
- Identify changes in workflow outputs
- Understand workflow behavior patterns

**Must have:**
- Show workflow run history with artifact summaries
- Display file type patterns over time
- Track artifact size and count trends

**Nice to have:**
- File content change detection
- Output pattern analysis
- "Most common artifacts" list
- Anomaly detection in workflow outputs

---

#### Feature: Workflow Statistics
**What:** Overall health metrics for workflows

**User needs:**
- Understand workflow reliability
- Track improvements or regressions
- Share metrics with team

**Must have:**
- Success rate over time
- Total runs, passes, failures
- Average run duration

**Nice to have:**
- Trend charts (30/60/90 days)
- Export statistics
- Compare workflows

---

### 3.4 Search & Navigation

#### Feature: Search
**What:** Find workflows, runs, and tests quickly

**User needs:**
- Search for specific test by name
- Find all runs where a test failed
- Quick navigation

**Must have:**
- Search bar for test names
- Search results showing matching tests and their runs

**Nice to have:**
- Global search across workflows, runs, tests
- Search within logs
- Autocomplete suggestions
- Advanced filters

---

#### Feature: Filtering
**What:** Filter data by various criteria

**User needs:**
- View only failed tests
- See runs from specific date range
- Filter by status

**Must have:**
- Filter tests by status (passed/failed/skipped)
- Filter runs by status and date

**Nice to have:**
- Filter by test file
- Filter by duration
- Save filter presets

---

## 4. Data Requirements

### 4.1 Data Collection
**What:** Collect data from GitHub and store locally

**Must collect:**
- Workflow information
- Workflow runs (metadata, status, timing, commit info)
- All artifacts produced by runs
- All files extracted from artifacts (categorized by type)
- File content for text/JSON files

**Collection frequency:**
- Poll GitHub API every 5 minutes for new data
- Process new runs as they complete

---

### 4.2 Data Storage
**What:** Store all collected data in PostgreSQL database

**Must store:**
- Workflow metadata
- Run metadata (commit, branch, author, timing, status)
- Artifact information (name, size, expiration)
- Extracted file records (path, type, size, content)
- File storage references and URLs

**Storage considerations:**
- Keep data for at least 90 days
- Support up to 10,000 workflow runs
- Support up to 1 million extracted files
- Handle file storage (images, logs, JSON) up to 100GB

---

## 5. User Interface Requirements

### 5.1 Layout
**Must have:**
- Navigation sidebar (list of workflows)
- Main content area for viewing runs and tests
- Header with search bar

**Nice to have:**
- Collapsible sidebar
- Breadcrumb navigation
- Dark mode

---

### 5.2 Responsiveness
**Must have:**
- Desktop browser support (Chrome, Firefox, Safari, Edge)
- Readable on laptop screens (1366x768 and up)

**Nice to have:**
- Mobile-friendly responsive design
- Tablet support

---

### 5.3 Performance
**Must have:**
- Page loads in under 3 seconds
- Smooth scrolling and navigation
- Handle large test result lists (1000+ tests)

**Nice to have:**
- Virtual scrolling for very long lists
- Progressive loading of screenshots

---

## 6. Integration Requirements

### 6.1 GitHub Integration
**Must have:**
- Connect to GitHub API using Personal Access Token
- Support one repository
- Read workflows and runs
- Download artifacts (test results, screenshots)

**Nice to have:**
- Support multiple repositories
- GitHub App authentication
- Webhook integration for real-time updates

---

### 6.2 Artifact Processing Support
**Must support:**
- Any artifact format (framework agnostic)
- Image files (PNG, JPEG, GIF, WebP)
- Text files (logs, plain text)
- JSON files (any structure)
- Binary files (stored but not processed)

**Nice to have:**
- XML file processing
- CSV file processing
- Video file handling
- Archive file extraction (nested zips)

---

## 7. System Requirements

### 7.1 Deployment
**What:** Run on user's own infrastructure

**Must support:**
- Docker deployment
- SQLite database (simple, file-based)
- Local file storage for extracted artifacts

**Nice to have:**
- Docker Compose one-command setup
- Kubernetes deployment option
- Cloud storage for screenshots (S3)

---

### 7.2 Configuration
**Must configure:**
- GitHub repository (owner/repo)
- GitHub access token
- Database file location
- Storage location for extracted files

---

## 8. Success Metrics

### 8.1 Functionality
- ✅ All workflow runs are collected and displayed
- ✅ All artifacts are extracted and categorized
- ✅ Images are viewable inline without downloads
- ✅ File contents are accessible and readable

### 8.2 Performance
- ⏱️ Artifact investigation time: < 1 minute (vs 5+ minutes in GitHub UI)
- ⏱️ Page load time: < 3 seconds
- ⏱️ Zero manual artifact downloads needed

### 8.3 User Satisfaction
- ✅ Users can access all workflow outputs from dashboard alone (90% of cases)
- ✅ Users prefer dashboard over GitHub Actions UI for artifact access

---

## 9. Out of Scope (Future Versions)

### Not included in v1.0:
- Multi-user authentication and authorization
- Team collaboration features (comments, annotations)
- Notifications (email, Slack)
- Integration with issue tracking (Jira, Linear)
- AI-powered failure analysis
- Public sharing of results
- Custom test result parsers
- Mobile app

---

## 10. Open Questions

1. **File formats:** What additional file types should we process beyond images/JSON/text?
2. **Data retention:** How long should we keep historical workflow data and extracted files?