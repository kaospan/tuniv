from __future__ import annotations

import shutil
import uuid
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
from backend.models.schemas import (
    AuthRequest,
    AuthResponse,
    CleanupPresetItem,
    JobCreateResponse,
    JobDetailResponse,
    SongLibraryResponse,
)
from backend.pipeline import run_job
from backend.services.song_library import list_songs, resolve_song_path
from backend.services.video_cleanup import available_presets, cleanup_video_file
from backend.utils.logging import get_logger
from backend.utils.validation import (
    safe_filename,
    validate_audio_content_type,
    validate_mode,
    validate_video_content_type,
)

app = FastAPI(title=settings.app_name, version=settings.app_version)
logger = get_logger(__name__)

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
    audio: UploadFile | None = File(None),
    song_id: str = Form(""),
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

    try:
        validate_mode(mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not audio and not song_id.strip():
        raise HTTPException(status_code=422, detail="provide audio file or song_id")

    if audio:
        try:
            validate_audio_content_type(audio.content_type)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    req = JobRequest(
        prompt=prompt,
        lyrics=lyrics,
        mode=mode,
        aspect_ratio=aspect_ratio,
        auto_transcribe=auto_transcribe,
    )

    job = store.create(session)
    workdir = job_dir(job.id)
    audio_path = workdir / "input" / "track.mp3"
    audio_path.parent.mkdir(parents=True, exist_ok=True)

    if audio:
        audio_name = safe_filename(audio.filename, "track.mp3")
        audio_path = workdir / "input" / audio_name
        with audio_path.open("wb") as f:
            shutil.copyfileobj(audio.file, f)
    else:
        try:
            source_song = resolve_song_path(song_id)
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        audio_path = workdir / "input" / safe_filename(source_song.name, "track.mp3")
        shutil.copy2(source_song, audio_path)

    logger.info("queued job %s for %s", job.id, session.email)

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


@app.get("/api/library/songs", response_model=SongLibraryResponse)
async def get_song_library() -> SongLibraryResponse:
    return SongLibraryResponse(songs=list_songs())


@app.get("/api/videos/cleanup/presets", response_model=list[CleanupPresetItem])
async def get_cleanup_presets() -> list[CleanupPresetItem]:
    return [CleanupPresetItem(**item) for item in available_presets()]


@app.post("/api/videos/cleanup")
async def cleanup_video(
    video: UploadFile = File(...),
    preset: str = Form(""),
) -> FileResponse:
    try:
        validate_video_content_type(video.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    cleanup_job_id = f"cleanup-{uuid.uuid4().hex}"
    workdir = job_dir(cleanup_job_id)
    input_path = workdir / "input" / safe_filename(video.filename, "input.mp4")
    output_path = workdir / "output" / "cleaned.mp4"

    input_path.parent.mkdir(parents=True, exist_ok=True)
    with input_path.open("wb") as f:
        shutil.copyfileobj(video.file, f)

    try:
        cleaned_path = cleanup_video_file(input_path, output_path, preset)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except (FileNotFoundError, RuntimeError) as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    logger.info("cleanup completed for %s", cleanup_job_id)
    return FileResponse(cleaned_path, media_type="video/mp4", filename=f"tunivo-cleaned-{cleanup_job_id}.mp4")


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "brand": "Tunivo.ai"}
