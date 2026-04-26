# Repository Audit Report

## Scope
Audited and compared:
- `tuniv`
- `tuniv-backend`
- `song`

## Repository Responsibilities

### `tuniv`
- Full-stack product shell (backend + two frontend variants).
- Contains active automated tests (`tests/`).
- Contains deployment workflows and local orchestration scripts.

### `tuniv-backend`
- Standalone backend package variant of the same FastAPI pipeline in `tuniv/backend`.
- Mostly duplicated code with import-path differences (`core.*` vs `backend.core.*`).
- Minimal repository metadata/documentation.

### `song`
- Advanced experimental pipeline and API for image/audio driven music videos.
- Includes unique post-processing capabilities (cleanup presets, media library patterns).
- Contains independent test coverage for its API and pipeline helpers.

## Dependencies, Frameworks, Build Systems

### Python backends
- FastAPI + Uvicorn + Pydantic + python-multipart
- FFmpeg runtime dependency for rendering/cleanup
- Pytest for tests

### Web clients
- React + Vite + TypeScript
- `tuniv/client` includes richer UI/component system and project UX
- `tuniv/frontend` is a simpler, overlapping implementation

### Build/deploy
- Bun scripts at root
- GitHub Actions for CI + Pages
- Railway deployment for backend

## Overlap Analysis

### Strong duplication
- `tuniv-backend/**` and `tuniv/backend/**`
  - Same module layout
  - Same behavior
  - Differences mainly import namespace and packaging context

### Feature overlap
- `tuniv/client` and `tuniv/frontend`
  - Both React/Vite frontends
  - `client` is superior (routing, query/state abstractions, richer UX components)

## Unique Feature Analysis

### Unique in `tuniv`
- Existing backend unit tests and deterministic agent tests
- Better project-level orchestration and CI setup

### Unique in `song`
- Song library-oriented media workflow patterns
- Post-processing cleanup preset model and ffmpeg enhancement pipeline

## Selection Decisions (Best Implementations)

1. **Canonical backend**: `tuniv/backend`
   - Chosen for existing tests and integrated project context.
2. **Canonical frontend**: `tuniv/client`
   - Chosen for stronger UX architecture and maintainability.
3. **Adopted from `song`**:
   - Song library listing/resolution capability
   - Video cleanup preset service and API endpoint

## Dead/Redundant Artifacts Identified
- Root web-app switching scripts for frontend/client toggling
- `web-app.config.json`
- CI/pages workflows building `frontend` instead of canonical `client`
- External path coupling to `D:/tuniv-backend` in root dev script

## Outcome
The merged architecture now centers on `tuniv` with:
- One canonical backend (`backend`)
- One canonical client (`client`)
- Reusable service modules integrating key `song` functionality
- Simplified scripts/workflows and clearer project boundaries
