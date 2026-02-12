from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path
from typing import Dict, List


def _run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffprobe failed")
    return result.stdout.strip()


def probe_duration(audio_path: Path) -> float:
    out = _run([
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        str(audio_path),
    ])
    return float(out)


def analyze_audio(audio_path: Path, mode: str) -> Dict:
    duration = probe_duration(audio_path)
    seed = int(hashlib.md5(str(audio_path).encode("utf-8")).hexdigest(), 16) % 10000
    bpm = 110 + (seed % 40)
    sections = _mock_sections(duration)
    energy = _mock_energy_curve(duration)
    return {
        "duration": duration,
        "bpm": bpm,
        "sections": sections,
        "energy_curve": energy,
        "mode": mode,
    }


def _mock_sections(duration: float) -> List[Dict]:
    if duration <= 0:
        return []
    chunk = max(8.0, min(20.0, duration / 6))
    sections = []
    t = 0.0
    names = ["intro", "verse", "chorus", "verse", "bridge", "chorus", "outro"]
    idx = 0
    while t < duration:
        end = min(duration, t + chunk)
        sections.append({"start": t, "end": end, "label": names[idx % len(names)]})
        t = end
        idx += 1
    return sections


def _mock_energy_curve(duration: float) -> List[Dict]:
    if duration <= 0:
        return []
    steps = 12
    curve = []
    for i in range(steps):
        t = duration * i / steps
        value = 0.35 + (i % 4) * 0.15
        curve.append({"time": t, "energy": round(min(1.0, value), 2)})
    return curve
