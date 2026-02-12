from pathlib import Path

from backend.montage.assembler import MontageAssembler
from backend.montage.clip_plan import plan_timeline
from backend.providers.mock_provider import GeneratedClip


def test_montage_duration_matches_audio() -> None:
    analysis = {
        "duration": 60.0,
        "bpm": 120,
        "sections": [
            {"start": 0.0, "end": 20.0, "label": "verse"},
            {"start": 20.0, "end": 40.0, "label": "chorus"},
            {"start": 40.0, "end": 60.0, "label": "outro"},
        ],
        "energy_curve": [{"time": 0.0, "energy": 0.5}, {"time": 20.0, "energy": 0.8}],
        "mode": "fast",
    }
    lyrics = {"keywords": ["night", "city"], "sentiment": "neutral", "themes": ["night"]}

    plan = plan_timeline(analysis, lyrics, user_prompt="")
    clips = [
        GeneratedClip(
            segment_index=s.index,
            path=Path(f"clip-{s.index}.mp4"),
            prompt=s.prompt,
            duration=s.duration,
            seed=100 + s.index,
            provider="mock",
            visual_hash=f"h-{s.index}",
        )
        for s in plan.segments
    ]

    timeline = MontageAssembler().assemble(plan, clips)

    assert abs(timeline.duration - analysis["duration"]) <= 0.5
