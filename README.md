# GitHub Actions Test Dashboard

A self-hosted web dashboard for visualizing GitHub Actions workflow test results with inline screenshots and easy-to-read logs.

## 🎯 Purpose

Stop wasting time clicking through GitHub's UI to debug test failures. This dashboard gives you:
- ✅ **Instant failure visibility** - Failed tests shown first
- 📸 **Inline screenshots** - No artifact downloads needed
- 📋 **Readable logs** - Syntax highlighting and search
- 📊 **Test history** - Track trends and find flaky tests

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- GitHub Personal Access Token with `repo` and `actions:read` scopes

### Setup

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/github-actions-test-dashboard.git
cd github-actions-test-dashboard
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure your `.env`:
```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repository_name
DATABASE_URL=postgresql://postgres:password@db:5432/test_dashboard
```

4. Start the application:
```bash
docker-compose up -d
```

5. Access the API:
```
Backend API: http://localhost:3001
API Endpoints: http://localhost:3001/api/workflows
```

**Note:** Frontend UI is planned for future development. Currently you can interact with the REST API directly or use tools like curl/Postman.

## 📁 Project Structure

```
github-actions-test-dashboard/
├── backend/                 # Backend API and data collector
│   ├── src/
│   │   ├── routes/         # REST API endpoints
│   │   ├── services/       # GitHub API integration
│   │   ├── database/       # PostgreSQL connection and migrations
│   │   ├── models/         # Data models (WorkflowRun, ExtractedFile)
│   │   └── server.js       # Express server entry point
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
│   ├── PRD.md             # Product requirements
│   ├── frontend-design.md # Frontend design specification
│   ├── data-flow-design.md # Data collection and flow design
│   └── simple-recording-design.md # Framework-agnostic approach
├── data/                   # Local data storage
│   ├── screenshots/        # Extracted screenshot files
│   └── temp/              # Temporary extraction directory
├── docker-compose.yml      # Docker compose with PostgreSQL
├── .env.example           # Environment variables template
├── .gitignore
└── README.md
```

**Note:** Frontend is planned for future development. Currently backend-only with comprehensive API.

## 📖 Documentation

- [Product Requirements (PRD)](docs/PRD.md) - What this product does and goals
- [Frontend Design](docs/frontend-design.md) - Complete UI/UX specification
- [Data Flow Design](docs/data-flow-design.md) - How data collection works
- [Simple Recording Design](docs/simple-recording-design.md) - Framework-agnostic approach

## 🛠️ Development

### Running locally without Docker

**Backend:**
```bash
cd backend
npm install
npm start
```

**Database:**
```bash
# Make sure PostgreSQL is running locally
createdb github_actions_dashboard
# Set DATABASE_URL in .env to point to local PostgreSQL
# Database migrations run automatically on server start
```

**Manual Data Collection:**
```bash
# Trigger manual refresh via API
curl -X POST http://localhost:3001/api/refresh

# View collected workflows
curl http://localhost:3001/api/workflows

# View workflow runs
curl http://localhost:3001/api/workflows/WORKFLOW_ID/runs
```

## 🔧 Configuration

### GitHub Token Permissions
Your GitHub Personal Access Token needs:
- `repo` - Full repository access
- `actions:read` - Read workflow runs and artifacts

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_OWNER` | Repository owner (username or org) | Yes | - |
| `GITHUB_REPO` | Repository name | Yes | - |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `DATABASE_SSL` | Enable SSL for database connection | No | false |
| `PORT` | Backend API port | No | 3001 |
| `POLL_INTERVAL_MINUTES` | How often to check for new runs | No | 5 |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📊 Features

### Current (Backend v1.0)
- [x] GitHub Actions API integration
- [x] Automatic artifact download and extraction
- [x] PostgreSQL database for persistent storage
- [x] File categorization (images, JSON, text, binary)
- [x] REST API for workflow and run data
- [x] Manual refresh capability
- [x] Framework-agnostic file recording

### In Progress
- [ ] Periodic data collection service
- [ ] Enhanced API endpoints with pagination
- [ ] File content serving and search

### Planned (Frontend + Features)
- [ ] React dashboard UI
- [ ] Inline screenshot viewing
- [ ] File content viewers (JSON, logs)
- [ ] Search and filtering
- [ ] Multi-repository support
- [ ] Real-time updates via webhooks

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for teams frustrated with GitHub Actions' native test reporting
- Inspired by Allure Report and ReportPortal

## 📧 Support

- Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/github-actions-test-dashboard/issues)
- Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/github-actions-test-dashboard/discussions)

---

**Status:** 🚧 Backend Complete, Frontend In Planning

**Current Phase:** Enhanced data collection and periodic polling  
**Next Phase:** Frontend dashboard development

Made with ❤️ for QA Engineers and developers who value their time