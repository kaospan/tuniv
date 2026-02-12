from __future__ import annotations

import threading
from dataclasses import dataclass


@dataclass
class CreditsReservation:
    job_id: str
    amount: int
    committed: bool = False


class CreditsLedger:
    """In-memory ledger boundary with idempotent reserve/commit/release."""

    def __init__(self, plan: str, allowance: int | None = None) -> None:
        self.plan = plan
        self.allowance = allowance or self._default_allowance(plan)
        self._reservations: dict[str, CreditsReservation] = {}
        self._lock = threading.Lock()

    def estimate_cost(self, duration: float, mode: str) -> int:
        base = 4 if mode == "fast" else 10
        per_minute = 2 if mode == "fast" else 5
        return int(base + (duration / 60.0) * per_minute)

    def reserve_credits(self, job_id: str, amount: int) -> CreditsReservation:
        with self._lock:
            existing = self._reservations.get(job_id)
            if existing:
                return existing
            if amount > self.allowance:
                raise ValueError("insufficient_credits")
            reservation = CreditsReservation(job_id=job_id, amount=amount)
            self._reservations[job_id] = reservation
            return reservation

    def commit_credits(self, job_id: str) -> CreditsReservation:
        with self._lock:
            reservation = self._reservations.get(job_id)
            if not reservation:
                raise ValueError("missing_reservation")
            if reservation.committed:
                return reservation
            self.allowance -= reservation.amount
            reservation.committed = True
            return reservation

    def release_credits(self, job_id: str) -> None:
        with self._lock:
            reservation = self._reservations.get(job_id)
            if not reservation:
                return
            if reservation.committed:
                return
            del self._reservations[job_id]

    def _default_allowance(self, plan: str) -> int:
        if plan == "pro":
            return 10000
        if plan == "creator":
            return 1000
        return 200
