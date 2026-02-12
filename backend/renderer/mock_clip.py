from __future__ import annotations

import subprocess
from pathlib import Path


def render_clip(prompt: str, section: str, duration: float, aspect_ratio: str, seed: int, out_path: Path) -> Path:
    color = _color_from_seed(seed)
    size = _size_from_aspect(aspect_ratio)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    safe_text = _safe_text(f"{section.upper()} | {prompt[:40]}")
    cmd = [
        "ffmpeg",
        "-y",
        "-f",
        "lavfi",
        "-i",
        f"color=c={color}:s={size}:d={duration:.3f}",
        "-vf",
        f"drawtext=fontcolor=white:fontsize=30:box=1:boxcolor=0x00000077:boxborderw=12:text='{safe_text}':x=(w-text_w)/2:y=(h-text_h)/2",
        "-r",
        "30",
        "-pix_fmt",
        "yuv420p",
        str(out_path),
    ]
    _run(cmd)
    return out_path


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffmpeg clip render failed")


def _size_from_aspect(aspect_ratio: str) -> str:
    if aspect_ratio == "9:16":
        return "720x1280"
    if aspect_ratio == "1:1":
        return "1080x1080"
    return "1280x720"


def _color_from_seed(seed: int) -> str:
    r = 40 + ((seed * 31) % 180)
    g = 40 + ((seed * 59) % 180)
    b = 40 + ((seed * 83) % 180)
    return f"#{r:02x}{g:02x}{b:02x}"


def _safe_text(value: str) -> str:
    return value.replace("'", "").replace(":", "-")
