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
            "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://kaospan.github.io",
        )
    )
    hmac_secret: str = os.getenv("TUNIVO_HMAC_SECRET", "tunivo-dev-secret")
    retention_hours: int = int(os.getenv("TUNIVO_RETENTION_HOURS", "2"))
    max_jobs_per_minute: int = int(os.getenv("TUNIVO_RATE_LIMIT", "6"))


settings = Settings()
