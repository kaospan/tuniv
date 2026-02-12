import shutil
import subprocess
from pathlib import Path

import pytest

from backend.montage.assembler import MontageAssembler
from backend.montage.clip_plan import plan_timeline
from backend.providers.mock_provider import MockVideoProvider
from backend.renderer.exporter import render_timeline


def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


@pytest.mark.skipif(not _ffmpeg_available(), reason="ffmpeg not available")
def test_duration_correctness(tmp_path: Path):
    analysis = {"duration": 6.0, "bpm": 120, "sections": [], "energy_curve": [], "mode": "fast"}
    lyrics = {"keywords": ["city"], "sentiment": "neutral", "themes": []}
    plan = plan_timeline(analysis, lyrics, "")
    provider = MockVideoProvider(tmp_path / "clips")
    clips = provider.generate_clips(plan, "16:9")
    assembler = MontageAssembler()
    timeline = assembler.assemble(plan, clips)

    audio_path = tmp_path / "audio.wav"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-t",
            "6.0",
            str(audio_path),
        ],
        check=True,
        capture_output=True,
    )

    final_path = tmp_path / "final.mp4"
    render_timeline(timeline, audio_path, final_path)

    duration = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(final_path)],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    assert abs(float(duration) - 6.0) <= 0.5
