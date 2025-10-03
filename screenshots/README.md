# Screenshots for README.md

This directory contains screenshots for the main README documentation.

## Required Screenshots

### 01_dashboard_home.png
**Content**: Main dashboard page showing workflows list
- Should show the "All Workflows" page
- Display at least one workflow with its status icon (success/failure)
- Show the workflow's latest run number, time ago, and duration
- Display success rate percentage (e.g., "44.0%")
- Show run count (e.g., "50 runs")
- Include the header with "GitHub Actions Dashboard" title
- Show the status indicators (Running, Next poll time, Last sync time)

### 02_workflow_runs_list.png
**Content**: Workflow runs history page
- Navigated by clicking on a workflow from the home page
- Show "Main Flow Playwright Test - Runs" header
- Display "Back to workflows" button
- Show the dropdown filter (All runs / Completed / In Progress / Queued)
- Display at least 3-5 runs in the list
- Each run should show:
  - Run number (e.g., #1926, #1925)
  - Status icon (success/failure)
  - Time ago (e.g., "12 minutes ago")
  - Duration (e.g., "3m 30s")
  - Commit message
  - Author, branch, trigger type, commit SHA
  - Artifact count if available (e.g., "17 files")

### 03_run_details_with_logs.png
**Content**: Run details page with expanded job showing step logs
- Navigated by clicking on a run (preferably run #1925)
- Show "Run Details" header with "Back to runs" button
- Display run information:
  - Run number and timestamp
  - Commit information (message, author, SHA)
  - Files summary (total files, images, JSON, text counts)
- Expand the job (click the expand button on the job card)
- Show the "Steps (10)" section with all steps listed
- **IMPORTANT**: Expand the "Install dependencies" step (step #4) to show logs
- The log output should be visible showing:
  - The `npm ci` command
  - Package installation output
  - **NO ANSI color codes** (should be clean text)
  - Lines like "added 6 packages, and audited 7 packages in 755ms"

### 04_extracted_files_view.png
**Content**: Extracted files section expanded showing artifact folders
- Still on the run details page from screenshot 03
- Scroll down to show "Extracted Files (17)" section
- **IMPORTANT**: Expand the extracted files folder (click the expand button)
- Show the folder tree structure with artifact subdirectories:
  - Parent folder: `extracted_4172419179`
  - Multiple test artifact folders underneath like:
    - `venues-should-log-in-and-display-Venues-page-chromium`
    - `main-flow-should-navigate-to-Wireless-Clients-List-page-chromium`
    - `auth.setup.ts-authenticate-setup`
    - etc. (should show at least 5-10 folders)
- Folders should have folder icons (📁 emoji)

## Screenshot Guidelines

- **Resolution**: Use viewport screenshots (not full page)
- **No Private Information**: Avoid showing sensitive data
  - Repository names are okay (it's a public dashboard)
  - User "dogkeeper886" is okay (it's visible in commits)
  - Commit SHAs are okay
- **Clean Display**: 
  - No browser chrome (just the dashboard content)
  - Logs should have ANSI codes stripped (this is already implemented)
- **File Format**: PNG format
- **Naming**: Use exact names listed above with numeric prefixes for ordering

## How to Take Screenshots

1. Navigate to http://192.168.2.103 (or your dashboard URL)
2. Use a screenshot tool (scrot, flameshot, etc.)
3. Follow the content requirements above for each screenshot
4. Save with the exact filename in this directory
5. Verify all 4 screenshots are present before committing
