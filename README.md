# Quick Share v2

A secure, ephemeral, versioned pastebin for markdown snippets.
Built with FastAPI + Next.js + TipTap Editor.

## 🚀 Features (Implemented)
- Document creation, editing, publish flow
## 🚀 Features (Remaining)
- Version tracking + delta storage
- Undo/Redo system + Redis
- Markdown view and render
- Expiration logic + cleanup doc
- Pagination + diff viewer (Stretch)
- Rate limits + tests

```
quickshare/
├── README.md                  # Project overview and instructions
├── docker-compose.yml         # Docker multi-container configuration
├── frontend/                  # Frontend application (Next.js)
│   ├── Dockerfile             # Frontend Docker config
│   ├── next.config.js         # Next.js configuration
│   ├── .dockerignore          # Ignore rules for Docker build context
│   ├── package.json           # Frontend dependencies and scripts
│   ├── styles/                # CSS/SCSS styles
│   └── pages/                 # Next.js pages
│       ├── editor.tsx         # Document editor page
│       ├── api/               # API route handlers
│       │   ├── get.ts
│       │   ├── create.ts
│       │   ├── update.ts
│       │   └── doc/
│       │       └── [short_id].ts
│       └── d/
│           ├── [short_id].tsx
│           └── [short_id]/
│               └── [creatorHash].tsx
├── backend/                   # Backend application (Python/FastAPI)
│   ├── db.py                  # Database schema/operations
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend Docker config
│   ├── .env                   # Environment variables (excluded from version control)
│   └── main.py                # API entrypoint
└── .git/                      # Git metadata (hidden folder)
```


## 📦 Tech Stack
- Frontend: Next.js, React, TipTap
- Backend: FastAPI
- Docker: Docker + Docker Compose

## 🛠️ Getting Started

```bash
# Build and start both services
docker compose -f docker-compose.yml up --build
