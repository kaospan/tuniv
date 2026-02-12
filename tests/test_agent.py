from __future__ import annotations

from pathlib import Path

from backend.montage.assembler import Timeline, TimelineItem
from backend.montage.clip_plan import TimelineSegment
from backend.providers.mock_provider import GeneratedClip
from backend.agent.self_editing_agent import SelfEditingAgent


def make_timeline() -> Timeline:
    segment = TimelineSegment(0, 0, 4, 4, "verse", 0.6, "prompt", [])
    clip = GeneratedClip(0, Path("clip.mp4"), "prompt", 4, 123, "mock", "hash-a")
    return Timeline(items=[TimelineItem(segment=segment, clip=clip, transition="cut")])


def test_agent_determinism():
    agent = SelfEditingAgent(mode="fast")
    timeline = make_timeline()
    score1 = agent.evaluate(timeline, {"audio": {"bpm": 120}, "lyrics": {"keywords": []}})
    score2 = agent.evaluate(timeline, {"audio": {"bpm": 120}, "lyrics": {"keywords": []}})
    assert score1["total"] == score2["total"]
    assert score1 == score2
