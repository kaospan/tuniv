# Refactoring Summary

## Removed / Consolidated Redundancy

- Consolidated root runtime scripts to a single canonical app path.
- Removed obsolete frontend switching machinery:
  - `web-app.config.json`
  - `scripts/web-app-switch.mjs`
  - `scripts/web-app-run.mjs`
  - `scripts/web-app-deploy.mjs`
  - `scripts/web-app-utils.mjs`
- Switched CI and Pages workflows from `frontend` to `client`.
- Removed hard-coded dependency on external `D:/tuniv-backend` in dev scripts.

## New Shared Modules (DRY)

- `backend/utils/validation.py`
  - Mode validation
  - Audio/video content-type validation
  - Filename normalization
- `backend/utils/logging.py`
  - Central logger initialization and retrieval
- `backend/services/song_library.py`
  - Song listing and secure song-path resolution
- `backend/services/video_cleanup.py`
  - Cleanup preset registry and ffmpeg cleanup execution

## API Improvements

- Enhanced `POST /api/jobs` to support either:
  - uploaded audio (`audio`), or
  - library reference (`song_id`)
- Added:
  - `GET /api/library/songs`
  - `GET /api/videos/cleanup/presets`
  - `POST /api/videos/cleanup`

## Dependency Cleanup

- Added missing `python-dotenv` to `backend/requirements.txt` (already required by config loader).

## Test Additions

- `tests/test_song_library.py`
- `tests/test_video_cleanup_service.py`
- `tests/test_main_media_endpoints.py`

These tests cover newly merged service behavior and endpoint contracts.
