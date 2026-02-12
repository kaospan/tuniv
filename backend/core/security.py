from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time


def create_signed_token(job_id: str, email: str, secret: str, ttl_seconds: int = 1200) -> str:
    payload = {
        "job_id": job_id,
        "email": email,
        "exp": int(time.time() + ttl_seconds),
    }
    raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw, hashlib.sha256).hexdigest()
    return f"{base64.urlsafe_b64encode(raw).decode('utf-8')}.{sig}"


def verify_signed_token(token: str, secret: str) -> dict | None:
    try:
        payload_b64, sig = token.split(".", 1)
        raw = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
    except ValueError:
        return None
    expected = hmac.new(secret.encode("utf-8"), raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, sig):
        return None
    payload = json.loads(raw.decode("utf-8"))
    if int(payload.get("exp", 0)) < int(time.time()):
        return None
    return payload
