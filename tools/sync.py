#!/usr/bin/env python3
"""Skill Universal Sync Tool

Canonical format: Claude Code SKILL.md (most expressive)
Targets: Cursor skill SKILL.md, Cursor MDC (.mdc)

Usage:
  python3 sync.py convert   # one-shot batch convert all skills
  python3 sync.py watch     # watch & auto-sync on change (polling)
  python3 sync.py status    # show sync status
"""

import os, sys, re, time, shutil, hashlib, json, argparse
from pathlib import Path
from datetime import datetime

# ── Paths ──────────────────────────────────────────────────────────────────
HOME = Path.home()
CLAUDE_SKILLS   = HOME / ".claude/skills"
CURSOR_SKILLS   = HOME / ".cursor/skills-cursor"
CURSOR_RULES    = HOME / ".cursor/rules"          # .mdc files land here
STATE_FILE      = HOME / ".claude/skills_lyf_sync_state.json"

# ── Frontmatter helpers ────────────────────────────────────────────────────
def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Return (meta_dict, body) from a SKILL.md / .mdc file."""
    if not text.startswith("---"):
        return {}, text
    end = text.find("\n---", 3)
    if end == -1:
        return {}, text
    fm_block = text[3:end].strip()
    body = text[end+4:].lstrip("\n")
    meta = {}
    for line in fm_block.splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, body

def build_frontmatter(meta: dict) -> str:
    lines = ["---"]
    for k, v in meta.items():
        lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines) + "\n"

# ── Converters ─────────────────────────────────────────────────────────────

def claude_to_cursor_skill(src: Path, dst_dir: Path):
    """Claude Code SKILL.md → Cursor skill SKILL.md
    Drops: allowed-tools, argument-hint, origin (Cursor-irrelevant)
    Keeps: name, description, body
    """
    text = src.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if not meta.get("name"):
        return  # skip malformed

    out_meta = {}
    if meta.get("name"):        out_meta["name"] = meta["name"]
    if meta.get("description"): out_meta["description"] = meta["description"]

    skill_dir = dst_dir / meta["name"]
    skill_dir.mkdir(parents=True, exist_ok=True)
    out_path = skill_dir / "SKILL.md"
    out_path.write_text(build_frontmatter(out_meta) + "\n" + body, encoding="utf-8")
    return out_path

def claude_to_cursor_mdc(src: Path, dst_dir: Path, always_apply: bool = False):
    """Claude Code SKILL.md → Cursor .mdc rule
    globs: '' (manual apply by default)
    alwaysApply: false (override with always_apply=True for rules)
    """
    text = src.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if not meta.get("name"):
        return

    desc = meta.get("description", "")
    # Cursor MDC frontmatter
    out_meta = {
        "description": desc,
        "globs": "",
        "alwaysApply": "true" if always_apply else "false",
    }

    dst_dir.mkdir(parents=True, exist_ok=True)
    out_path = dst_dir / f"{meta['name']}.mdc"
    out_path.write_text(build_frontmatter(out_meta) + "\n" + body, encoding="utf-8")
    return out_path

def cursor_skill_to_claude(src_dir: Path, dst_dir: Path):
    """Cursor skill SKILL.md → Claude Code SKILL.md
    Only imports skills that do NOT already exist in Claude (Claude is source of truth).
    """
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    if not meta.get("name"):
        meta["name"] = src_dir.name

    out_dir = dst_dir / meta["name"]
    out_path = out_dir / "SKILL.md"
    # Claude is source of truth — skip if already exists there
    if out_path.exists():
        return

    out_meta = {"name": meta["name"], "origin": "cursor-migration"}
    if meta.get("description"): out_meta["description"] = meta["description"]

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_frontmatter(out_meta) + "\n" + body, encoding="utf-8")
    return out_path

def cursor_mdc_to_claude(mdc_path: Path, dst_dir: Path):
    """Cursor .mdc → Claude Code SKILL.md (only imports new ones)"""
    text = mdc_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = mdc_path.stem
    desc = meta.get("description", "")

    out_dir = dst_dir / name
    out_path = out_dir / "SKILL.md"
    # Skip if already in Claude
    if out_path.exists():
        return

    out_meta = {"name": name, "origin": "cursor-mdc"}
    if desc: out_meta["description"] = desc

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path.write_text(build_frontmatter(out_meta) + "\n" + body, encoding="utf-8")
    return out_path

# ── Batch convert ──────────────────────────────────────────────────────────

def convert_all(verbose=True):
    results = {"claude→cursor_skill": 0, "claude→mdc": 0,
               "cursor_skill→claude": 0, "mdc→claude": 0}

    # 1. Claude skills → Cursor skills
    if CLAUDE_SKILLS.exists():
        for skill_dir in sorted(CLAUDE_SKILLS.iterdir()):
            skill_md = skill_dir / "SKILL.md"
            if skill_md.exists():
                if claude_to_cursor_skill(skill_md, CURSOR_SKILLS):
                    results["claude→cursor_skill"] += 1

    # 2. Claude skills → Cursor MDC (rules dir)
    if CLAUDE_SKILLS.exists() and CURSOR_RULES.exists():
        for skill_dir in sorted(CLAUDE_SKILLS.iterdir()):
            skill_md = skill_dir / "SKILL.md"
            if skill_md.exists():
                if claude_to_cursor_mdc(skill_md, CURSOR_RULES / "skills"):
                    results["claude→mdc"] += 1

    # 3. Cursor skills → Claude (import missing ones)
    if CURSOR_SKILLS.exists():
        for skill_dir in sorted(CURSOR_SKILLS.iterdir()):
            if skill_dir.is_dir():
                r = cursor_skill_to_claude(skill_dir, CLAUDE_SKILLS)
                if r: results["cursor_skill→claude"] += 1

    # 4. Cursor MDC → Claude (import missing)
    if CURSOR_RULES.exists():
        for mdc in sorted(CURSOR_RULES.rglob("*.mdc")):
            r = cursor_mdc_to_claude(mdc, CLAUDE_SKILLS)
            if r: results["mdc→claude"] += 1

    if verbose:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Sync complete:")
        for k, v in results.items():
            print(f"  {k}: {v} files")
    return results

# ── File hash state ─────────────────────────────────────────────────────────

def snapshot_skills() -> dict:
    """Return {path: mtime} for all SKILL.md and .mdc files."""
    state = {}
    for base in [CLAUDE_SKILLS, CURSOR_SKILLS]:
        if base.exists():
            for f in base.rglob("SKILL.md"):
                state[str(f)] = f.stat().st_mtime
    if CURSOR_RULES.exists():
        for f in CURSOR_RULES.rglob("*.mdc"):
            state[str(f)] = f.stat().st_mtime
    return state

# ── Watch mode (polling, zero deps) ─────────────────────────────────────────

def watch(interval=3):
    print(f"Watching for skill changes (poll every {interval}s). Ctrl-C to stop.")
    prev = snapshot_skills()
    while True:
        time.sleep(interval)
        curr = snapshot_skills()
        changed = {k for k in curr if curr[k] != prev.get(k)}
        new_files = set(curr) - set(prev)
        if changed or new_files:
            print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Detected {len(changed|new_files)} change(s):")
            for f in sorted(changed | new_files):
                print(f"  ~ {f}")
            convert_all(verbose=True)
        prev = curr

# ── Status ──────────────────────────────────────────────────────────────────

def show_status():
    claude_count = sum(1 for _ in CLAUDE_SKILLS.rglob("SKILL.md")) if CLAUDE_SKILLS.exists() else 0
    cursor_count = sum(1 for d in CURSOR_SKILLS.iterdir() if d.is_dir() and (d/"SKILL.md").exists()) if CURSOR_SKILLS.exists() else 0
    mdc_count = sum(1 for _ in CURSOR_RULES.rglob("*.mdc")) if CURSOR_RULES.exists() else 0
    print(f"Claude Code skills : {claude_count}")
    print(f"Cursor skills      : {cursor_count}")
    print(f"Cursor MDC rules   : {mdc_count}")
    print(f"Paths:")
    print(f"  Claude : {CLAUDE_SKILLS}")
    print(f"  Cursor : {CURSOR_SKILLS}")
    print(f"  MDC    : {CURSOR_RULES}")

# ── Main ────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Skill Universal Sync Tool")
    sub = parser.add_subparsers(dest="cmd")
    sub.add_parser("convert", help="One-shot batch convert all skills")
    wp = sub.add_parser("watch", help="Watch and auto-sync on change")
    wp.add_argument("--interval", type=int, default=3, help="Poll interval seconds (default 3)")
    sub.add_parser("status", help="Show skill counts per tool")
    args = parser.parse_args()

    if args.cmd == "convert":
        convert_all()
    elif args.cmd == "watch":
        interval = getattr(args, "interval", 3)
        convert_all(verbose=False)  # initial sync
        watch(interval)
    elif args.cmd == "status":
        show_status()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
