from __future__ import annotations

from dataclasses import dataclass
from typing import List

from backend.montage.clip_plan import TimelinePlan, TimelineSegment
from backend.providers.mock_provider import GeneratedClip


@dataclass
class TimelineItem:
    segment: TimelineSegment
    clip: GeneratedClip
    transition: str


@dataclass
class Timeline:
    items: List[TimelineItem]

    @property
    def duration(self) -> float:
        return sum(item.segment.duration for item in self.items)


class MontageAssembler:
    def assemble(self, plan: TimelinePlan, clips: List[GeneratedClip]) -> Timeline:
        clip_by_index = {clip.segment_index: clip for clip in clips}
        items: list[TimelineItem] = []
        for segment in plan.segments:
            clip = clip_by_index[segment.index]
            transition = "crossfade" if segment.index % 4 == 0 else "cut"
            items.append(TimelineItem(segment=segment, clip=clip, transition=transition))
        return Timeline(items=items)
