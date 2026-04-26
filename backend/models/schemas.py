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


class SongLibraryItem(BaseModel):
    id: str
    filename: str
    bytes: int
    modified_at: str


class SongLibraryResponse(BaseModel):
    songs: list[SongLibraryItem]


class CleanupPresetItem(BaseModel):
    value: str
    label: str
    description: str
