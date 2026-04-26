from __future__ import annotations

import logging
import os


_configured = False


def _configure_root_logger() -> None:
    global _configured
    if _configured:
        return

    level_name = os.getenv("TUNIVO_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    _configured = True


def get_logger(name: str) -> logging.Logger:
    _configure_root_logger()
    return logging.getLogger(name)
