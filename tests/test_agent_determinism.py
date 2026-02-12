from pathlib import Path

from agent.self_editing_agent import SelfEditingAgent
from montage.assembler import MontageAssembler
from montage.clip_plan import plan_timeline
from providers.mock_provider import GeneratedClip


def _build_timeline():
    analysis = {
        "duration": 24.0,
        "bpm": 118,
        "sections": [
            {"start": 0.0, "end": 8.0, "label": "intro"},
            {"start": 8.0, "end": 16.0, "label": "verse"},
            {"start": 16.0, "end": 24.0, "label": "chorus"},
        ],
        "energy_curve": [{"time": 0.0, "energy": 0.4}, {"time": 12.0, "energy": 0.7}],
        "mode": "high",
    }
    lyrics = {"keywords": ["fire", "ocean"], "sentiment": "uplifting", "themes": ["fire"]}
    plan = plan_timeline(analysis, lyrics, user_prompt="cinematic skyline")
    clips = [
        GeneratedClip(
            segment_index=s.index,
            path=Path(__file__),
            prompt=s.prompt,
            duration=s.duration,
            seed=500 + s.index,
            provider="mock",
            visual_hash=f"fixed-{s.index}",
        )
        for s in plan.segments
    ]
    timeline = MontageAssembler().assemble(plan, clips)
    return timeline, analysis, lyrics


def test_agent_evaluation_is_deterministic() -> None:
    timeline, analysis, lyrics = _build_timeline()
    agent = SelfEditingAgent(mode="high")

    first = agent.evaluate(timeline, {"audio": analysis, "lyrics": lyrics})
    second = agent.evaluate(timeline, {"audio": analysis, "lyrics": lyrics})

    assert first == second
