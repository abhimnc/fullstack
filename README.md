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



## 📦 Tech Stack
- Frontend: Next.js, React, TipTap
- Backend: FastAPI
- Docker: Docker + Docker Compose

## 🛠️ Getting Started

```bash
# Build and start both services
docker compose -f docker-compose.yml up --build
