from __future__ import annotations

import threading
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, Field


class JobRequest(BaseModel):
    prompt: str = ""
    lyrics: str = ""
    mode: str = "fast"
    aspect_ratio: str = "16:9"
    auto_transcribe: bool = False


class UserSession(BaseModel):
    email: str
    plan: str = "free"


class JobStatus(BaseModel):
    id: str
    user_email: str
    plan: str
    status: str
    progress: float = 0.0
    message: str = ""
    created_at: datetime
    updated_at: datetime
    result_path: Optional[str] = None
    report: dict = Field(default_factory=dict)
    retention_expires_at: Optional[datetime] = None


class JobStore:
    def __init__(self) -> None:
        self._jobs: Dict[str, JobStatus] = {}
        self._lock = threading.Lock()

    def create(self, session: UserSession) -> JobStatus:
        job_id = str(uuid.uuid4())
        now = datetime.utcnow()
        job = JobStatus(
            id=job_id,
            user_email=session.email,
            plan=session.plan,
            status="queued",
            created_at=now,
            updated_at=now,
        )
        with self._lock:
            self._jobs[job_id] = job
        return job

    def get(self, job_id: str) -> Optional[JobStatus]:
        with self._lock:
            return self._jobs.get(job_id)

    def update(self, job_id: str, **updates) -> Optional[JobStatus]:
        with self._lock:
            current = self._jobs.get(job_id)
            if not current:
                return None
            payload = current.model_dump()
            payload.update(updates)
            payload["updated_at"] = datetime.utcnow()
            new_status = JobStatus(**payload)
            self._jobs[job_id] = new_status
            return new_status


store = JobStore()
