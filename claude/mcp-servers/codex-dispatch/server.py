#!/usr/bin/env python3
"""Codex Dispatch MCP server for Claude Code orchestration.

Claude Code acts as the brain (planning, review), dispatching tasks
to multiple Codex CLI workers for parallel execution.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# raw binary stdio for MCP protocol
sys.stdout = os.fdopen(sys.stdout.fileno(), "wb", buffering=0)
sys.stdin = os.fdopen(sys.stdin.fileno(), "rb", buffering=0)

SERVER_NAME = "codex-dispatch"
CODEX_BIN = os.environ.get("CODEX_BIN", "codex")
DEFAULT_SANDBOX = os.environ.get("CODEX_DISPATCH_SANDBOX", "full-auto")
DEFAULT_MODEL = os.environ.get("CODEX_DISPATCH_MODEL", "")
DEFAULT_REASONING = os.environ.get("CODEX_DISPATCH_REASONING", "high")
MAX_PARALLEL = int(os.environ.get("CODEX_DISPATCH_MAX_PARALLEL", "5"))
DEBUG_LOG = Path(os.environ.get("CODEX_DISPATCH_DEBUG_LOG", f"/tmp/{SERVER_NAME}-debug.log"))
STATE_DIR = Path(
    os.environ.get(
        "CODEX_DISPATCH_STATE_DIR",
        str(Path.home() / ".claude" / "mcp-servers" / "codex-dispatch" / "state"),
    )
)

_use_ndjson = False
TERMINAL_STATES = {"completed", "failed", "cancelled"}
_tasks: dict[str, dict[str, Any]] = {}
_lock = threading.Lock()


# ── logging ──────────────────────────────────────────────────────────

def debug_log(message: str) -> None:
    try:
        DEBUG_LOG.parent.mkdir(parents=True, exist_ok=True)
        with DEBUG_LOG.open("a", encoding="utf-8") as fh:
            ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
            fh.write(f"[{ts}] {message}\n")
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
            header_line = sys.stdin.readline()
            if not header_line:
                return None
            if header_line in {b"\r\n", b"\n"}:
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


# ── helpers ──────────────────────────────────────────────────────────

def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(path)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def task_path(task_id: str) -> Path:
    return STATE_DIR / f"{task_id}.json"


def is_pid_alive(pid: int | None) -> bool:
    if not pid or pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def find_codex_bin() -> str | None:
    if Path(CODEX_BIN).is_file():
        return CODEX_BIN
    return shutil.which(CODEX_BIN)


def running_count() -> int:
    with _lock:
        return sum(1 for t in _tasks.values() if t.get("status") == "running")


def save_task(task: dict[str, Any]) -> None:
    write_json(task_path(task["taskId"]), task)
    with _lock:
        _tasks[task["taskId"]] = task


def load_tasks_from_disk() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    for f in STATE_DIR.glob("*.json"):
        if f.suffix == ".tmp":
            continue
        try:
            task = read_json(f)
            tid = task.get("taskId")
            if tid:
                # 检查僵尸任务
                if task.get("status") in ("queued", "running") and not is_pid_alive(task.get("workerPid")):
                    task["status"] = "failed"
                    task["error"] = "Worker process exited unexpectedly"
                    task["completedAt"] = utc_now()
                    task["updatedAt"] = task["completedAt"]
                    write_json(f, task)
                with _lock:
                    _tasks[tid] = task
        except (json.JSONDecodeError, OSError):
            pass


def serialize_task(task: dict[str, Any]) -> dict[str, Any]:
    return {
        "taskId": task.get("taskId"),
        "status": task.get("status"),
        "prompt": task.get("prompt", "")[:200],
        "workingDir": task.get("workingDir"),
        "createdAt": task.get("createdAt"),
        "startedAt": task.get("startedAt"),
        "completedAt": task.get("completedAt"),
        "error": task.get("error"),
        "hasResult": bool(task.get("result")),
    }


# ── codex exec ───────────────────────────────────────────────────────

def build_codex_command(
    prompt: str,
    working_dir: str,
    sandbox: str | None = None,
    model: str | None = None,
    reasoning: str | None = None,
) -> list[str]:
    bin_path = find_codex_bin()
    if not bin_path:
        raise FileNotFoundError(f"Codex CLI not found: {CODEX_BIN}")

    sb = sandbox or DEFAULT_SANDBOX
    sandbox_flag = f"--full-auto" if sb == "full-auto" else f"--approval-mode={sb}"

    cmd = [bin_path, "exec"]
    if sb == "full-auto":
        cmd.append("--full-auto")
    else:
        cmd.extend(["--approval-mode", sb])

    cmd.extend(["--cd", working_dir, "--skip-git-repo-check"])

    selected_model = model or DEFAULT_MODEL
    if selected_model:
        cmd.extend(["--model", selected_model])

    selected_reasoning = reasoning or DEFAULT_REASONING
    if selected_reasoning:
        cmd.extend(["-c", f'model_reasoning_effort="{selected_reasoning}"'])

    cmd.append(prompt)
    return cmd


def run_worker(task_id: str) -> None:
    """Worker thread: runs codex exec and captures output."""
    p = task_path(task_id)
    if not p.exists():
        return

    task = read_json(p)
    task["status"] = "running"
    task["startedAt"] = utc_now()
    task["updatedAt"] = task["startedAt"]

    try:
        cmd = build_codex_command(
            task["prompt"],
            task["workingDir"],
            sandbox=task.get("sandbox"),
            model=task.get("model"),
            reasoning=task.get("reasoning"),
        )
    except FileNotFoundError as exc:
        task["status"] = "failed"
        task["error"] = str(exc)
        task["completedAt"] = utc_now()
        task["updatedAt"] = task["completedAt"]
        save_task(task)
        return

    debug_log(f"WORKER_START task={task_id} cmd={' '.join(cmd)}")

    # 用临时文件捕获输出
    stdout_file = STATE_DIR / f"{task_id}.stdout"
    stderr_file = STATE_DIR / f"{task_id}.stderr"

    try:
        with open(stdout_file, "w", encoding="utf-8") as out_f, \
             open(stderr_file, "w", encoding="utf-8") as err_f:
            proc = subprocess.Popen(
                cmd,
                stdout=out_f,
                stderr=err_f,
                stdin=subprocess.DEVNULL,
                close_fds=True,
            )
            task["workerPid"] = proc.pid
            save_task(task)

            proc.wait()
    except OSError as exc:
        task["status"] = "failed"
        task["error"] = f"Failed to launch codex: {exc}"
        task["completedAt"] = utc_now()
        task["updatedAt"] = task["completedAt"]
        save_task(task)
        return

    finished_at = utc_now()

    # 读取输出
    stdout_content = ""
    stderr_content = ""
    try:
        stdout_content = stdout_file.read_text(encoding="utf-8")
    except OSError:
        pass
    try:
        stderr_content = stderr_file.read_text(encoding="utf-8")
    except OSError:
        pass

    task["updatedAt"] = finished_at
    task["completedAt"] = finished_at

    if proc.returncode != 0:
        task["status"] = "failed"
        task["error"] = stderr_content[:2000] if stderr_content else f"codex exec exited with code {proc.returncode}"
        task["result"] = stdout_content[:5000] if stdout_content else None
    else:
        task["status"] = "completed"
        task["error"] = None
        task["result"] = stdout_content if stdout_content else "(no output)"

    save_task(task)
    debug_log(f"WORKER_DONE task={task_id} status={task['status']}")

    # 清理临时文件
    try:
        stdout_file.unlink(missing_ok=True)
        stderr_file.unlink(missing_ok=True)
    except OSError:
        pass

    # 检查队列中是否有等待的任务
    process_queue()


def process_queue() -> None:
    """启动队列中等待的任务，直到达到并行上限。"""
    with _lock:
        queued = [t for t in _tasks.values() if t.get("status") == "queued"]
        queued.sort(key=lambda t: t.get("createdAt", ""))

    for task in queued:
        if running_count() >= MAX_PARALLEL:
            break
        thread = threading.Thread(target=run_worker, args=(task["taskId"],), daemon=True)
        thread.start()


# ── MCP tool implementations ────────────────────────────────────────

def dispatch_task(
    prompt: str,
    working_dir: str,
    sandbox: str | None = None,
    model: str | None = None,
    reasoning: str | None = None,
    context_files: list[str] | None = None,
) -> dict[str, Any]:
    task_id = uuid.uuid4().hex[:12]
    now = utc_now()

    # 如果有 context_files，拼入 prompt
    full_prompt = prompt
    if context_files:
        files_hint = "\n\nPlease pay attention to these files:\n" + "\n".join(f"- {f}" for f in context_files)
        full_prompt = prompt + files_hint

    task = {
        "taskId": task_id,
        "status": "queued",
        "prompt": full_prompt,
        "workingDir": working_dir,
        "sandbox": sandbox,
        "model": model,
        "reasoning": reasoning,
        "createdAt": now,
        "startedAt": None,
        "completedAt": None,
        "updatedAt": now,
        "error": None,
        "result": None,
        "workerPid": None,
    }
    save_task(task)
    debug_log(f"DISPATCH task={task_id} dir={working_dir}")

    # 尝试立即启动
    if running_count() < MAX_PARALLEL:
        thread = threading.Thread(target=run_worker, args=(task_id,), daemon=True)
        thread.start()

    return serialize_task(task)


def batch_dispatch(
    tasks_input: list[dict[str, Any]],
    sandbox: str | None = None,
    max_parallel: int | None = None,
) -> list[dict[str, Any]]:
    results = []
    for t in tasks_input:
        result = dispatch_task(
            prompt=t.get("prompt", ""),
            working_dir=t.get("working_dir", t.get("workingDir", ".")),
            sandbox=sandbox or t.get("sandbox"),
            model=t.get("model"),
            reasoning=t.get("reasoning"),
            context_files=t.get("context_files"),
        )
        results.append(result)
    return results


def get_task_status(task_id: str | None = None) -> dict[str, Any] | list[dict[str, Any]]:
    if task_id:
        with _lock:
            task = _tasks.get(task_id)
        if not task:
            p = task_path(task_id)
            if p.exists():
                task = read_json(p)
            else:
                return {"error": f"Unknown task: {task_id}"}
        # 检查进程状态
        if task.get("status") in ("queued", "running") and not is_pid_alive(task.get("workerPid")):
            if task.get("status") == "running":
                task["status"] = "failed"
                task["error"] = "Worker process exited unexpectedly"
                task["completedAt"] = utc_now()
                task["updatedAt"] = task["completedAt"]
                save_task(task)
        return serialize_task(task)

    with _lock:
        all_tasks = list(_tasks.values())
    return [serialize_task(t) for t in sorted(all_tasks, key=lambda t: t.get("createdAt", ""))]


def get_task_result(task_id: str) -> dict[str, Any]:
    with _lock:
        task = _tasks.get(task_id)
    if not task:
        p = task_path(task_id)
        if p.exists():
            task = read_json(p)
        else:
            return {"error": f"Unknown task: {task_id}"}

    return {
        "taskId": task["taskId"],
        "status": task.get("status"),
        "result": task.get("result"),
        "error": task.get("error"),
        "prompt": task.get("prompt", "")[:200],
        "workingDir": task.get("workingDir"),
        "completedAt": task.get("completedAt"),
    }


def list_tasks(status_filter: str | None = None) -> list[dict[str, Any]]:
    with _lock:
        all_tasks = list(_tasks.values())
    if status_filter:
        all_tasks = [t for t in all_tasks if t.get("status") == status_filter]
    return [serialize_task(t) for t in sorted(all_tasks, key=lambda t: t.get("createdAt", ""))]


def cancel_task(task_id: str) -> dict[str, Any]:
    with _lock:
        task = _tasks.get(task_id)
    if not task:
        return {"error": f"Unknown task: {task_id}"}

    if task.get("status") in TERMINAL_STATES:
        return {"error": f"Task already in terminal state: {task['status']}"}

    # kill worker process
    pid = task.get("workerPid")
    if pid and is_pid_alive(pid):
        try:
            os.kill(pid, 9)
        except OSError:
            pass

    task["status"] = "cancelled"
    task["completedAt"] = utc_now()
    task["updatedAt"] = task["completedAt"]
    save_task(task)
    return serialize_task(task)


# ── JSON-RPC helpers ─────────────────────────────────────────────────

def tool_success(request_id: Any, payload: Any) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "content": [{"type": "text", "text": json.dumps(payload, ensure_ascii=False, indent=2)}],
        },
    }


def tool_error(request_id: Any, message: str) -> dict[str, Any]:
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "result": {
            "content": [{"type": "text", "text": json.dumps({"error": message}, ensure_ascii=False)}],
            "isError": True,
        },
    }


# ── tools/list ───────────────────────────────────────────────────────

TOOLS_SCHEMA = [
    {
        "name": "dispatch_task",
        "description": "Submit a single coding task to a Codex worker. Returns task ID for tracking.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string", "description": "Task description / instructions for Codex"},
                "working_dir": {"type": "string", "description": "Working directory for the task"},
                "sandbox": {
                    "type": "string",
                    "enum": ["full-auto", "suggest", "ask"],
                    "description": "Sandbox mode (default: full-auto)",
                },
                "model": {"type": "string", "description": "Model override"},
                "reasoning_effort": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "xhigh"],
                    "description": "Reasoning depth (default: high)",
                },
                "context_files": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Files that Codex should focus on",
                },
            },
            "required": ["prompt", "working_dir"],
        },
    },
    {
        "name": "batch_dispatch",
        "description": "Submit multiple coding tasks to Codex workers for parallel execution.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "tasks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "prompt": {"type": "string"},
                            "working_dir": {"type": "string"},
                            "model": {"type": "string"},
                            "reasoning": {"type": "string"},
                            "context_files": {
                                "type": "array",
                                "items": {"type": "string"},
                            },
                        },
                        "required": ["prompt", "working_dir"],
                    },
                    "description": "Array of tasks to dispatch",
                },
                "sandbox": {
                    "type": "string",
                    "enum": ["full-auto", "suggest", "ask"],
                    "description": "Unified sandbox mode for all tasks",
                },
            },
            "required": ["tasks"],
        },
    },
    {
        "name": "task_status",
        "description": "Query task status. Pass task_id for a single task, or omit for all tasks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID (optional, omit for all)"},
            },
        },
    },
    {
        "name": "task_result",
        "description": "Get the full output/result of a completed task.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "list_tasks",
        "description": "List all tasks, optionally filtered by status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "status_filter": {
                    "type": "string",
                    "enum": ["queued", "running", "completed", "failed", "cancelled"],
                    "description": "Filter by status",
                },
            },
        },
    },
    {
        "name": "cancel_task",
        "description": "Cancel a queued or running task.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to cancel"},
            },
            "required": ["task_id"],
        },
    },
]


# ── request handler ──────────────────────────────────────────────────

def handle_request(request: dict[str, Any]) -> dict[str, Any] | None:
    request_id = request.get("id")
    method = request.get("method", "")
    params = request.get("params", {})
    debug_log(f"REQ id={request_id!r} method={method}")

    if request_id is None:
        return None

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": SERVER_NAME, "version": "1.0.0"},
            },
        }

    if method == "ping":
        return {"jsonrpc": "2.0", "id": request_id, "result": {}}

    if method in ("resources/list", "resources/templates/list"):
        key = "resources" if "templates" not in method else "resourceTemplates"
        return {"jsonrpc": "2.0", "id": request_id, "result": {key: []}}

    if method in ("notifications/initialized", "initialized"):
        return {"jsonrpc": "2.0", "id": request_id, "result": {}}

    if method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"tools": TOOLS_SCHEMA},
        }

    if method == "tools/call":
        name = params.get("name", "")
        args = params.get("arguments", {}) or {}

        if name == "dispatch_task":
            prompt = args.get("prompt", "")
            working_dir = args.get("working_dir", "")
            if not prompt or not working_dir:
                return tool_error(request_id, "prompt and working_dir are required")
            result = dispatch_task(
                prompt=prompt,
                working_dir=working_dir,
                sandbox=args.get("sandbox"),
                model=args.get("model"),
                reasoning=args.get("reasoning_effort"),
                context_files=args.get("context_files"),
            )
            return tool_success(request_id, result)

        if name == "batch_dispatch":
            tasks_input = args.get("tasks", [])
            if not tasks_input:
                return tool_error(request_id, "tasks array is required and cannot be empty")
            results = batch_dispatch(
                tasks_input=tasks_input,
                sandbox=args.get("sandbox"),
            )
            return tool_success(request_id, {"dispatched": len(results), "tasks": results})

        if name == "task_status":
            result = get_task_status(args.get("task_id"))
            return tool_success(request_id, result)

        if name == "task_result":
            tid = args.get("task_id", "")
            if not tid:
                return tool_error(request_id, "task_id is required")
            result = get_task_result(tid)
            if "error" in result and result.get("status") is None:
                return tool_error(request_id, result["error"])
            return tool_success(request_id, result)

        if name == "list_tasks":
            result = list_tasks(args.get("status_filter"))
            return tool_success(request_id, {"count": len(result), "tasks": result})

        if name == "cancel_task":
            tid = args.get("task_id", "")
            if not tid:
                return tool_error(request_id, "task_id is required")
            result = cancel_task(tid)
            if "error" in result and "taskId" not in result:
                return tool_error(request_id, result["error"])
            return tool_success(request_id, result)

        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": f"Unknown tool: {name}"},
        }

    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


# ── main ─────────────────────────────────────────────────────────────

def main() -> None:
    debug_log(f"=== {SERVER_NAME} starting ===")
    load_tasks_from_disk()
    debug_log(f"Loaded {len(_tasks)} tasks from disk")

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
