from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class TimelineSegment:
    index: int
    start: float
    end: float
    duration: float
    section_label: str
    energy: float
    prompt: str
    keywords: list[str]


@dataclass
class TimelinePlan:
    segments: List[TimelineSegment]
    style_anchor: str
    mode: str


def plan_timeline(audio_analysis: Dict, lyrics_summary: Dict, user_prompt: str) -> TimelinePlan:
    duration = float(audio_analysis["duration"])
    bpm = int(audio_analysis["bpm"])
    base_len = 3.2 if bpm >= 120 else 4.0
    if audio_analysis.get("mode") == "fast":
        base_len += 0.8

    style_anchor = user_prompt.strip() or _auto_style_anchor(audio_analysis, lyrics_summary)
    keywords = lyrics_summary.get("keywords", [])
    sections = audio_analysis.get("sections", [])
    energy_curve = audio_analysis.get("energy_curve", [])

    segments: List[TimelineSegment] = []
    t = 0.0
    idx = 0
    while t < duration:
        end = min(duration, t + base_len)
        section = _section_for_time(sections, t)
        energy = _energy_for_time(energy_curve, t)
        prompt = _segment_prompt(style_anchor, section, energy, keywords, idx)
        segments.append(
            TimelineSegment(
                index=idx,
                start=t,
                end=end,
                duration=end - t,
                section_label=section,
                energy=energy,
                prompt=prompt,
                keywords=keywords,
            )
        )
        t = end
        idx += 1

    return TimelinePlan(segments=segments, style_anchor=style_anchor, mode=audio_analysis.get("mode", "fast"))


def _auto_style_anchor(audio_analysis: Dict, lyrics_summary: Dict) -> str:
    sentiment = lyrics_summary.get("sentiment", "neutral")
    if sentiment == "uplifting":
        return "cinematic sunrise, expansive camera, polished film grain"
    if audio_analysis.get("bpm", 120) > 135:
        return "kinetic abstract city lights, dynamic shutter, glossy texture"
    return "atmospheric cinematic montage, rich contrast, coherent palette"


def _segment_prompt(style_anchor: str, section: str, energy: float, keywords: list[str], index: int) -> str:
    intensity = "low energy" if energy < 0.45 else "high energy"
    motif = keywords[index % len(keywords)] if keywords else section
    return f"{style_anchor}, {section}, {intensity}, motif {motif}, premium composition"


def _section_for_time(sections: list[Dict], t: float) -> str:
    for section in sections:
        if section["start"] <= t < section["end"]:
            return section["label"]
    return "verse"


def _energy_for_time(curve: list[Dict], t: float) -> float:
    if not curve:
        return 0.5
    latest = curve[0]["energy"]
    for point in curve:
        if t < point["time"]:
            break
        latest = point["energy"]
    return float(latest)
