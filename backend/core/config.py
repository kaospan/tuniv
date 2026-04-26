from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")
load_dotenv(ROOT_DIR / "backend" / ".env")


def _split_origins(raw: str) -> tuple[str, ...]:
    return tuple(origin.strip() for origin in raw.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    app_name: str = "Tunivo Studio API"
    app_version: str = "0.1.0"
    allowed_origins: tuple[str, ...] = _split_origins(
        os.getenv(
            "TUNIVO_ALLOWED_ORIGIN",
            "http://localhost:5173,http://localhost:5174,http://localhost:5176,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5176,https://kaospan.github.io",
        )
    )
    hmac_secret: str = os.getenv("TUNIVO_HMAC_SECRET", "tunivo-dev-secret")
    retention_hours: int = int(os.getenv("TUNIVO_RETENTION_HOURS", "2"))
    max_jobs_per_minute: int = int(os.getenv("TUNIVO_RATE_LIMIT", "6"))
    songs_dir: str = os.getenv("TUNIVO_SONG_LIBRARY_DIR", "songs")
    default_cleanup_preset: str = os.getenv("TUNIVO_DEFAULT_CLEANUP_PRESET", "homemade_shock")
    hedra_api_key: str = os.getenv("HEDRA_API_KEY", "")
    hedra_api_base_url: str = os.getenv("HEDRA_API_BASE_URL", "https://api.hedra.com/web-app/public")
    hedra_credits_enabled: bool = os.getenv("TUNIVO_HEDRA_CREDITS_ENABLED", "false").lower() == "true"
    root_dir: Path = ROOT_DIR


settings = Settings()
