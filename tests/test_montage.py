from __future__ import annotations

from pathlib import Path

from montage.assembler import Timeline, TimelineItem
from montage.clip_plan import TimelineSegment
from providers.mock_provider import GeneratedClip


def test_montage_duration():
    segments = [
        TimelineSegment(0, 0, 3, 3, "intro", 0.4, "p", []),
        TimelineSegment(1, 3, 7, 4, "verse", 0.5, "p", []),
    ]
    items = []
    for seg in segments:
        clip = GeneratedClip(seg.index, Path("clip.mp4"), seg.prompt, seg.duration, 10, "mock", "hash")
        items.append(TimelineItem(segment=seg, clip=clip, transition="cut"))
    timeline = Timeline(items=items)
    assert abs(timeline.duration - 7.0) < 0.01
