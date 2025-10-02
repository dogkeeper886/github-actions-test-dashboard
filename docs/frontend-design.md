# Frontend Design Specification
## GitHub Actions Test Dashboard

**Version:** 1.0  
**Date:** October 2, 2025  
**Status:** Design Specification

---

## 1. Overview

Framework-agnostic web dashboard that displays GitHub Actions workflow artifacts by recording and presenting what actually happens in workflow runs. Focus on immediate access to images, logs, and data files without downloads.

---

## 2. Information Architecture

### 2.1 Data Hierarchy
```
Repository
├── Workflows (List)
│   ├── Workflow A
│   │   ├── Run History (Paginated)
│   │   │   ├── Run #1920 (Latest)
│   │   │   ├── Run #1919
│   │   │   └── Run #1918
│   │   └── Run Details
│   │       ├── Run Metadata
│   │       ├── File Categories
│   │       │   ├── Images (17 files)
│   │       │   ├── JSON (3 files)
│   │       │   └── Logs (5 files)
│   │       └── Individual Files
│   └── Workflow B
└── Search Results (Cross-workflow)
```

### 2.2 Navigation Flow
```
Dashboard → Workflow List → Run History → Run Results → File Content
    ↑           ↑              ↑            ↑            ↑
Repository  All Workflows  Selected      Selected     Selected
Level       Overview       Workflow      Run          File
```

---

## 3. Layout Structure

### 3.1 Main Layout
```
┌─────────────────────────────────────────────────────┐
│ 🏠 GitHub Actions Dashboard    🔍 [Search Bar]      │
├─────────────────────────────────────────────────────┤
│ 📋 Sidebar     │ 📊 Main Content Area              │
│ Workflows      │                                   │
│ ├─🟢 Main Flow │ Dynamic Content:                  │
│ ├─🔴 CI Tests  │ • Workflow List                   │
│ ├─🟡 Deploy    │ • Run History                     │
│ └─⚪ Inactive  │ • Run Results                     │
│                │ • File Viewer                     │
│ 📊 Stats       │                                   │
│ • Success: 87% │                                   │
│ • Runs: 1,920  │                                   │
└─────────────────┴───────────────────────────────────┘
```

### 3.2 Responsive Breakpoints
- **Desktop:** 1200px+ (full sidebar)
- **Tablet:** 768px-1199px (collapsible sidebar)
- **Mobile:** <768px (hidden sidebar, hamburger menu)

---

## 4. Component Specifications

### 4.1 Workflow List Component

#### Visual Design
```
📋 Workflows (3 active)

┌─────────────────────────────────────────────────────┐
│ 🟢 Main Flow Playwright Test                       │
│    ✅ success • 2h ago • #1920 • 93.3% success     │
│    📊 1,920 runs • ⏱️ avg 3m 38s                    │
├─────────────────────────────────────────────────────┤
│ 🔴 CI Tests                                         │
│    ❌ failed • 1d ago • #847 • 76.2% success       │
│    📊 847 runs • ⏱️ avg 2m 15s                      │
├─────────────────────────────────────────────────────┤
│ 🟡 Deploy                                           │
│    ⏳ in-progress • 5m ago • #234 • 98.1% success   │
│    📊 234 runs • ⏱️ avg 45s                         │
└─────────────────────────────────────────────────────┘
```

#### Data Requirements
```javascript
GET /api/workflows
{
  workflows: [
    {
      id: 173699523,
      name: "Main Flow Playwright Test",
      status: "active",
      latestRun: {
        id: "18180267843",
        status: "completed",
        conclusion: "success",
        createdAt: "2025-10-02T01:10:20Z",
        runNumber: 1920,
        duration: 218000
      },
      stats: {
        totalRuns: 1920,
        successRate: 93.3,
        avgDuration: 218000
      }
    }
  ]
}
```

#### Interaction States
- **Hover:** Subtle background highlight
- **Click:** Navigate to run history
- **Failed workflows:** Display at top with red indicator
- **Loading:** Skeleton placeholder with shimmer

### 4.2 Run History Component

#### Visual Design
```
📊 Main Flow Playwright Test - Run History

🔍 [Filter: All] [Status: All] [Date: Last 30 days]

┌─────────────────────────────────────────────────────┐
│ #1920 🟢 success    2h ago    3m 38s                │
│ 📝 "Fix login flow" by john.doe                     │
│ 📁 25 files: 17 images, 3 json, 5 logs             │
├─────────────────────────────────────────────────────┤
│ #1919 🔴 failure    4h ago    5m 12s                │
│ 📝 "Update tests" by jane.smith                     │
│ 📁 23 files: 15 images, 2 json, 6 logs             │
├─────────────────────────────────────────────────────┤
│ #1918 🟢 success    6h ago    3m 45s                │
│ 📝 "Refactor components" by john.doe                │
│ 📁 28 files: 20 images, 4 json, 4 logs             │
└─────────────────────────────────────────────────────┘

📄 Page 1 of 96 • Showing 20 of 1,920 runs
```

#### Data Requirements
```javascript
GET /api/workflows/173699523/runs?page=1&limit=20&status=all
{
  runs: [
    {
      id: "18171696019",
      runNumber: 1919,
      status: "completed",
      conclusion: "failure",
      createdAt: "2025-10-01T18:22:38Z",
      duration: 312000,
      commit: {
        sha: "e8c0585a6ebdc4280dadde1349cdb7911942b950",
        message: "Update tests",
        author: "jane.smith"
      },
      fileSummary: {
        totalFiles: 23,
        fileTypes: {
          images: 15,
          json: 2,
          text: 6
        }
      }
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1920,
    totalPages: 96
  }
}
```

#### Features
- **Pagination:** Load more / infinite scroll
- **Filtering:** Status, date range, author
- **Sorting:** Date, duration, status
- **Failed runs first:** Red items at top

### 4.3 Run Results Component

#### Visual Design
```
🔍 Run #1919 - Failed (4h ago)

┌─────────────────────────────────────────────────────┐
│ 📊 EXECUTION SUMMARY                                │
│ Status: ❌ Failed • Duration: 5m 12s                │
│ Files: 23 total (15 images, 2 json, 6 logs)        │
│ Commit: e8c0585 "Update tests" by jane.smith        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 📁 FILES BY TYPE                                    │
│                                                     │
│ 🖼️ IMAGES (15 files)                               │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                    │
│ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ ...                │
│ │thumb│ │thumb│ │thumb│ │thumb│                    │
│ └─────┘ └─────┘ └─────┘ └─────┘                    │
│                                                     │
│ 📄 JSON FILES (2 files)                            │
│ • results.json (5.2 KB) - Test results             │
│ • config.json (1.8 KB) - Configuration             │
│                                                     │
│ 📝 LOG FILES (6 files)                             │
│ • test-output.log (15.2 KB) - Main test log        │
│ • error.log (3.4 KB) - Error details               │
│ • debug.log (8.7 KB) - Debug information           │
│ • ... 3 more files                                 │
└─────────────────────────────────────────────────────┘
```

#### Data Requirements
```javascript
GET /api/runs/18171696019/files
{
  run: {
    id: "18171696019",
    runNumber: 1919,
    status: "completed",
    conclusion: "failure",
    createdAt: "2025-10-01T18:22:38Z",
    duration: 312000,
    commit: {
      sha: "e8c0585a6ebdc4280dadde1349cdb7911942b950",
      message: "Update tests",
      author: "jane.smith"
    }
  },
  summary: {
    totalFiles: 23,
    fileTypes: {
      images: 15,
      json: 2,
      text: 6
    }
  },
  files: {
    images: [
      {
        id: "uuid1",
        originalPath: "screenshots/test-finished-1.png",
        storedFilename: "18171696019_1759378417871_test-finished-1.png",
        url: "/api/files/uuid1",
        size: 102618,
        artifactName: "playwright-test-results",
        extractedAt: "2025-10-01T18:26:01Z"
      }
    ],
    json: [
      {
        id: "uuid2",
        originalPath: "results/results.json",
        content: { /* parsed JSON object */ },
        size: 5420,
        artifactName: "playwright-test-results"
      }
    ],
    text: [
      {
        id: "uuid3",
        originalPath: "logs/test-output.log",
        content: "Test execution started...\nERROR: Element not found...",
        size: 15230,
        artifactName: "playwright-test-results"
      }
    ]
  }
}
```

### 4.4 File Viewer Components

#### Image Gallery
```
🖼️ Screenshots (15 files)

┌─────────────────────────────────────────────────────┐
│ 📷 test-finished-1.png (100 KB)                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │                                                 │ │
│ │           [Screenshot Preview]                  │ │
│ │                                                 │ │
│ └─────────────────────────────────────────────────┘ │
│ 🔍 Click to enlarge • 📥 Download • 📋 Copy URL     │
└─────────────────────────────────────────────────────┘
```

#### JSON Viewer
```
📄 results.json (5.2 KB)

┌─────────────────────────────────────────────────────┐
│ {                                                   │
│   "tests": [                                        │
│     {                                               │
│       "title": "should login with valid creds",    │
│       "status": "failed",                           │
│       "duration": 5000,                             │
│       "error": "Element not found"                  │
│     }                                               │
│   ],                                                │
│   "summary": {                                      │
│     "total": 45,                                    │
│     "passed": 42,                                   │
│     "failed": 3                                     │
│   }                                                 │
│ }                                                   │
└─────────────────────────────────────────────────────┘
```

#### Log Viewer
```
📝 test-output.log (15.2 KB)

┌─────────────────────────────────────────────────────┐
│  1 │ Test execution started at 2025-10-01 18:22:38  │
│  2 │ Loading test configuration...                   │
│  3 │ Starting browser session...                     │
│  4 │ Navigating to login page...                     │
│  5 │ ERROR: Element [data-testid="login-btn"] not    │
│  6 │        found after 5000ms timeout              │
│  7 │ Screenshot saved: test-finished-1.png           │
│  8 │ Test failed: Login flow validation              │
└─────────────────────────────────────────────────────┘
🔍 Search in log • 📥 Download • 📋 Copy content
```

---

## 5. User Experience Flow

### 5.1 Primary User Journey
```
1. 👤 User Problem: "My tests are failing, need to debug"
   ↓
2. 🏠 Lands on dashboard, sees workflow list
   ↓
3. 👀 Immediately spots red "CI Tests" workflow at top
   ↓
4. 🖱️ Clicks on failed workflow
   ↓
5. 📊 Views run history, sees recent failures
   ↓
6. 🎯 Clicks on most recent failed run (#1919)
   ↓
7. 📁 Sees categorized files: 15 images, 2 json, 6 logs
   ↓
8. 🖼️ Views screenshot thumbnails, spots UI issue
   ↓
9. 📄 Checks JSON results for specific test failure
   ↓
10. 📝 Reads error log for detailed stack trace
    ↓
11. ✅ Identifies root cause in < 1 minute
```

### 5.2 Secondary Flows
- **Search:** Find specific test across all runs
- **Compare:** View differences between runs
- **Filter:** Focus on specific file types or time periods
- **Export:** Download files or share results

---

## 6. Visual Design System

### 6.1 Color Palette
```css
/* Status Colors */
--success: #22c55e    /* Green - passed tests */
--failure: #ef4444    /* Red - failed tests */
--warning: #f59e0b    /* Yellow - in-progress */
--neutral: #6b7280    /* Gray - inactive/skipped */

/* UI Colors */
--primary: #3b82f6    /* Blue - primary actions */
--background: #ffffff  /* White - main background */
--surface: #f8fafc    /* Light gray - cards/panels */
--border: #e2e8f0     /* Light gray - borders */
--text: #1f2937       /* Dark gray - primary text */
--text-muted: #6b7280 /* Medium gray - secondary text */
```

### 6.2 Typography
```css
/* Headers */
h1: 2rem, font-weight: 700    /* Page titles */
h2: 1.5rem, font-weight: 600  /* Section headers */
h3: 1.25rem, font-weight: 600 /* Component titles */

/* Body */
body: 1rem, font-weight: 400  /* Regular text */
small: 0.875rem, font-weight: 400 /* Metadata */
code: 0.875rem, monospace     /* Code/logs */
```

### 6.3 Icons
- 🟢 Success (green circle)
- 🔴 Failure (red circle)  
- 🟡 In-progress (yellow circle)
- ⚪ Inactive (gray circle)
- 🖼️ Images
- 📄 JSON files
- 📝 Log files
- 📊 Statistics
- 🔍 Search
- 📥 Download

---

## 7. Technical Requirements

### 7.1 Frontend Framework
- **React 18+** with TypeScript
- **Next.js 14+** for SSR and routing
- **Tailwind CSS** for styling
- **Headless UI** for accessible components

### 7.2 State Management
- **React Query/TanStack Query** for server state
- **Zustand** for client state (if needed)
- **React Hook Form** for forms

### 7.3 Key Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "@headlessui/react": "^1.7.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.45.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.263.0"
  }
}
```

### 7.4 Performance Requirements
- **First Contentful Paint:** < 1.5s
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3s
- **Image loading:** Progressive with lazy loading
- **Virtual scrolling:** For large file lists

---

## 8. API Integration

### 8.1 Required Endpoints
```javascript
// Workflow management
GET /api/workflows
GET /api/workflows/:id/runs
GET /api/workflows/:id/stats

// Run details
GET /api/runs/:runId
GET /api/runs/:runId/files

// File access
GET /api/files/:fileId
GET /api/files/:fileId/content

// Search
GET /api/search?q=query&type=files&runId=123

// Statistics
GET /api/stats/overview
GET /api/stats/workflows/:id
```

### 8.2 Error Handling
- **Network errors:** Retry with exponential backoff
- **404 errors:** Show "not found" state
- **500 errors:** Show error boundary with retry
- **Loading states:** Skeleton placeholders

---

## 9. Accessibility

### 9.1 WCAG 2.1 AA Compliance
- **Color contrast:** 4.5:1 minimum ratio
- **Keyboard navigation:** Full keyboard support
- **Screen readers:** Proper ARIA labels
- **Focus management:** Visible focus indicators

### 9.2 Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- List elements for grouped content
- Button elements for interactive actions
- Form labels for all inputs

---

## 10. Implementation Phases

### Phase 1: Core Layout (Week 1)
- [ ] Main layout with sidebar
- [ ] Workflow list component
- [ ] Basic routing setup
- [ ] API integration foundation

### Phase 2: Run History (Week 2)
- [ ] Run history component
- [ ] Pagination implementation
- [ ] Filtering and sorting
- [ ] Status indicators

### Phase 3: File Display (Week 3)
- [ ] Run results dashboard
- [ ] File categorization
- [ ] Image gallery component
- [ ] JSON/log viewers

### Phase 4: Polish (Week 4)
- [ ] Search functionality
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Mobile responsiveness

---

This design specification provides a complete blueprint for implementing the frontend that matches the PRD requirements and delivers the optimal user experience for debugging GitHub Actions workflows.
