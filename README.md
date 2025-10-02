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

5. Open your browser:
```
http://localhost:3000
```

## 📁 Project Structure

```
github-actions-test-dashboard/
├── backend/                 # Backend API and data collector
│   ├── src/
│   │   ├── api/            # REST API endpoints
│   │   ├── collector/      # GitHub data collection service
│   │   ├── db/             # Database models and migrations
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React frontend dashboard
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── Dockerfile
├── docs/                   # Documentation
│   ├── PRD.md             # Product requirements
│   ├── API.md             # API documentation
│   └── SETUP.md           # Detailed setup guide
├── docker-compose.yml      # Docker compose configuration
├── .env.example           # Environment variables template
├── .gitignore
└── README.md
```

## 📖 Documentation

- [Product Requirements (PRD)](docs/PRD.md) - What this product does
- [Setup Guide](docs/SETUP.md) - Detailed installation instructions
- [API Documentation](docs/API.md) - Backend API reference

## 🛠️ Development

### Running locally without Docker

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Database:**
```bash
# Make sure PostgreSQL is running
createdb test_dashboard
cd backend
npm run migrate
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
| `PORT` | Backend API port | No | 3001 |
| `POLL_INTERVAL_MINUTES` | How often to check for new runs | No | 5 |
| `SCREENSHOT_STORAGE_PATH` | Where to store screenshots | No | ./data/screenshots |

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

### Current (v1.0)
- [x] View all workflows and their status
- [x] Browse workflow run history
- [x] See test results with failures first
- [x] View test logs with syntax highlighting
- [x] Display screenshots inline (no downloads!)
- [x] Search and filter tests
- [x] Track test history and trends

### Planned (Future)
- [ ] Multi-repository support
- [ ] Real-time updates via webhooks
- [ ] Slack/email notifications
- [ ] Team collaboration features
- [ ] AI-powered failure analysis

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

**Status:** 🚧 In Development

Made with ❤️ for QA Engineers and developers who value their time