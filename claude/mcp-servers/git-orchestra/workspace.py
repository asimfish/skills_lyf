"""Workspace lifecycle management for git-orchestra.

Handles creation of bare clone + planner/merger/worker directories,
state tracking, and cleanup.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import sys
_self_dir = str(Path(__file__).parent)
if _self_dir not in sys.path:
    sys.path.insert(0, _self_dir)

import git_ops

WORKSPACES_ROOT = Path.home() / ".claude" / "workspaces"
STATE_ROOT = Path(__file__).parent / "state"


def _workspace_id(repo_path: str) -> str:
    """Generate a stable workspace ID from repo path."""
    h = hashlib.sha256(repo_path.encode()).hexdigest()[:12]
    name = Path(repo_path).name
    return f"{name}-{h}"


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def init_workspace(repo_path: str, worker_count: int = 3) -> dict[str, Any]:
    """Initialize a git-isolated workspace."""
    repo = Path(repo_path).resolve()
    if not (repo / ".git").exists() and not repo.name.endswith(".git"):
        raise ValueError(f"Not a git repository: {repo}")

    ws_id = _workspace_id(str(repo))
    ws_dir = WORKSPACES_ROOT / ws_id
    origin_dir = ws_dir / "origin"

    # 如果已存在，先清理
    if ws_dir.exists():
        shutil.rmtree(ws_dir)

    ws_dir.mkdir(parents=True)

    # 1. bare clone
    git_ops.bare_clone(str(repo), str(origin_dir))

    # 2. planner clone
    planner_dir = ws_dir / "planner"
    git_ops.full_clone(str(origin_dir), str(planner_dir))

    # 3. merger clone
    merger_dir = ws_dir / "merger"
    git_ops.full_clone(str(origin_dir), str(merger_dir))

    # 4. worker clones
    worker_dirs = []
    for i in range(worker_count):
        w_dir = ws_dir / f"worker-{i+1:03d}"
        git_ops.full_clone(str(origin_dir), str(w_dir))
        worker_dirs.append(str(w_dir))

    # detect default branch
    default_branch = git_ops.get_default_branch(str(planner_dir))

    # save state
    state = {
        "workspace_id": ws_id,
        "repo_path": str(repo),
        "workspace_dir": str(ws_dir),
        "origin_dir": str(origin_dir),
        "planner_dir": str(planner_dir),
        "merger_dir": str(merger_dir),
        "worker_dirs": worker_dirs,
        "worker_count": worker_count,
        "default_branch": default_branch,
        "created_at": _utc_now(),
        "tasks": {},
        "merge_queue": [],
    }
    state_path = STATE_ROOT / ws_id / "workspace.json"
    _write_json(state_path, state)

    return state


def get_workspace(ws_id: str) -> dict[str, Any] | None:
    state_path = STATE_ROOT / ws_id / "workspace.json"
    if not state_path.exists():
        return None
    return _read_json(state_path)


def save_workspace(state: dict[str, Any]) -> None:
    ws_id = state["workspace_id"]
    state_path = STATE_ROOT / ws_id / "workspace.json"
    _write_json(state_path, state)


def get_workspace_status(ws_id: str) -> dict[str, Any]:
    """Get comprehensive workspace status."""
    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    merger_dir = state["merger_dir"]
    default_branch = state.get("default_branch", "main")

    # main branch info
    try:
        git_ops.fetch_origin(merger_dir)
        main_sha = git_ops.get_head_sha(merger_dir)
    except Exception:
        main_sha = "unknown"

    # worker status
    workers = []
    for w_dir in state["worker_dirs"]:
        w_path = Path(w_dir)
        if not w_path.exists():
            workers.append({"dir": w_dir, "status": "missing"})
            continue
        try:
            branch = git_ops.get_current_branch(w_dir)
            commit_info = git_ops.get_last_commit_info(w_dir)
            workers.append({
                "dir": w_path.name,
                "branch": branch,
                "last_commit": commit_info,
                "status": "idle" if branch == default_branch else "working",
            })
        except Exception as e:
            workers.append({"dir": w_path.name, "status": "error", "error": str(e)})

    # branches
    try:
        branches = git_ops.list_branches(merger_dir, remote=True)
        feat_branches = [b.replace("origin/", "") for b in branches if "feat/" in b]
    except Exception:
        feat_branches = []

    return {
        "workspace_id": ws_id,
        "repo_path": state["repo_path"],
        "default_branch": default_branch,
        "main_sha": main_sha,
        "workers": workers,
        "feature_branches": feat_branches,
        "tasks": state.get("tasks", {}),
        "merge_queue": state.get("merge_queue", []),
    }


def find_free_worker(ws_id: str) -> str | None:
    """Find a worker directory that's on the default branch (idle)."""
    state = get_workspace(ws_id)
    if not state:
        return None
    default_branch = state.get("default_branch", "main")
    for w_dir in state["worker_dirs"]:
        try:
            branch = git_ops.get_current_branch(w_dir)
            if branch == default_branch:
                return w_dir
        except Exception:
            continue
    return None


def cleanup_workspace(ws_id: str, keep_origin: bool = False) -> dict[str, Any]:
    """Remove workspace directories."""
    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    ws_dir = Path(state["workspace_dir"])
    if keep_origin:
        # 只删除 worker/planner/merger 目录
        for d in [state["planner_dir"], state["merger_dir"]] + state["worker_dirs"]:
            p = Path(d)
            if p.exists():
                shutil.rmtree(p)
    else:
        if ws_dir.exists():
            shutil.rmtree(ws_dir)

    # 清理 state
    state_dir = STATE_ROOT / ws_id
    if state_dir.exists():
        shutil.rmtree(state_dir)

    return {"status": "cleaned", "workspace_id": ws_id, "kept_origin": keep_origin}
