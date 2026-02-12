from __future__ import annotations

from backend.core.jobs import UserSession


def session_from_email(email: str | None) -> UserSession:
    clean = (email or "guest@tunivo.local").strip().lower()
    domain = clean.split("@")[-1]
    if domain in {"creator.tunivo", "pro.tunivo"}:
        plan = "pro"
    elif domain in {"studio.tunivo", "creator.com"}:
        plan = "creator"
    else:
        plan = "free"
    return UserSession(email=clean, plan=plan)
