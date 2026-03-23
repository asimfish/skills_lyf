"""Codex exec process management for git-orchestra.

Runs codex exec in isolated clone directories, manages worker threads,
captures output, and emits events on completion.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

CODEX_BIN = os.environ.get("CODEX_BIN", "codex")
DEFAULT_SANDBOX = os.environ.get("GIT_ORCHESTRA_SANDBOX", "full-auto")
DEFAULT_REASONING = os.environ.get("GIT_ORCHESTRA_REASONING", "high")


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _find_codex() -> str | None:
    if Path(CODEX_BIN).is_file():
        return CODEX_BIN
    return shutil.which(CODEX_BIN)


def build_command(
    prompt: str,
    working_dir: str,
    sandbox: str | None = None,
    model: str | None = None,
    reasoning: str | None = None,
) -> list[str]:
    bin_path = _find_codex()
    if not bin_path:
        raise FileNotFoundError(f"Codex CLI not found: {CODEX_BIN}")

    sb = sandbox or DEFAULT_SANDBOX
    cmd = [bin_path, "exec"]
    if sb == "full-auto":
        cmd.append("--full-auto")
    else:
        cmd.extend(["--sandbox", sb])

    cmd.extend(["--cd", working_dir, "--skip-git-repo-check"])

    if model:
        cmd.extend(["--model", model])

    rs = reasoning or DEFAULT_REASONING
    if rs:
        cmd.extend(["-c", f'model_reasoning_effort="{rs}"'])

    cmd.append(prompt)
    return cmd


def run_codex_sync(
    prompt: str,
    working_dir: str,
    sandbox: str | None = None,
    model: str | None = None,
    reasoning: str | None = None,
    timeout: int = 1800,
) -> dict[str, Any]:
    """Run codex exec synchronously. Returns result dict."""
    try:
        cmd = build_command(prompt, working_dir, sandbox, model, reasoning)
    except FileNotFoundError as e:
        return {"status": "failed", "error": str(e), "output": ""}

    try:
        r = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            stdin=subprocess.DEVNULL,
            timeout=timeout,
            check=False,
        )
    except subprocess.TimeoutExpired:
        return {"status": "failed", "error": f"Timeout after {timeout}s", "output": ""}

    if r.returncode != 0:
        return {
            "status": "failed",
            "error": r.stderr[:2000] if r.stderr else f"Exit code {r.returncode}",
            "output": r.stdout[:5000] if r.stdout else "",
        }

    return {
        "status": "completed",
        "error": None,
        "output": r.stdout if r.stdout else "(no output)",
    }


def run_codex_async(
    prompt: str,
    working_dir: str,
    on_complete: Callable[[dict[str, Any]], None] | None = None,
    sandbox: str | None = None,
    model: str | None = None,
    reasoning: str | None = None,
    timeout: int = 1800,
) -> threading.Thread:
    """Run codex exec in a background thread. Calls on_complete when done."""
    def _worker():
        result = run_codex_sync(prompt, working_dir, sandbox, model, reasoning, timeout)
        result["completed_at"] = _utc_now()
        if on_complete:
            on_complete(result)

    t = threading.Thread(target=_worker, daemon=True)
    t.start()
    return t
