from __future__ import annotations

import subprocess
from pathlib import Path

from backend.montage.assembler import Timeline


def render_timeline(timeline: Timeline, audio_path: Path, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temp_video = output_path.with_suffix(".video.mp4")

    _render_video_with_transitions(timeline, temp_video)

    _run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(temp_video),
            "-i",
            str(audio_path),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-shortest",
            str(output_path),
        ]
    )


def _render_video_with_transitions(timeline: Timeline, output_path: Path) -> None:
    if len(timeline.items) == 1:
        _run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(timeline.items[0].clip.path),
                "-c:v",
                "libx264",
                "-pix_fmt",
                "yuv420p",
                str(output_path),
            ]
        )
        return

    fade_duration = 0.25
    inputs = []
    filters = []
    for idx, item in enumerate(timeline.items):
        inputs.extend(["-i", str(item.clip.path)])
        filters.append(f"[{idx}:v]setpts=PTS-STARTPTS[v{idx}]")

    cumulative = 0.0
    overlap_total = 0.0
    last_label = "v0"
    for idx in range(1, len(timeline.items)):
        transition = timeline.items[idx].transition
        duration = fade_duration if transition == "crossfade" else 0.05
        cumulative += timeline.items[idx - 1].segment.duration
        overlap_total += duration
        offset = max(0.0, cumulative - duration * idx)
        out_label = f"vxf{idx}"
        filters.append(
            f"[{last_label}][v{idx}]xfade=transition=fade:duration={duration:.2f}:offset={offset:.2f}[{out_label}]"
        )
        last_label = out_label

    if overlap_total > 0:
        pad_label = f"{last_label}pad"
        filters.append(
            f"[{last_label}]tpad=stop_mode=clone:stop_duration={overlap_total:.2f}[{pad_label}]"
        )
        last_label = pad_label

    filter_complex = ";".join(filters)

    _run(
        [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            f"[{last_label}]",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(output_path),
        ]
    )


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffmpeg export failed")
