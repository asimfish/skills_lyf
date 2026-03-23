#!/usr/bin/env python3
"""Git Orchestra MCP server.

Orchestrates multiple Codex agents working on isolated git branches
for true parallel development with automated merge and conflict resolution.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import traceback
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# raw binary stdio
sys.stdout = os.fdopen(sys.stdout.fileno(), "wb", buffering=0)
sys.stdin = os.fdopen(sys.stdin.fileno(), "rb", buffering=0)

# add self directory to path for imports
_self_dir = str(Path(__file__).parent)
if _self_dir not in sys.path:
    sys.path.insert(0, _self_dir)

import git_ops
from workspace import (
    init_workspace, get_workspace, save_workspace,
    get_workspace_status, find_free_worker, cleanup_workspace,
)
from dispatcher import run_codex_sync, run_codex_async
from event_queue import EventQueue
from conflict_resolver import resolve_conflicts

SERVER_NAME = "git-orchestra"
DEBUG_LOG = Path(os.environ.get("GIT_ORCHESTRA_DEBUG_LOG", f"/tmp/{SERVER_NAME}-debug.log"))
_use_ndjson = False

# ── logging ──────────────────────────────────────────────────────────

def debug_log(msg: str) -> None:
    try:
        DEBUG_LOG.parent.mkdir(parents=True, exist_ok=True)
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        with DEBUG_LOG.open("a", encoding="utf-8") as f:
            f.write(f"[{ts}] {msg}\n")
    except OSError:
        pass

# ── MCP stdio protocol ──────────────────────────────────────────────

def send_response(response: dict[str, Any]) -> None:
    global _use_ndjson
    payload = json.dumps(response, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    debug_log(f"SEND {payload.decode('utf-8', errors='replace')[:500]}")
    if _use_ndjson:
        sys.stdout.write(payload + b"\n")
    else:
        header = f"Content-Length: {len(payload)}\r\n\r\n".encode("utf-8")
        sys.stdout.write(header + payload)
    sys.stdout.flush()

def read_message() -> dict[str, Any] | None:
    global _use_ndjson
    line = sys.stdin.readline()
    if not line:
        return None
    line_text = line.decode("utf-8").rstrip("\r\n")
    if line_text.lower().startswith("content-length:"):
        try:
            content_length = int(line_text.split(":", 1)[1].strip())
        except ValueError:
            return None
        while True:
            hl = sys.stdin.readline()
            if not hl:
                return None
            if hl in {b"\r\n", b"\n"}:
                break
        body = sys.stdin.read(content_length)
        try:
            return json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            return None
    if line_text.startswith("{") or line_text.startswith("["):
        _use_ndjson = True
        try:
            return json.loads(line_text)
        except json.JSONDecodeError:
            return None
    return None


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def tool_success(req_id: Any, payload: Any) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0", "id": req_id,
        "result": {"content": [{"type": "text", "text": json.dumps(payload, ensure_ascii=False, indent=2)}]},
    }


def tool_error(req_id: Any, msg: str) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0", "id": req_id,
        "result": {"content": [{"type": "text", "text": json.dumps({"error": msg}, ensure_ascii=False)}], "isError": True},
    }


# ── tool implementations ─────────────────────────────────────────────

def handle_init_workspace(args: dict) -> dict[str, Any]:
    repo_path = args.get("repo_path", "")
    if not repo_path:
        return {"error": "repo_path is required"}
    worker_count = args.get("worker_count", 3)
    try:
        state = init_workspace(repo_path, worker_count)
        return {
            "workspace_id": state["workspace_id"],
            "workspace_dir": state["workspace_dir"],
            "default_branch": state["default_branch"],
            "planner_dir": state["planner_dir"],
            "merger_dir": state["merger_dir"],
            "worker_dirs": state["worker_dirs"],
            "worker_count": state["worker_count"],
        }
    except Exception as e:
        return {"error": str(e)}


def handle_plan_tasks(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    requirement = args.get("requirement", "")
    if not ws_id or not requirement:
        return {"error": "workspace_id and requirement are required"}

    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    planner_dir = state["planner_dir"]
    default_branch = state.get("default_branch", "main")
    context_files = args.get("context_files", [])

    files_hint = ""
    if context_files:
        files_hint = "\n\nKey files to review:\n" + "\n".join(f"- {f}" for f in context_files)

    prompt = f"""You are a Planner Agent. Analyze the requirement and produce a structured plan.

Requirement: {requirement}
{files_hint}

Your tasks:
1. Analyze the project structure in this directory
2. Define shared interfaces/types that multiple workers will need
3. Create and commit those shared definitions to the current branch
4. Output a JSON task list for parallel workers

Output format (MUST be valid JSON at the end of your response, on its own line starting with ```json):
```json
{{
  "task_group": "<short-name>",
  "interface_files": ["<files you created/modified>"],
  "tasks": [
    {{
      "task_id": "<short-id>",
      "prompt": "<detailed coding instructions for this worker>",
      "files": ["<files this task will create/modify>"],
      "depends_on": []
    }}
  ]
}}
```

Keep task_id short and descriptive (e.g., "login-api", "user-store").
Each task should be independently executable.
Include enough detail in each prompt so the worker can code without ambiguity."""

    debug_log(f"PLAN_TASKS ws={ws_id}")
    result = run_codex_sync(prompt, planner_dir, reasoning="high", timeout=600)

    if result["status"] != "completed":
        return {"error": result.get("error", "Planner failed"), "output": result.get("output", "")}

    # push planner changes to origin
    try:
        git_ops.push_branch(planner_dir, default_branch)
    except Exception:
        pass

    # parse task list from output
    output = result.get("output", "")
    plan = _extract_json_from_output(output)
    if not plan:
        return {"status": "completed", "raw_output": output[:3000], "parse_error": "Could not extract JSON task list"}

    # save tasks to workspace state
    task_group = plan.get("task_group", "default")
    for t in plan.get("tasks", []):
        tid = t.get("task_id", "")
        t["branch"] = f"feat/{task_group}/{tid}"
        t["status"] = "pending"
        state["tasks"][tid] = t
    save_workspace(state)

    return {"status": "completed", "task_group": task_group, "tasks": plan.get("tasks", []), "interface_files": plan.get("interface_files", [])}


def _extract_json_from_output(output: str) -> dict | None:
    """Extract JSON block from codex output."""
    import re
    # try ```json ... ``` block
    m = re.search(r'```json\s*\n(.*?)\n```', output, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    # try last line that looks like JSON
    for line in reversed(output.splitlines()):
        line = line.strip()
        if line.startswith("{"):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                pass
    return None

def handle_dispatch_workers(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    tasks = args.get("tasks", [])
    if not ws_id or not tasks:
        return {"error": "workspace_id and tasks are required"}

    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    default_branch = state.get("default_branch", "main")
    assignments = []
    threads = []

    for task in tasks:
        tid = task.get("task_id", "")
        branch = task.get("branch", f"feat/task/{tid}")
        prompt = task.get("prompt", "")
        if not prompt:
            assignments.append({"task_id": tid, "status": "skipped", "error": "empty prompt"})
            continue

        # find free worker
        worker_dir = find_free_worker(ws_id)
        if not worker_dir:
            assignments.append({"task_id": tid, "status": "queued", "error": "no free worker"})
            continue

        # create branch in worker dir
        try:
            git_ops.fetch_origin(worker_dir)
            git_ops.create_branch(worker_dir, branch, f"origin/{default_branch}")
        except Exception as e:
            assignments.append({"task_id": tid, "status": "failed", "error": f"Branch creation failed: {e}"})
            continue

        # update task state — 无论是否经过 plan_tasks，都写入 state
        if tid not in state.get("tasks", {}):
            state["tasks"][tid] = {
                "task_id": tid,
                "prompt": prompt[:200],
                "branch": branch,
                "files": task.get("files", []),
            }
        state["tasks"][tid]["status"] = "running"
        state["tasks"][tid]["worker_dir"] = worker_dir
        state["tasks"][tid]["branch"] = branch
        state["tasks"][tid]["started_at"] = _utc_now()

        # build worker prompt with git instructions
        worker_prompt = f"""{prompt}

IMPORTANT: After completing your work:
1. Stage all changed files with `git add`
2. Commit with a descriptive message
3. Push to origin with: git push origin {branch}"""

        def _on_complete(result, _tid=tid, _branch=branch, _ws_id=ws_id, _worker_dir=worker_dir):
            # 兜底：检查是否有未提交的改动，如果有就 commit + push
            try:
                status_r = git_ops._run(["git", "status", "--porcelain"], cwd=_worker_dir, check=False)
                uncommitted = status_r.stdout.strip()
                if uncommitted:
                    debug_log(f"FALLBACK_COMMIT task={_tid} files={uncommitted[:200]}")
                    git_ops._run(["git", "add", "-A"], cwd=_worker_dir, check=False)
                    git_ops._run(["git", "commit", "-m", f"feat: {_tid}"], cwd=_worker_dir, check=False)
            except Exception:
                pass
            # push branch
            try:
                git_ops.push_branch(_worker_dir, _branch)
                debug_log(f"PUSH_OK task={_tid} branch={_branch}")
            except Exception as push_err:
                debug_log(f"PUSH_FAIL task={_tid}: {push_err}")
            # update state
            ws = get_workspace(_ws_id)
            if ws:
                if _tid not in ws.get("tasks", {}):
                    ws["tasks"][_tid] = {}
                ws["tasks"][_tid]["status"] = result["status"]
                ws["tasks"][_tid]["output"] = result.get("output", "")[:3000]
                ws["tasks"][_tid]["error"] = result.get("error")
                ws["tasks"][_tid]["completed_at"] = _utc_now()
                # add to merge queue
                if result["status"] == "completed":
                    ws["merge_queue"].append({"task_id": _tid, "branch": _branch, "queued_at": _utc_now()})
                save_workspace(ws)
            debug_log(f"WORKER_DONE task={_tid} status={result['status']}")

        t = run_codex_async(worker_prompt, worker_dir, on_complete=_on_complete)
        threads.append(t)
        assignments.append({"task_id": tid, "worker_dir": Path(worker_dir).name, "branch": branch, "status": "running"})

    save_workspace(state)
    return {"dispatched": len([a for a in assignments if a["status"] == "running"]), "assignments": assignments}


def handle_merge_branch(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    branch = args.get("branch", "")
    if not ws_id or not branch:
        return {"error": "workspace_id and branch are required"}

    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    merger_dir = state["merger_dir"]
    default_branch = state.get("default_branch", "main")
    auto_resolve = args.get("auto_resolve_conflicts", True)

    debug_log(f"MERGE ws={ws_id} branch={branch}")

    # attempt merge
    result = git_ops.merge_no_ff(merger_dir, branch, default_branch)

    if result["status"] == "merged":
        # remove from merge queue
        state["merge_queue"] = [m for m in state.get("merge_queue", []) if m.get("branch") != branch]
        save_workspace(state)
        return result

    if result["status"] == "conflict" and auto_resolve:
        conflicts = result["conflicts"]
        debug_log(f"CONFLICTS {conflicts}")

        resolution = resolve_conflicts(merger_dir, conflicts)

        if resolution["all_resolved"]:
            # commit the resolution
            sha = git_ops.commit(merger_dir, f"merge: resolve conflicts for {branch}")
            git_ops.push_branch(merger_dir, default_branch)
            state["merge_queue"] = [m for m in state.get("merge_queue", []) if m.get("branch") != branch]
            save_workspace(state)
            return {
                "status": "merged",
                "merge_sha": sha,
                "conflicts": conflicts,
                "resolution": "auto",
                "resolution_details": resolution["files"],
            }
        else:
            # abort merge, report failure
            git_ops.abort_merge(merger_dir)
            return {
                "status": "conflict",
                "conflicts": conflicts,
                "resolution": "failed",
                "resolution_details": resolution["files"],
            }

    if result["status"] == "conflict":
        git_ops.abort_merge(merger_dir)

    return result


def handle_workspace_status(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    if not ws_id:
        return {"error": "workspace_id is required"}
    return get_workspace_status(ws_id)


def handle_review_consistency(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    if not ws_id:
        return {"error": "workspace_id is required"}

    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    merger_dir = state["merger_dir"]
    default_branch = state.get("default_branch", "main")

    # collect all feature branches and their diffs
    git_ops.fetch_origin(merger_dir)
    branches = git_ops.list_branches(merger_dir, remote=True)
    feat_branches = [b.replace("origin/", "") for b in branches if "feat/" in b]

    branch_diffs = []
    for b in feat_branches:
        try:
            diff = git_ops.get_branch_diff_stat(merger_dir, b, default_branch)
            branch_diffs.append(diff)
        except Exception:
            pass

    # build review prompt
    diff_summary = json.dumps(branch_diffs, indent=2)
    prompt = f"""Review the following feature branches for consistency issues:

{diff_summary}

Check for:
1. Naming inconsistencies (same concept with different names across branches)
2. Duplicate functionality (multiple branches implementing the same thing)
3. Interface contract violations (branches not following shared type definitions)
4. Style inconsistencies

Output a JSON report:
```json
{{
  "issues": [
    {{"type": "naming|duplication|interface|style", "severity": "high|medium|low", "description": "...", "branches": ["..."]}}
  ],
  "recommendations": ["..."]
}}
```"""

    result = run_codex_sync(prompt, merger_dir, reasoning="high", timeout=300)
    if result["status"] != "completed":
        return {"error": result.get("error", "Review failed")}

    report = _extract_json_from_output(result.get("output", ""))
    return {"status": "completed", "report": report, "raw_output": result.get("output", "")[:3000]}


def handle_sync_to_origin(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    if not ws_id:
        return {"error": "workspace_id is required"}

    state = get_workspace(ws_id)
    if not state:
        return {"error": f"Unknown workspace: {ws_id}"}

    repo_path = state["repo_path"]
    merger_dir = state["merger_dir"]
    default_branch = state.get("default_branch", "main")
    target_branch = args.get("target_branch", default_branch)
    dry_run = args.get("dry_run", False)

    if dry_run:
        # 比较 merger 的 main 和原始仓库的 main
        try:
            git_ops._run(["git", "remote", "add", "user-repo", repo_path], cwd=merger_dir, check=False)
            git_ops._run(["git", "fetch", "user-repo"], cwd=merger_dir, check=False)
            r = git_ops._run(
                ["git", "log", f"user-repo/{target_branch}..{default_branch}", "--oneline"],
                cwd=merger_dir, check=False,
            )
            return {"status": "dry_run", "commits_to_push": r.stdout.strip().splitlines() if r.stdout else []}
        except Exception as e:
            return {"error": f"Dry run failed: {e}"}

    # 从用户仓库侧 pull：在原始仓库中添加 merger 为 remote，然后 pull
    try:
        git_ops._run(["git", "remote", "add", "merger", merger_dir], cwd=repo_path, check=False)
        git_ops._run(["git", "remote", "set-url", "merger", merger_dir], cwd=repo_path, check=False)
        git_ops._run(["git", "fetch", "merger"], cwd=repo_path)
        git_ops._run(["git", "merge", "--ff-only", f"merger/{default_branch}"], cwd=repo_path)
        # 清理 remote
        git_ops._run(["git", "remote", "remove", "merger"], cwd=repo_path, check=False)
        return {"status": "synced", "target_branch": target_branch}
    except subprocess.CalledProcessError as e:
        # 如果 ff-only 失败，尝试普通 merge
        try:
            git_ops._run(["git", "merge", f"merger/{default_branch}", "-m", "merge: sync from orchestra"], cwd=repo_path)
            git_ops._run(["git", "remote", "remove", "merger"], cwd=repo_path, check=False)
            return {"status": "synced", "target_branch": target_branch, "merge_type": "merge"}
        except Exception as e2:
            git_ops._run(["git", "remote", "remove", "merger"], cwd=repo_path, check=False)
            return {"error": f"Sync failed: {e2}"}


def handle_cleanup_workspace(args: dict) -> dict[str, Any]:
    ws_id = args.get("workspace_id", "")
    if not ws_id:
        return {"error": "workspace_id is required"}
    keep_origin = args.get("keep_origin", False)
    return cleanup_workspace(ws_id, keep_origin)

TOOLS_SCHEMA = [
    {
        "name": "init_workspace",
        "description": "Initialize a git-isolated workspace with bare clone + planner/merger/worker directories.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "repo_path": {"type": "string", "description": "Absolute path to the user's git repository"},
                "worker_count": {"type": "integer", "description": "Number of parallel workers (default: 3)", "default": 3},
            },
            "required": ["repo_path"],
        },
    },
    {
        "name": "plan_tasks",
        "description": "Run Planner Agent to analyze requirements, define interfaces on main, and output a task list for parallel workers.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "requirement": {"type": "string", "description": "User's requirement description"},
                "context_files": {"type": "array", "items": {"type": "string"}, "description": "Key files to review"},
            },
            "required": ["workspace_id", "requirement"],
        },
    },
    {
        "name": "dispatch_workers",
        "description": "Assign tasks to worker agents, each on an isolated branch in its own clone directory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "tasks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "task_id": {"type": "string"},
                            "branch": {"type": "string"},
                            "prompt": {"type": "string"},
                            "files": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["task_id", "prompt"],
                    },
                },
            },
            "required": ["workspace_id", "tasks"],
        },
    },
    {
        "name": "merge_branch",
        "description": "Merge Agent: review and merge a feature branch into main with AI conflict resolution.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "branch": {"type": "string", "description": "Feature branch to merge"},
                "task_id": {"type": "string"},
                "auto_resolve_conflicts": {"type": "boolean", "default": True},
            },
            "required": ["workspace_id", "branch"],
        },
    },
    {
        "name": "workspace_status",
        "description": "Query workspace status: worker progress, branches, merge queue.",
        "inputSchema": {
            "type": "object",
            "properties": {"workspace_id": {"type": "string"}},
            "required": ["workspace_id"],
        },
    },
    {
        "name": "review_consistency",
        "description": "Review all branches for naming consistency, interface compliance, and duplicate functionality.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "check_types": {"type": "array", "items": {"type": "string", "enum": ["naming", "interface_compliance", "duplication", "style"]}},
            },
            "required": ["workspace_id"],
        },
    },
    {
        "name": "sync_to_origin",
        "description": "Sync merged main branch back to the user's original repository.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "target_branch": {"type": "string", "default": "main"},
                "dry_run": {"type": "boolean", "default": False},
            },
            "required": ["workspace_id"],
        },
    },
    {
        "name": "cleanup_workspace",
        "description": "Remove workspace clone directories and state files.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "workspace_id": {"type": "string"},
                "keep_origin": {"type": "boolean", "default": False},
            },
            "required": ["workspace_id"],
        },
    },
]

TOOL_HANDLERS = {
    "init_workspace": handle_init_workspace,
    "plan_tasks": handle_plan_tasks,
    "dispatch_workers": handle_dispatch_workers,
    "merge_branch": handle_merge_branch,
    "workspace_status": handle_workspace_status,
    "review_consistency": handle_review_consistency,
    "sync_to_origin": handle_sync_to_origin,
    "cleanup_workspace": handle_cleanup_workspace,
}


def handle_request(request: dict[str, Any]) -> dict[str, Any] | None:
    req_id = request.get("id")
    method = request.get("method", "")
    params = request.get("params", {})
    debug_log(f"REQ id={req_id!r} method={method}")

    if req_id is None:
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0", "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": SERVER_NAME, "version": "1.0.0"},
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method in ("resources/list", "resources/templates/list"):
        key = "resources" if "templates" not in method else "resourceTemplates"
        return {"jsonrpc": "2.0", "id": req_id, "result": {key: []}}

    if method in ("notifications/initialized", "initialized"):
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS_SCHEMA}}

    if method == "tools/call":
        name = params.get("name", "")
        args = params.get("arguments", {}) or {}
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown tool: {name}"}}
        try:
            result = handler(args)
            if isinstance(result, dict) and "error" in result and len(result) == 1:
                return tool_error(req_id, result["error"])
            return tool_success(req_id, result)
        except Exception as e:
            debug_log(f"TOOL_ERROR {name}: {traceback.format_exc()}")
            return tool_error(req_id, str(e))

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}


def main() -> None:
    debug_log(f"=== {SERVER_NAME} starting ===")
    while True:
        try:
            request = read_message()
            if request is None:
                debug_log("EOF")
                break
            response = handle_request(request)
            if response is not None:
                send_response(response)
        except Exception:
            debug_log(traceback.format_exc())
            break


if __name__ == "__main__":
    main()



