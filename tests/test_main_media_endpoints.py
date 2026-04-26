from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_song_library_endpoint_returns_payload(monkeypatch) -> None:
    monkeypatch.setattr("backend.main.list_songs", lambda: [{"id": "demo.mp3", "filename": "demo.mp3", "bytes": 3, "modified_at": "2026-01-01T00:00:00+00:00"}])

    response = client.get("/api/library/songs")

    assert response.status_code == 200
    assert response.json()["songs"][0]["id"] == "demo.mp3"


def test_create_job_requires_audio_or_song_id() -> None:
    response = client.post("/api/jobs", data={"mode": "fast"})
    assert response.status_code == 422
    assert response.json()["detail"] == "provide audio file or song_id"


def test_create_job_accepts_song_id(monkeypatch, tmp_path: Path) -> None:
    sample_song = tmp_path / "library.mp3"
    sample_song.write_bytes(b"audio-data")

    monkeypatch.setattr("backend.main.resolve_song_path", lambda song_id: sample_song)
    monkeypatch.setattr("backend.main.executor.submit", lambda *args, **kwargs: None)

    response = client.post(
        "/api/jobs",
        data={"song_id": "library.mp3", "mode": "fast", "aspect_ratio": "16:9"},
        headers={"X-User-Email": "qa@tunivo.local"},
    )

    assert response.status_code == 200
    assert "id" in response.json()


def test_cleanup_endpoint_returns_video_response(monkeypatch, tmp_path: Path) -> None:
    def _fake_cleanup(input_path: Path, output_path: Path, preset: str) -> Path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(b"video")
        return output_path

    monkeypatch.setattr("backend.main.cleanup_video_file", _fake_cleanup)

    response = client.post(
        "/api/videos/cleanup",
        data={"preset": "clean_real"},
        files={"video": ("clip.mp4", b"video-bytes", "video/mp4")},
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("video/mp4")
