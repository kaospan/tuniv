from pathlib import Path

import pytest

from backend.services.song_library import list_songs, resolve_song_path


def test_list_songs_filters_supported_extensions(tmp_path: Path) -> None:
    (tmp_path / "track.mp3").write_bytes(b"audio")
    (tmp_path / "voice.wav").write_bytes(b"audio")
    (tmp_path / "notes.txt").write_text("ignore", encoding="utf-8")

    songs = list_songs(tmp_path)
    ids = [song["id"] for song in songs]

    assert ids == ["track.mp3", "voice.wav"]


def test_resolve_song_path_rejects_paths(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        resolve_song_path("../secret.mp3", tmp_path)


def test_resolve_song_path_resolves_valid_file(tmp_path: Path) -> None:
    expected = tmp_path / "demo.mp3"
    expected.write_bytes(b"audio")

    result = resolve_song_path("demo.mp3", tmp_path)

    assert result == expected
