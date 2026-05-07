"""Append-only per-user audit logging.

Each visitor gets an anonymous UUID via the `smartod_uid` cookie set by
middleware (see app/main.py). Significant route handlers call
`log_event(uid, sid, event, **payload)` which appends one JSON line per
event to `<repo_root>/audit_logs/{uid}.jsonl`. Append-mode + O_APPEND
makes the write atomic across worker processes — no locking needed.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# <root>/audit_logs/  (audit_log.py → core → app → backend → root)
_LOG_DIR = Path(__file__).resolve().parents[3] / "audit_logs"


def log_event(
    uid: str | None,
    session_id: str | None,
    event: str,
    **payload: Any,
) -> None:
    """Append one JSONL record. No-ops if uid is empty (shouldn't happen — middleware always sets it)."""
    if not uid:
        return
    try:
        _LOG_DIR.mkdir(parents=True, exist_ok=True)
        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "uid": uid,
            "sid": session_id,
            "event": event,
            **payload,
        }
        path = _LOG_DIR / f"{uid}.jsonl"
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False, default=str) + "\n")
    except Exception as exc:
        # Logging must never break the request — best-effort only
        logger.warning("audit_log failed: %s", exc)
