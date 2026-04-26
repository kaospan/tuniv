# Tunivo Unified Studio

Unified monorepo for music-to-video generation, self-editing montage orchestration, and post-processing utilities.

## Status
[![CI](https://github.com/kaospan/tuniv/actions/workflows/ci.yml/badge.svg)](https://github.com/kaospan/tuniv/actions/workflows/ci.yml)
[![Deploy Client to GitHub Pages](https://github.com/kaospan/tuniv/actions/workflows/pages.yml/badge.svg)](https://github.com/kaospan/tuniv/actions/workflows/pages.yml)
[![Site](https://img.shields.io/badge/site-live-2ea44f?logo=githubpages&logoColor=white)](https://kaospan.github.io/tuniv/)

## What Was Unified
- `tuniv` is now the canonical project root.
- `tuniv-backend` functionality is consolidated into `tuniv/backend`.
- Best `song` capabilities were integrated into backend services:
	- song library discovery (`/api/library/songs`)
	- video cleanup presets + endpoint (`/api/videos/cleanup`)

See detailed reports in `docs/`.

## Project Layout
- `backend/` – FastAPI API, pipeline orchestration, services, and utilities
- `client/` – canonical React/Vite web app
- `tests/` – backend/unit integration tests
- `docs/` – architecture, audit, migration, and refactoring notes

## Run Locally

### Backend
```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Client
```bash
bun install
bun run --cwd client dev -- --host 0.0.0.0 --port 5176
```

### Root Scripts
```bash
bun run dev
bun run build
bun run deploy
```

Open `http://localhost:5176/tuniv/`.

## Key API Endpoints
- `POST /api/auth/login`
- `POST /api/jobs`
- `GET /api/jobs/{job_id}`
- `GET /api/jobs/{job_id}/download`
- `GET /api/library/songs`
- `GET /api/videos/cleanup/presets`
- `POST /api/videos/cleanup`

## Environment Variables
- `TUNIVO_ALLOWED_ORIGIN`
- `TUNIVO_HMAC_SECRET`
- `TUNIVO_RETENTION_HOURS`
- `TUNIVO_RATE_LIMIT`
- `TUNIVO_SONG_LIBRARY_DIR`
- `TUNIVO_DEFAULT_CLEANUP_PRESET`
- `TUNIVO_LOG_LEVEL`
- `VITE_API_BASE`

## Tests
```bash
python -m pytest tests -q
```
