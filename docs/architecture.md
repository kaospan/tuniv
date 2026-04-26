# Unified Architecture

## Top-Level Structure

- `backend/`
  - `core/` – configuration, auth/session rules, storage, security, queue, rate limiting
  - `analysis/` – audio and lyric analysis
  - `montage/` – timeline planning and assembly
  - `providers/` – clip generation providers (mock/default)
  - `renderer/` – ffmpeg export and clip rendering
  - `agent/` – self-editing optimization loop
  - `services/` – reusable feature services (song library, cleanup pipeline)
  - `utils/` – shared helpers (validation, logging)
  - `models/` – request/response schemas
- `client/`
  - `src/components` – reusable UI elements
  - `src/pages` – route-level screens
  - `src/lib` + `src/hooks` – API and state/query helpers
- `tests/`
  - backend behavior and service/unit tests
- `docs/`
  - architecture, audit, migration, and refactor records

## Module Responsibilities

### Backend Core
- Keeps cross-cutting policy and infrastructure logic isolated from business workflow.
- `core/config.py` is the source of truth for runtime settings.

### Services Layer
- `services/song_library.py`: lists and resolves approved song files from a configured library.
- `services/video_cleanup.py`: encapsulates ffmpeg cleanup preset logic and command execution.

### API Layer
- `backend/main.py` composes orchestration endpoints and delegates to core/services.
- New merged endpoints:
  - `GET /api/library/songs`
  - `GET /api/videos/cleanup/presets`
  - `POST /api/videos/cleanup`

### Client Layer
- Canonical web experience lives in `client/`.
- Uses a shared API abstraction and route-driven UX.

## Design Decisions

1. **Canonicalization over duplication**
   - Kept `tuniv/backend` as source of truth.
2. **Service extraction for reuse**
   - Moved integrated song features into explicit backend services.
3. **Thin endpoint handlers**
   - Validation + orchestration in API; heavy logic in service/core modules.
4. **Operational simplification**
   - Removed runtime frontend switching and stale path-dependent scripts.

## Scalability Notes
- Service modules are designed for extension (e.g., provider adapters, object storage, auth hardening).
- Cleanup presets can be expanded without API contract changes.
- Song library can evolve into per-user scoped libraries with storage backends.
