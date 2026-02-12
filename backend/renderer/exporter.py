from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

from montage.assembler import Timeline


def render_timeline(timeline: Timeline, audio_path: Path, output_path: Path) -> None:
    concat_file = _write_concat_list(timeline)
    temp_video = output_path.with_suffix(".video.mp4")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    _run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_file),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(temp_video),
        ]
    )

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


def _write_concat_list(timeline: Timeline) -> Path:
    lines = [f"file '{item.clip.path.as_posix()}'" for item in timeline.items]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".txt")
    Path(tmp.name).write_text("\n".join(lines), encoding="utf-8")
    return Path(tmp.name)


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "ffmpeg export failed")
