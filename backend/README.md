# Backend API

The backend API for the GitHub Actions Test Dashboard.

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp env.example .env
# Edit .env with your GitHub token and repository details
```

3. **Start development server:**
```bash
npm run dev
```

4. **Test the API:**
```bash
curl http://localhost:3001/api/health
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies

### Workflows
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:workflowId` - Get specific workflow
- `GET /api/workflows/:workflowId/runs` - Get workflow runs

### Runs
- `GET /api/runs/:runId` - Get run details (jobs + artifacts)
- `GET /api/runs/:runId/jobs` - Get run jobs
- `GET /api/runs/:runId/artifacts` - Get run artifacts
- `GET /api/runs/:runId/test-results` - Process and get test results

### Tests
- `GET /api/tests/search` - Search tests (placeholder for DB)
- `GET /api/tests/:testName/history` - Get test history (placeholder for DB)
- `GET /api/tests/screenshots/:filename` - Serve screenshot files

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_OWNER` | Repository owner | Yes | - |
| `GITHUB_REPO` | Repository name | Yes | - |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `SCREENSHOT_STORAGE_PATH` | Screenshot storage path | No | ./data/screenshots |
| `POLL_INTERVAL_MINUTES` | Data collection interval | No | 5 |

## GitHub Token Permissions

Your GitHub Personal Access Token needs:
- `repo` - Full repository access
- `actions:read` - Read workflow runs and artifacts

## Features

### ✅ Implemented
- GitHub API integration
- Workflow and run data fetching
- Artifact download and processing
- Screenshot extraction and serving
- Test result parsing (Playwright, Jest, generic formats)
- Health checks with dependency status
- Docker support

### 🚧 Planned (requires database)
- Test result storage and history
- Search functionality
- Test trend analysis
- Data persistence

## Architecture

The API is designed to be database-agnostic. Currently, it fetches data directly from GitHub API and processes artifacts on-demand. Once a database is added, it will:

1. **Data Collector Service** - Polls GitHub API and stores results
2. **API Layer** - Serves stored data with fast queries
3. **File Storage** - Manages screenshots and artifacts

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Docker

```bash
# Build image
docker build -t github-actions-dashboard-backend .

# Run container
docker run -p 3001:3001 --env-file .env github-actions-dashboard-backend
```
