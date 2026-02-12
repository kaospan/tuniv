from __future__ import annotations

from pathlib import Path

from backend.agent.self_editing_agent import SelfEditingAgent
from backend.analysis.audio import analyze_audio
from backend.analysis.lyrics import summarize_lyrics
from backend.core.jobs import JobRequest
from backend.core.jobs import store
from backend.core.storage import job_dir
from backend.core.storage import schedule_retention_expiry
from backend.ledger.credits import CreditsLedger
from backend.montage.assembler import MontageAssembler
from backend.montage.clip_plan import plan_timeline
from backend.providers.mock_provider import MockVideoProvider
from backend.renderer.exporter import render_timeline


def run_job(job_id: str, req: JobRequest, audio_path: Path) -> None:
    job = store.get(job_id)
    if not job:
        return

    ledger = CreditsLedger(plan=job.plan)

    try:
        _validate_entitlements(job.plan, req.mode)

        store.update(job_id, status="running", progress=0.05, message="Analyze")
        audio_analysis = analyze_audio(audio_path, req.mode)

        store.update(job_id, progress=0.15, message="Understand")
        lyrics_summary = summarize_lyrics(req.lyrics)

        estimate = ledger.estimate_cost(audio_analysis["duration"], req.mode)
        ledger.reserve_credits(job_id, estimate)

        store.update(job_id, progress=0.30, message="Plan")
        timeline_plan = plan_timeline(audio_analysis, lyrics_summary, req.prompt)

        store.update(job_id, progress=0.45, message="Generate")
        workdir = job_dir(job_id)
        clip_dir = workdir / "clips"
        provider = MockVideoProvider(output_dir=clip_dir)
        clips = provider.generate_clips(timeline_plan, req.aspect_ratio)

        store.update(job_id, progress=0.62, message="Assemble")
        assembler = MontageAssembler()
        timeline = assembler.assemble(timeline_plan, clips)

        store.update(job_id, progress=0.74, message="Self-edit")
        agent = SelfEditingAgent(mode=req.mode)
        budget = 4 if req.mode == "fast" else 12
        improved_timeline, report = agent.improve(
            timeline=timeline,
            audio_analysis=audio_analysis,
            lyrics_summary=lyrics_summary,
            provider=provider,
            aspect_ratio=req.aspect_ratio,
            budget=budget,
        )

        store.update(job_id, progress=0.86, message="Export")
        output_path = workdir / "output" / "tunivo.mp4"
        render_timeline(improved_timeline, audio_path, output_path)

        ledger.commit_credits(job_id)

        report["duration_target_seconds"] = round(audio_analysis["duration"], 3)
        report["duration_output_seconds"] = round(improved_timeline.duration, 3)
        report["duration_delta_seconds"] = round(abs(audio_analysis["duration"] - improved_timeline.duration), 3)
        report["plan"] = job.plan
        report["mode"] = req.mode

        store.update(
            job_id,
            status="completed",
            progress=1.0,
            message="Complete",
            result_path=str(output_path),
            report=report,
            retention_expires_at=schedule_retention_expiry(),
        )
    except Exception as exc:
        ledger.release_credits(job_id)
        store.update(job_id, status="failed", message=str(exc), progress=1.0)


def _validate_entitlements(plan: str, mode: str) -> None:
    if mode == "high" and plan == "free":
        raise ValueError("high quality requires creator or pro plan")
