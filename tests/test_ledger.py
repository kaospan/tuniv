from backend.ledger.credits import CreditsLedger


def test_ledger_reserve_is_idempotent() -> None:
    ledger = CreditsLedger(plan="creator", allowance=100)
    first = ledger.reserve_credits("job-1", 10)
    second = ledger.reserve_credits("job-1", 20)

    assert first.amount == 10
    assert second.amount == 10


def test_ledger_commit_is_idempotent() -> None:
    ledger = CreditsLedger(plan="creator", allowance=100)
    ledger.reserve_credits("job-1", 10)
    first = ledger.commit_credits("job-1")
    second = ledger.commit_credits("job-1")

    assert first.committed is True
    assert second.committed is True
    assert ledger.allowance == 90
