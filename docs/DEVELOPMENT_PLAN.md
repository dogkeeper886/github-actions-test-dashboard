# GitHub Actions Test Dashboard - Development Priority Plan

## Priority Table

| Priority | Phase | Feature/Component | Effort | Dependencies | Business Value | Technical Risk | Status |
|----------|-------|-------------------|---------|--------------|----------------|----------------|--------|
| **P0** | **Foundation** | Project Setup & Infrastructure | Medium | None | Critical | Low | ✅ **DONE** |
| P0 | Foundation | Database Schema & Models | Medium | Project Setup | Critical | Low | ✅ **DONE** |
| P0 | Foundation | GitHub API Integration | High | DB Models | Critical | Medium | ✅ **DONE** |
| P0 | Foundation | Basic Data Collector Service | High | GitHub API | Critical | Medium | 🔄 **IN PROGRESS** |
| **P1** | **Core MVP** | Workflow List View | Medium | Data Collector | High | Low |
| P1 | Core MVP | Workflow Run History | Medium | Workflow List | High | Low |
| P1 | Core MVP | Test Results Dashboard | High | Run History | Critical | Medium |
| P1 | Core MVP | Basic Test Log Viewer | Medium | Test Results | High | Low |
| **P2** | **Essential UX** | Failed Tests Priority Display | Low | Test Results | Critical | Low |
| P2 | Essential UX | Screenshot Upload & Storage | Medium | Data Collector | High | Medium |
| P2 | Essential UX | Inline Screenshot Display | Medium | Screenshot Storage | High | Low |
| P2 | Essential UX | Basic Search Functionality | Medium | Test Results | High | Low |
| **P3** | **Enhanced Features** | Log Syntax Highlighting | Low | Log Viewer | Medium | Low |
| P3 | Enhanced Features | Test History Tracking | Medium | DB Models | Medium | Low |
| P3 | Enhanced Features | Basic Filtering (Status, Date) | Medium | Search | Medium | Low |
| P3 | Enhanced Features | Responsive UI Design | Medium | Core UI | Medium | Low |
| **P4** | **Analytics** | Test Statistics Dashboard | Medium | Test History | Medium | Low |
| P4 | Analytics | Flaky Test Detection | High | Statistics | Medium | High |
| P4 | Analytics | Success Rate Charts | Medium | Statistics | Medium | Low |
| **P5** | **Polish** | Advanced Search & Filters | Medium | Basic Search | Low | Low |
| P5 | Polish | Screenshot Lightbox/Modal | Low | Screenshot Display | Low | Low |
| P5 | Polish | Export Functionality | Low | Statistics | Low | Low |
| P5 | Polish | Dark Mode | Low | UI Components | Low | Low |

## Phase Breakdown

### **Phase 0: Foundation (P0)** ✅ **COMPLETED**
**Goal:** Get basic infrastructure running and data flowing
- ✅ Set up project structure (backend/docker) 
- ✅ Create PostgreSQL database schema for workflows, runs, files
- ✅ Implement GitHub API client with Octokit
- ✅ Build artifact download and file extraction system
- 🔄 Build data collector that polls GitHub and stores results (IN PROGRESS)
- **Success Criteria:** ✅ Data is being collected and stored

**Current Status:** Infrastructure complete, database operational, API working. Ready for enhanced data collection.

### **Phase 1: Core MVP (P1)** 🔄 **CURRENT PHASE**
**Goal:** Enhanced data collection and basic dashboard functionality
- 🔄 Implement periodic data collection (every 5 minutes)
- 🔄 Store workflow runs and extracted files in database
- 🔄 Build manual refresh capability
- ⏳ Display workflows and their runs (frontend needed)
- ⏳ Show file results with categorization (frontend needed)
- ⏳ View individual file content (frontend needed)
- **Success Criteria:** Users can see their workflow results in the dashboard

**Next Steps:** Complete data collection service, then build frontend components.

### **Phase 2: Essential UX (P2)**
**Goal:** Key differentiators that solve the main pain points
- Failed tests shown first (critical UX improvement)
- Screenshots displayed inline (no downloads needed)
- Basic search to find specific tests
- **Success Criteria:** Debugging time reduced significantly vs GitHub UI

### **Phase 3: Enhanced Features (P3)**
**Goal:** Polish and usability improvements
- Better log formatting and highlighting
- Historical test data and trends
- Filtering capabilities
- Mobile-friendly design
- **Success Criteria:** Professional, polished user experience

### **Phase 4+: Analytics & Polish (P4-P5)**
**Goal:** Advanced features and nice-to-haves
- Test analytics and trend analysis
- Advanced search and filtering
- UI polish and additional features

## Key Dependencies & Risks

**High Risk Items:**
- GitHub API rate limits and artifact handling
- Screenshot extraction from artifacts
- Database performance with large test datasets
- Flaky test detection algorithm

**Critical Path:**
Foundation → Core MVP → Essential UX (this gets you to a usable product)

## Effort Legend
- **Low:** 1-3 days
- **Medium:** 4-7 days  
- **High:** 1-2+ weeks

## Priority Legend
- **P0:** Must have for basic functionality
- **P1:** Core features for MVP
- **P2:** Essential UX improvements
- **P3:** Enhanced features for polish
- **P4:** Analytics and advanced features
- **P5:** Nice-to-have polish items
