# Tunivo Studio

Investor-grade music-to-video montage generator with a self-editing agent.

## Features
- Upload song + optional prompt/lyrics
- Fast / High Quality modes
- Self-editing agent with scorecard + issue list
- Mock video provider (placeholder clips)
- FFmpeg rendering, audio/video sync
- Session-scoped storage + signed download URLs

## Quickstart

### Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Tests

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
pytest
```

## API Notes
- Pass `X-User-Email` header for job creation and status.
- Download URLs are signed and returned in the job detail response.

## Architecture
- `backend/analysis`: audio + lyrics analysis
- `backend/providers`: video provider adapters
- `backend/montage`: timeline planning + assembly
- `backend/agent`: self-editing agent
- `backend/renderer`: FFmpeg render/export
- `backend/ledger`: credits boundary

## Demo Script
1. Run a 60s song in Fast mode, show pipeline and scorecard.
2. Run same in High Quality mode, show improved score threshold.

## Notes
- Requires FFmpeg installed and on PATH.
- Mock provider is for demo and pipeline validation.
