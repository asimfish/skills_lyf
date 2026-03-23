"""File-system based event queue for git-orchestra.

Events flow: pending/ → processing/ → done/
Supports branch_ready, merge_result, plan_ready event types.
"""

from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


class EventQueue:
    def __init__(self, base_dir: str | Path):
        self.base = Path(base_dir)
        self.pending = self.base / "pending"
        self.processing = self.base / "processing"
        self.done = self.base / "done"
        for d in (self.pending, self.processing, self.done):
            d.mkdir(parents=True, exist_ok=True)

    def push(self, event_type: str, data: dict[str, Any]) -> str:
        """Push an event to the pending queue. Returns event_id."""
        event_id = uuid4().hex[:12]
        ts = int(time.time() * 1000)
        event = {
            "event_id": event_id,
            "type": event_type,
            "timestamp": _utc_now(),
            **data,
        }
        filename = f"{ts}-{event_id}.json"
        path = self.pending / filename
        tmp = path.with_suffix(".tmp")
        tmp.write_text(json.dumps(event, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(path)
        return event_id

    def pop(self) -> dict[str, Any] | None:
        """Pop the oldest pending event, move to processing."""
        files = sorted(self.pending.glob("*.json"))
        if not files:
            return None
        f = files[0]
        dest = self.processing / f.name
        f.rename(dest)
        return json.loads(dest.read_text(encoding="utf-8"))

    def complete(self, event_id: str) -> None:
        """Move event from processing to done."""
        for f in self.processing.glob(f"*-{event_id}.json"):
            dest = self.done / f.name
            f.rename(dest)
            return

    def fail(self, event_id: str) -> None:
        """Move event back to pending for retry."""
        for f in self.processing.glob(f"*-{event_id}.json"):
            dest = self.pending / f.name
            f.rename(dest)
            return

    def peek_pending(self, event_type: str | None = None) -> list[dict[str, Any]]:
        """List pending events, optionally filtered by type."""
        events = []
        for f in sorted(self.pending.glob("*.json")):
            try:
                ev = json.loads(f.read_text(encoding="utf-8"))
                if event_type is None or ev.get("type") == event_type:
                    events.append(ev)
            except (json.JSONDecodeError, OSError):
                pass
        return events

    def count_pending(self) -> int:
        return len(list(self.pending.glob("*.json")))

    def count_processing(self) -> int:
        return len(list(self.processing.glob("*.json")))
