from pathlib import Path

import pytest

from backend.services.video_cleanup import resolve_cleanup_preset


def test_cleanup_preset_resolves_known_key() -> None:
    key, payload = resolve_cleanup_preset("clean_real")
    assert key == "clean_real"
    assert "filter" in payload


def test_cleanup_preset_rejects_unknown_key() -> None:
    with pytest.raises(ValueError):
        resolve_cleanup_preset("unknown-preset")


def test_cleanup_preset_uses_default_when_empty() -> None:
    key, _ = resolve_cleanup_preset("")
    assert isinstance(key, str)
    assert key
