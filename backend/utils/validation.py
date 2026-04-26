from __future__ import annotations

from pathlib import Path


AUDIO_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/aac",
    "audio/mp4",
    "audio/flac",
    "audio/ogg",
}

VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "video/webm",
}


def validate_mode(mode: str) -> None:
    if mode not in {"fast", "high"}:
        raise ValueError("mode must be fast or high")


def validate_audio_content_type(content_type: str | None) -> None:
    if not content_type or content_type not in AUDIO_CONTENT_TYPES:
        raise ValueError("unsupported audio format")


def validate_video_content_type(content_type: str | None) -> None:
    if content_type and content_type not in VIDEO_CONTENT_TYPES and not content_type.startswith("video/"):
        raise ValueError("unsupported video format")


def safe_filename(name: str | None, fallback: str) -> str:
    candidate = (name or "").strip()
    if not candidate:
        return fallback
    return Path(candidate).name
