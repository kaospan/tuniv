from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List

from backend.montage.clip_plan import TimelinePlan, TimelineSegment
from backend.renderer.mock_clip import render_clip


@dataclass
class GeneratedClip:
    segment_index: int
    path: Path
    prompt: str
    duration: float
    seed: int
    provider: str
    visual_hash: str


class MockVideoProvider:
    name = "mock"

    def __init__(self, output_dir: Path) -> None:
        self.output_dir = output_dir

    def generate_clips(self, plan: TimelinePlan, aspect_ratio: str) -> List[GeneratedClip]:
        clips: list[GeneratedClip] = []
        for segment in plan.segments:
            seed = 1000 + segment.index * 17
            clips.append(self.regenerate_clip(segment, aspect_ratio, seed))
        return clips

    def regenerate_clip(self, segment: TimelineSegment, aspect_ratio: str, seed: int) -> GeneratedClip:
        clip_path = self.output_dir / f"segment-{segment.index}-{seed}.mp4"
        render_clip(
            prompt=segment.prompt,
            section=segment.section_label,
            duration=segment.duration,
            aspect_ratio=aspect_ratio,
            seed=seed,
            out_path=clip_path,
        )
        visual_hash = f"{segment.section_label}-{seed % 97}"
        return GeneratedClip(
            segment_index=segment.index,
            path=clip_path,
            prompt=segment.prompt,
            duration=segment.duration,
            seed=seed,
            provider=self.name,
            visual_hash=visual_hash,
        )
