from __future__ import annotations

import shutil
from datetime import datetime, timedelta
from pathlib import Path

from backend.core.config import settings

BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = BASE_DIR / "storage"


def job_dir(job_id: str) -> Path:
    path = STORAGE_DIR / "jobs" / job_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def schedule_retention_expiry() -> datetime:
    return datetime.utcnow() + timedelta(hours=settings.retention_hours)


def cleanup_expired_jobs(jobs: list[dict]) -> int:
    now = datetime.utcnow()
    removed = 0
    for job in jobs:
        expiry = job.get("retention_expires_at")
        if not expiry or expiry > now:
            continue
        path = STORAGE_DIR / "jobs" / job["id"]
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
            removed += 1
    return removed
