# Migration Notes

## Source-to-Target Mapping

### `tuniv-backend` -> `tuniv/backend`
- Backend implementation is now canonical in `tuniv/backend`.
- Root scripts and workflows no longer depend on external `D:/tuniv-backend`.

### `tuniv/frontend` + `tuniv/client` -> `tuniv/client`
- `client` chosen as canonical web app for richer architecture and maintainability.
- CI/deploy now build and publish `client` artifacts.

### `song` -> integrated backend services
- Integrated feature patterns:
  - song library discovery/resolution
  - cleanup preset post-processing API
- Experimental/standalone `song` workflows remain separate while core reusable behavior is now available in unified backend services.

## Behavioral Compatibility

- Existing auth/job/download endpoints remain intact.
- Existing client job flow remains compatible.
- Added optional `song_id` support to `POST /api/jobs` for library-based execution.

## Environment Changes

New/standardized variables:
- `TUNIVO_SONG_LIBRARY_DIR`
- `TUNIVO_DEFAULT_CLEANUP_PRESET`
- `TUNIVO_LOG_LEVEL`
- `VITE_API_BASE` (canonical client env var)

## Operational Notes

- Ensure ffmpeg is available on PATH for rendering and cleanup endpoints.
- Configure `TUNIVO_ALLOWED_ORIGIN` to include local + hosted client URLs.
