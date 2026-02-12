from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AuthRequest(BaseModel):
    email: str


class AuthResponse(BaseModel):
    email: str
    plan: str


class JobCreateResponse(BaseModel):
    id: str


class JobDetailResponse(BaseModel):
    id: str
    status: str
    progress: float
    message: str
    report: dict
    plan: str
    download_url: Optional[str] = None


class LedgerPreview(BaseModel):
    estimated_credits: int
    plan: str
