"""Git operations for git-orchestra.

Encapsulates bare clone, worker clone, branch management,
merge operations, and conflict detection.
"""

from __future__ import annotations

import os
import subprocess
from pathlib import Path
from typing import Any


def _run(cmd: list[str], cwd: str | Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        capture_output=True,
        text=True,
        check=check,
        timeout=300,
    )


def bare_clone(source: str | Path, dest: str | Path) -> None:
    """Create a bare clone of source repo at dest."""
    _run(["git", "clone", "--bare", str(source), str(dest)])


def full_clone(bare_repo: str | Path, dest: str | Path) -> None:
    """Clone from bare repo to a working directory."""
    _run(["git", "clone", str(bare_repo), str(dest)])


def get_current_branch(repo_dir: str | Path) -> str:
    r = _run(["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=repo_dir)
    return r.stdout.strip()


def get_head_sha(repo_dir: str | Path) -> str:
    r = _run(["git", "rev-parse", "HEAD"], cwd=repo_dir)
    return r.stdout.strip()


def get_default_branch(repo_dir: str | Path) -> str:
    """Detect the default branch name (main or master)."""
    r = _run(["git", "symbolic-ref", "refs/remotes/origin/HEAD"], cwd=repo_dir, check=False)
    if r.returncode == 0:
        # refs/remotes/origin/main -> main
        return r.stdout.strip().split("/")[-1]
    # fallback: check if main exists
    r2 = _run(["git", "branch", "-r", "--list", "origin/main"], cwd=repo_dir, check=False)
    if r2.stdout.strip():
        return "main"
    return "master"


def fetch_origin(repo_dir: str | Path) -> None:
    _run(["git", "fetch", "origin"], cwd=repo_dir)


def create_branch(repo_dir: str | Path, branch_name: str, start_point: str = "origin/main") -> None:
    """Create and checkout a new branch from start_point."""
    fetch_origin(repo_dir)
    _run(["git", "checkout", "-b", branch_name, start_point], cwd=repo_dir)


def checkout_branch(repo_dir: str | Path, branch_name: str) -> None:
    _run(["git", "checkout", branch_name], cwd=repo_dir)


def push_branch(repo_dir: str | Path, branch_name: str) -> None:
    _run(["git", "push", "origin", branch_name], cwd=repo_dir)


def pull_main(repo_dir: str | Path, main_branch: str = "main") -> None:
    _run(["git", "checkout", main_branch], cwd=repo_dir)
    _run(["git", "pull", "origin", main_branch], cwd=repo_dir)


# ── merge operations ──


def merge_no_ff(
    repo_dir: str | Path,
    branch_name: str,
    main_branch: str = "main",
) -> dict[str, Any]:
    """Merge branch into main with --no-ff. Returns merge result."""
    fetch_origin(repo_dir)
    checkout_branch(repo_dir, main_branch)
    _run(["git", "pull", "origin", main_branch], cwd=repo_dir, check=False)

    r = _run(
        ["git", "merge", "--no-ff", f"origin/{branch_name}", "-m", f"merge: {branch_name} into {main_branch}"],
        cwd=repo_dir,
        check=False,
    )

    if r.returncode == 0:
        sha = get_head_sha(repo_dir)
        push_branch(repo_dir, main_branch)
        return {"status": "merged", "merge_sha": sha, "conflicts": []}

    # check for conflicts
    conflicts = list_conflicts(repo_dir)
    if conflicts:
        return {"status": "conflict", "merge_sha": None, "conflicts": conflicts}

    return {"status": "failed", "merge_sha": None, "error": r.stderr.strip(), "conflicts": []}


def list_conflicts(repo_dir: str | Path) -> list[str]:
    """List files with merge conflicts."""
    r = _run(["git", "diff", "--name-only", "--diff-filter=U"], cwd=repo_dir, check=False)
    if r.returncode != 0:
        return []
    return [f.strip() for f in r.stdout.strip().splitlines() if f.strip()]


def abort_merge(repo_dir: str | Path) -> None:
    _run(["git", "merge", "--abort"], cwd=repo_dir, check=False)


def stage_file(repo_dir: str | Path, file_path: str) -> None:
    _run(["git", "add", file_path], cwd=repo_dir)


def commit(repo_dir: str | Path, message: str) -> str:
    _run(["git", "commit", "-m", message], cwd=repo_dir)
    return get_head_sha(repo_dir)


def list_branches(repo_dir: str | Path, remote: bool = True) -> list[str]:
    """List branches."""
    cmd = ["git", "branch", "-r"] if remote else ["git", "branch"]
    r = _run(cmd, cwd=repo_dir, check=False)
    branches = []
    for line in r.stdout.strip().splitlines():
        b = line.strip().lstrip("* ")
        if "->" not in b:
            branches.append(b)
    return branches


def get_branch_diff_stat(repo_dir: str | Path, branch: str, main_branch: str = "main") -> dict[str, Any]:
    """Get diff stat between branch and main."""
    fetch_origin(repo_dir)
    r = _run(
        ["git", "diff", "--stat", f"origin/{main_branch}...origin/{branch}"],
        cwd=repo_dir,
        check=False,
    )
    files_changed = []
    for line in r.stdout.strip().splitlines():
        parts = line.split("|")
        if len(parts) == 2:
            files_changed.append(parts[0].strip())
    return {"branch": branch, "files_changed": files_changed, "stat": r.stdout.strip()}


def get_last_commit_info(repo_dir: str | Path) -> dict[str, str]:
    r = _run(
        ["git", "log", "-1", "--format=%H|%s|%ai"],
        cwd=repo_dir,
        check=False,
    )
    if r.returncode != 0:
        return {"sha": "", "message": "", "date": ""}
    parts = r.stdout.strip().split("|", 2)
    return {
        "sha": parts[0] if len(parts) > 0 else "",
        "message": parts[1] if len(parts) > 1 else "",
        "date": parts[2] if len(parts) > 2 else "",
    }


def read_conflict_file(repo_dir: str | Path, file_path: str) -> str:
    """Read a file with conflict markers."""
    full_path = Path(repo_dir) / file_path
    return full_path.read_text(encoding="utf-8")
