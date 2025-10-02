# GitHub Actions Test Dashboard

A self-hosted dashboard that automatically collects and displays your GitHub Actions test results with screenshots, logs, and file artifacts - all in one place.

## What You Get

### 📸 **See Your Test Screenshots Instantly**
No more downloading artifacts and unzipping them. Every screenshot from your test runs is displayed in a file browser with instant preview.

### 📋 **Browse Test Results Like Files**
All your test artifacts (screenshots, logs, JSON reports) are organized in a familiar folder structure. Click to preview, download what you need.

### 🔍 **Job Logs and Steps**
View job logs and individual step status for every workflow run. No need to navigate through GitHub's UI.

### ⚡ **Automatic Updates**
The dashboard starts collecting data immediately and checks for new runs every 5 minutes. Click "Refresh Data" anytime for instant updates.

### 🎯 **Latest First**
Runs are sorted with the newest at the top. Focus on what just happened.

---

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- A GitHub Personal Access Token ([create one here](https://github.com/settings/tokens))
  - Needs `repo` and `actions:read` scopes

### 2. Setup

```bash
# Clone and enter directory
git clone <your-repo-url>
cd github-actions-test-dashboard

# Copy environment template
cp env.example .env

# Edit .env with your details
nano .env
```

Your `.env` should look like:
```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-username-or-org
GITHUB_REPO=your-repo-name
```

### 3. Start

```bash
docker compose up -d
```

### 4. Open

Visit **http://localhost** (or your server IP) in your browser.

That's it! The dashboard will start collecting your workflow data automatically.

---

## How It Works

### On First Start
1. Connects to GitHub and fetches your workflows
2. Downloads recent workflow runs (last 50)
3. Extracts all artifacts (screenshots, logs, reports)
4. Stores everything in a local PostgreSQL database

### Ongoing
- Checks GitHub every 5 minutes for new runs
- Automatically processes completed runs
- Extracts and stores all artifacts
- Updates the dashboard in real-time

### Manual Refresh
Click the "Refresh Data" button to fetch the latest runs immediately.

---

## What You Can Do

### View Workflows
- See all your workflows at a glance
- Check latest run status and success rate
- Click any workflow to see its run history

### Browse Runs
- Runs sorted newest first
- See status, duration, commit info
- File count for each run

### Inspect Run Details
- **Jobs & Steps**: Expand to see each job's steps and their status
- **Logs**: View complete job logs right in the dashboard
- **Files**: Browse extracted artifacts in a tree view
  - Screenshots (PNG, JPG)
  - JSON reports
  - Text logs
  - Other files

### Preview Files
- **Images**: Click to preview screenshots
- **JSON**: Formatted and readable
- **Text**: Plain text viewer
- **Download**: Get any file with one click

---

## Configuration

### Environment Variables

| Variable | What It Does | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | Your GitHub Personal Access Token | ✅ |
| `GITHUB_OWNER` | Repository owner (username or org) | ✅ |
| `GITHUB_REPO` | Repository name | ✅ |
| `PORT` | Backend API port (default: 3001) | ❌ |
| `POLL_INTERVAL_MINUTES` | How often to check GitHub (default: 5) | ❌ |

### Docker Ports
- **80**: Web dashboard (mapped to Nginx)
- **3001**: Backend API (internal)
- **3000**: Frontend (internal)
- **5432**: PostgreSQL (internal)

### Data Storage
All data is stored in Docker volumes:
- `postgres_data`: Database
- `screenshot_data`: Extracted files
- `temp_data`: Temporary downloads

### Clean Start
To wipe all data and start fresh:
```bash
docker compose down -v
docker compose up -d
```

---

## Troubleshooting

### Dashboard shows no workflows
- Check your `GITHUB_TOKEN` has correct permissions
- Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
- Check backend logs: `docker logs github-actions-test-dashboard-backend-1`

### "Refresh already in progress" error
The dashboard is already fetching data. Wait a moment and try again.

### No screenshots showing
- Make sure your workflow uploads artifacts
- The artifact must contain files (screenshots, logs, etc.)
- Expired artifacts cannot be downloaded

### Backend not starting
```bash
# Check logs
docker logs github-actions-test-dashboard-backend-1

# Common fixes:
# 1. Invalid GitHub token - update .env and restart
# 2. Database not ready - wait 10 seconds and check again
# 3. Port conflict - change PORT in .env
```

---

## For Developers

### Project Structure
```
├── backend/                 # Express.js API + Data Collector
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # GitHub API, data processing
│   │   ├── models/         # Database models
│   │   └── database/       # PostgreSQL migrations
├── frontend/               # Next.js dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # API client, utilities
│   │   └── app/           # Pages and layouts
├── nginx/                  # Nginx reverse proxy config
├── docs/                   # Design documents
└── docker-compose.yml      # All services defined here
```

### Local Development

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Database**:
```bash
# Use Docker for PostgreSQL
docker compose up -d database
```

### API Endpoints

- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:id/runs` - List runs for a workflow
- `GET /api/runs/:id/files` - Get run details and files
- `GET /api/runs/:id/jobs` - Get jobs and steps
- `GET /api/runs/:id/jobs/:jobId/logs` - Get job logs
- `POST /api/refresh/collect` - Trigger manual refresh
- `GET /api/refresh/status` - Check collection status
- `GET /api/files/:filename` - Download extracted file

### Code Guidelines

See [CLAUDE.md](CLAUDE.md) for our code review principles:
- Simplicity first
- Fail fast, no defensive programming
- General solutions over specific cases
- Consistent patterns everywhere

---

## Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Next.js + React + Tailwind CSS
- **Database**: PostgreSQL
- **API Client**: Octokit (GitHub API)
- **Reverse Proxy**: Nginx
- **Deployment**: Docker + Docker Compose

---

## Roadmap

### ✅ Completed
- Automatic data collection on startup
- Periodic polling (every 5 minutes)
- Manual refresh button
- File manager with tree view
- Image/JSON/text preview
- Job logs and steps display
- Concurrent request protection
- Hash-based unique file naming

### 🚧 Future Ideas
- Multi-repository support
- Search and filtering
- Real-time updates via webhooks
- Test trend analysis
- Flaky test detection
- Custom artifact handling

---

## Contributing

Found a bug or have an idea? [Open an issue](https://github.com/YOUR_USERNAME/github-actions-test-dashboard/issues)!

Pull requests welcome:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a PR

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Made for developers who want to see their test results, not dig through GitHub's UI.**
