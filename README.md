# Project Control MVP

This repository contains a starter monorepo for a construction project controls application.

## Structure

- `apps/api` — FastAPI backend
- `apps/web` — Next.js frontend
- `docker-compose.yml` — local development environment

## Quick start

```bash
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

## Stack

- Next.js + TypeScript
- FastAPI + SQLAlchemy + Pydantic
- PostgreSQL
- Docker Compose
