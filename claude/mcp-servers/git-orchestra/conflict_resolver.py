"""AI-powered conflict resolution for git-orchestra.

Parses git conflict markers, constructs prompts for codex exec
to analyze and resolve conflicts automatically.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import sys
from pathlib import Path

_self_dir = str(Path(__file__).parent)
if _self_dir not in sys.path:
    sys.path.insert(0, _self_dir)

import git_ops
from dispatcher import run_codex_sync


def parse_conflict_markers(content: str) -> list[dict[str, str]]:
    """Parse git conflict markers into structured blocks."""
    pattern = re.compile(
        r'<<<<<<<\s*(.*?)\n(.*?)=======\n(.*?)>>>>>>>\s*(.*?)\n',
        re.DOTALL,
    )
    conflicts = []
    for m in pattern.finditer(content):
        conflicts.append({
            "ours_label": m.group(1).strip(),
            "ours": m.group(2),
            "theirs": m.group(3),
            "theirs_label": m.group(4).strip(),
        })
    return conflicts


def build_resolution_prompt(file_path: str, content: str, context: str = "") -> str:
    """Build a prompt for AI to resolve merge conflicts."""
    return f"""You are resolving a git merge conflict. Output ONLY the resolved file content, no explanations.

File: {file_path}
{f"Context: {context}" if context else ""}

The file below contains git conflict markers (<<<<<<< / ======= / >>>>>>>).
Merge both sides intelligently:
- Keep all valid changes from both sides
- Ensure correct syntax
- Maintain consistent naming and style
- Do NOT include any conflict markers in your output

--- FILE WITH CONFLICTS ---
{content}
--- END ---

Output the complete resolved file content:"""


def resolve_conflicts(
    merger_dir: str | Path,
    conflicted_files: list[str],
    context: str = "",
) -> dict[str, Any]:
    """Resolve all conflicts in the merger directory using AI."""
    results = []
    all_resolved = True

    for file_path in conflicted_files:
        try:
            content = git_ops.read_conflict_file(merger_dir, file_path)
        except OSError as e:
            results.append({"file": file_path, "status": "error", "error": str(e)})
            all_resolved = False
            continue

        conflicts = parse_conflict_markers(content)
        if not conflicts:
            # 没有冲突标记，可能已经解决
            git_ops.stage_file(merger_dir, file_path)
            results.append({"file": file_path, "status": "no_conflicts"})
            continue

        prompt = build_resolution_prompt(file_path, content, context)
        result = run_codex_sync(
            prompt=prompt,
            working_dir=str(merger_dir),
            reasoning="high",
            timeout=300,
        )

        if result["status"] == "completed" and result.get("output"):
            resolved_content = result["output"].strip()
            # 验证没有残留冲突标记
            if "<<<<<<" in resolved_content or "=======" in resolved_content or ">>>>>>>" in resolved_content:
                results.append({
                    "file": file_path,
                    "status": "failed",
                    "error": "AI output still contains conflict markers",
                })
                all_resolved = False
                continue

            # 写入解决后的内容
            full_path = Path(merger_dir) / file_path
            full_path.write_text(resolved_content, encoding="utf-8")
            git_ops.stage_file(merger_dir, file_path)
            results.append({"file": file_path, "status": "resolved"})
        else:
            results.append({
                "file": file_path,
                "status": "failed",
                "error": result.get("error", "AI resolution failed"),
            })
            all_resolved = False

    return {
        "all_resolved": all_resolved,
        "files": results,
    }
