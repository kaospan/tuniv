from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any
from urllib import error, parse, request

from backend.core.config import settings


@dataclass(frozen=True)
class HedraCreditsSnapshot:
    balance: int
    used: int
    raw: dict[str, Any]


@dataclass(frozen=True)
class HedraUsageDelta:
    amount: int
    used_before: int
    used_after: int
    balance_before: int
    balance_after: int
    source: str = "hedra_actual"


class HedraBillingClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None, timeout_seconds: float = 15.0) -> None:
        self.api_key = (api_key or settings.hedra_api_key).strip()
        self.base_url = (base_url or settings.hedra_api_base_url).rstrip("/")
        self.timeout_seconds = timeout_seconds

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_credits(self) -> HedraCreditsSnapshot:
        if not self.is_configured():
            raise ValueError("Hedra billing client is not configured")

        payload = self._request_json("/billing/credits")
        return HedraCreditsSnapshot(
            balance=int(payload.get("balance", 0)),
            used=int(payload.get("used", 0)),
            raw=payload,
        )

    def _request_json(self, path: str) -> dict[str, Any]:
        url = parse.urljoin(f"{self.base_url}/", path.lstrip("/"))
        req = request.Request(
            url,
            headers={
                "X-API-Key": self.api_key,
                "Accept": "application/json",
            },
            method="GET",
        )
        try:
            with request.urlopen(req, timeout=self.timeout_seconds) as response:
                body = response.read().decode("utf-8")
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace").strip()
            raise RuntimeError(f"Hedra billing request failed with {exc.code}: {details}") from exc
        except error.URLError as exc:
            raise RuntimeError(f"Hedra billing request failed: {exc.reason}") from exc

        try:
            return json.loads(body)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Hedra billing response was not valid JSON") from exc


class HedraCreditsTracker:
    def __init__(self, client: HedraBillingClient | None = None, enabled: bool | None = None) -> None:
        self.client = client or HedraBillingClient()
        self.enabled = settings.hedra_credits_enabled if enabled is None else enabled

    def capture_start(self) -> HedraCreditsSnapshot | None:
        if not self.enabled or not self.client.is_configured():
            return None
        return self.client.get_credits()

    def capture_delta(self, start: HedraCreditsSnapshot | None) -> HedraUsageDelta | None:
        if start is None:
            return None

        end = self.client.get_credits()
        amount = end.used - start.used
        if amount < 0:
            amount = 0

        return HedraUsageDelta(
            amount=amount,
            used_before=start.used,
            used_after=end.used,
            balance_before=start.balance,
            balance_after=end.balance,
        )
