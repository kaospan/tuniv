from __future__ import annotations

import shutil
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from backend.core.auth import session_from_email
from backend.core.config import settings
from backend.core.jobs import JobRequest
from backend.core.jobs import store
from backend.core.queue import executor
from backend.core.rate_limit import SlidingWindowLimiter
from backend.core.security import create_signed_token, verify_signed_token
from backend.core.storage import job_dir
from backend.models.schemas import AuthRequest, AuthResponse, JobCreateResponse, JobDetailResponse
from backend.pipeline import run_job

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-User-Email"],
)

limiter = SlidingWindowLimiter(max_events=settings.max_jobs_per_minute)


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(payload: AuthRequest) -> AuthResponse:
    session = session_from_email(payload.email)
    return AuthResponse(email=session.email, plan=session.plan)


@app.post("/api/jobs", response_model=JobCreateResponse)
async def create_job(
    request: Request,
    audio: UploadFile = File(...),
    prompt: str = Form(""),
    lyrics: str = Form(""),
    mode: str = Form("fast"),
    aspect_ratio: str = Form("16:9"),
    auto_transcribe: bool = Form(False),
) -> JobCreateResponse:
    email = request.headers.get("X-User-Email")
    session = session_from_email(email)

    if not limiter.allow(session.email):
        raise HTTPException(status_code=429, detail="rate_limited")

    if mode not in {"fast", "high"}:
        raise HTTPException(status_code=400, detail="mode must be fast or high")

    if audio.content_type not in {"audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac", "audio/mp4"}:
        raise HTTPException(status_code=400, detail="unsupported audio format")

    req = JobRequest(
        prompt=prompt,
        lyrics=lyrics,
        mode=mode,
        aspect_ratio=aspect_ratio,
        auto_transcribe=auto_transcribe,
    )

    job = store.create(session)
    workdir = job_dir(job.id)
    audio_path = workdir / "input" / (audio.filename or "track.mp3")
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    with audio_path.open("wb") as f:
        shutil.copyfileobj(audio.file, f)

    executor.submit(run_job, job.id, req, audio_path)
    return JobCreateResponse(id=job.id)


@app.get("/api/jobs/{job_id}", response_model=JobDetailResponse)
async def get_job(job_id: str, request: Request) -> JobDetailResponse:
    email = session_from_email(request.headers.get("X-User-Email")).email
    job = store.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="job not found")
    if job.user_email != email:
        raise HTTPException(status_code=403, detail="forbidden")

    download_url = None
    if job.result_path:
        token = create_signed_token(job_id=job.id, email=email, secret=settings.hmac_secret)
        download_url = f"/api/jobs/{job.id}/download?token={token}"

    return JobDetailResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        message=job.message,
        report=job.report,
        plan=job.plan,
        download_url=download_url,
    )


@app.get("/api/jobs/{job_id}/download")
async def download_job(job_id: str, token: str = Query(...)) -> FileResponse:
    payload = verify_signed_token(token, settings.hmac_secret)
    if not payload:
        raise HTTPException(status_code=403, detail="invalid token")
    if payload.get("job_id") != job_id:
        raise HTTPException(status_code=403, detail="token mismatch")

    job = store.get(job_id)
    if not job or not job.result_path:
        raise HTTPException(status_code=404, detail="render not ready")

    return FileResponse(job.result_path, filename=f"tunivo-{job_id}.mp4", media_type="video/mp4")


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "brand": "Tunivo.ai"}
