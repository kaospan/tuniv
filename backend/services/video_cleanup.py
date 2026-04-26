from __future__ import annotations

import shutil
import subprocess
from pathlib import Path

from backend.core.config import settings

VIDEO_CLEANUP_PRESETS = {
    "cinematic_pro": {
        "label": "Cinematic Pro",
        "description": "Cinema-grade cleanup with gentle grain and stable exposure.",
        "filter": (
            "hqdn3d=1.0:1.0:4:4,"
            "deflicker=size=7:mode=pm,"
            "deband,"
            "eq=contrast=1.08:brightness=-0.01:saturation=1.02,"
            "unsharp=5:5:0.25:3:3:0.15,"
            "vignette=0.25,"
            "noise=alls=2.2:allf=t+u"
        ),
    },
    "homemade_shock": {
        "label": "Homemade Shock",
        "description": "Preserve raw mood while reducing flicker and artifacts.",
        "filter": (
            "hqdn3d=1.2:1.2:6:6,"
            "deflicker=size=5:mode=pm,"
            "deband,"
            "eq=contrast=1.06:brightness=-0.02:saturation=0.96,"
            "vignette=0.35,"
            "noise=alls=3:allf=t+u"
        ),
    },
    "clean_real": {
        "label": "Clean Realism",
        "description": "Neutral cleanup with minimal stylistic shift.",
        "filter": "hqdn3d=1.0:1.0:4:4,deflicker=size=5:mode=pm,deband",
    },
}


def available_presets() -> list[dict]:
    return [
        {
            "value": key,
            "label": payload.get("label", key),
            "description": payload.get("description", ""),
        }
        for key, payload in VIDEO_CLEANUP_PRESETS.items()
    ]


def resolve_cleanup_preset(preset_key: str) -> tuple[str, dict]:
    default_key = settings.default_cleanup_preset
    resolved_key = (preset_key or "").strip() or default_key
    if resolved_key not in VIDEO_CLEANUP_PRESETS:
        raise ValueError(f"unsupported cleanup preset: {resolved_key}")
    return resolved_key, VIDEO_CLEANUP_PRESETS[resolved_key]


def cleanup_video_file(input_path: Path, output_path: Path, preset_key: str) -> Path:
    if not input_path.exists():
        raise FileNotFoundError(f"input video not found: {input_path}")

    ffmpeg_bin = shutil.which("ffmpeg")
    if not ffmpeg_bin:
        raise RuntimeError("ffmpeg is not available on PATH")

    _, preset = resolve_cleanup_preset(preset_key)
    filter_chain = preset.get("filter", "").strip()
    if not filter_chain:
        raise RuntimeError("cleanup preset has no filter configured")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i",
        str(input_path),
        "-vf",
        filter_chain,
        "-c:v",
        "libx264",
        "-preset",
        "slow",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        str(output_path),
    ]

    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        details = (result.stderr or result.stdout or "Unknown ffmpeg error").strip()
        raise RuntimeError(f"cleanup failed: {details}")

    return output_path
