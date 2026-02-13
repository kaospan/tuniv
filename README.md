# Tunivo Studio

Investor-grade music-to-video montage app with a self-editing agent.

## Status
[![CI](https://github.com/kaospan/tuniv/actions/workflows/ci.yml/badge.svg)](https://github.com/kaospan/tuniv/actions/workflows/ci.yml)
[![Deploy Frontend to GitHub Pages](https://github.com/kaospan/tuniv/actions/workflows/pages.yml/badge.svg)](https://github.com/kaospan/tuniv/actions/workflows/pages.yml)
[![Site](https://img.shields.io/badge/site-live-2ea44f?logo=githubpages&logoColor=white)](https://kaospan.github.io/tuniv/)

## Production
- Live site: `https://kaospan.github.io/tuniv/`

## Features
- Upload a song, optional visual prompt, and optional lyrics.
- Generates a full-length montage aligned to song duration.
- Self-editing agent evaluates coherence, pacing, variety, and relevance.
- Signed download URLs, rate limiting, plan-aware entitlements, and retention windows.
- Mock provider for end-to-end demos without external genAI services.

## Tech
- Frontend: React + Vite
- Backend: FastAPI
- Rendering: FFmpeg (required on PATH)

## Run Locally

### Backend
```bash
python -m venv .venv
. .venv/Scripts/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend
```bash
bun install
bun run --cwd frontend dev
```

### Root Bun Scripts
```bash
bun run dev
bun run build
bun run deploy
```

Open `http://localhost:5173/tuniv/`.

Set `VITE_API_URL` if the API runs on a different host/port.

### Deploy
- Automatic: pushing to `main` runs `.github/workflows/pages.yml` and deploys to GitHub Pages.
- Manual from local machine:
```bash
bun run build
bun run deploy
```

### Environment Variables
- `TUNIVO_ALLOWED_ORIGIN` (default `http://localhost:5173,http://localhost:5174,https://kaospan.github.io`)
- `TUNIVO_HMAC_SECRET` (default `tunivo-dev-secret`)
- `TUNIVO_RETENTION_HOURS` (default `2`)
- `TUNIVO_RATE_LIMIT` (default `6`)

## Demo Script (Investor Flow)
1. Upload a 60s song and click **Generate Music Video** in Fast mode.
2. Observe progress steps and agent scorecard improving across iterations.
3. Download and play the MP4 preview.
4. Repeat with **High Quality** for a deeper self-editing loop.

## Tests
```bash
python -m pytest tests
```

## Notes
- Mock provider generates placeholder clips with stylized color + text overlay.
- Storage is local and ephemeral; retention cleanup is available in `backend/core/storage.py`.
- For production: swap provider adapters, add object storage (S3/GCS), and enable at-rest encryption.
- Auto-transcribe is currently a stub; plug in your preferred ASR provider.
