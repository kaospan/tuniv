from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_name: str = "Tunivo Studio API"
    app_version: str = "0.1.0"
    allowed_origin: str = os.getenv("TUNIVO_ALLOWED_ORIGIN", "http://localhost:5173")
    hmac_secret: str = os.getenv("TUNIVO_HMAC_SECRET", "tunivo-dev-secret")
    retention_hours: int = int(os.getenv("TUNIVO_RETENTION_HOURS", "2"))
    max_jobs_per_minute: int = int(os.getenv("TUNIVO_RATE_LIMIT", "6"))


settings = Settings()
