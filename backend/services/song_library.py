from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from backend.core.config import settings

SUPPORTED_SONG_EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"}


def _songs_root(songs_dir: Path | None = None) -> Path:
    configured = songs_dir or Path(settings.songs_dir)
    root = configured if configured.is_absolute() else (settings.root_dir / configured)
    return root.resolve()


def list_songs(songs_dir: Path | None = None) -> list[dict]:
    root = _songs_root(songs_dir)
    if not root.exists():
        return []

    songs: list[dict] = []
    for path in sorted(root.glob("*")):
        if not path.is_file() or path.suffix.lower() not in SUPPORTED_SONG_EXTENSIONS:
            continue
        stat = path.stat()
        songs.append(
            {
                "id": path.name,
                "filename": path.name,
                "bytes": stat.st_size,
                "modified_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
            }
        )

    return songs


def resolve_song_path(song_id: str, songs_dir: Path | None = None) -> Path:
    value = (song_id or "").strip()
    if not value:
        raise ValueError("song_id is empty")
    if "/" in value or "\\" in value or value.startswith("."):
        raise ValueError("song_id must be a filename (no paths)")

    root = _songs_root(songs_dir)
    candidate = (root / value).resolve()

    if root not in candidate.parents:
        raise ValueError("Invalid song_id path")
    if not candidate.exists() or not candidate.is_file():
        raise FileNotFoundError("Song not found in library")
    if candidate.suffix.lower() not in SUPPORTED_SONG_EXTENSIONS:
        raise ValueError("Unsupported song file type")

    return candidate
