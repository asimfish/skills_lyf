#!/usr/bin/env python3
"""skill sync tool — Claude Code is source of truth.

Commands:
  status          show counts in all dirs
  stage           convert Claude skills → repo staging dirs (SAFE, no live touch)
  deploy          backup live dirs then copy staging → live (explicit opt-in)
  watch           poll Claude dir, auto-stage every N seconds (no auto-deploy)

Staging dirs (inside repo, git-ignored):
  skills_lyf/staging/cursor-skills/
  skills_lyf/staging/cursor-mdc/
"""
import argparse, shutil, sys, time
from datetime import datetime
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
REPO   = Path(__file__).resolve().parent.parent
STAGE  = REPO / "staging"

CLAUDE_DIR  = Path.home() / ".claude" / "skills"
CURSOR_DIR  = Path.home() / ".cursor" / "skills-cursor"
MDC_DIR     = Path.home() / ".cursor" / "rules" / "skills"

STAGE_CURSOR = STAGE / "cursor-skills"
STAGE_MDC    = STAGE / "cursor-mdc"

# ── Frontmatter helpers ───────────────────────────────────────────────────────
def parse_frontmatter(text: str):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta = {}
    for line in parts[1].splitlines():
        if ":" in line:
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip()
    return meta, parts[2].lstrip("\n")

def build_frontmatter(meta: dict) -> str:
    lines = ["---"]
    for k, v in meta.items():
        lines.append(f"{k}: {v}")
    lines.append("---")
    return "\n".join(lines) + "\n"

# ── Converters ────────────────────────────────────────────────────────────────
def claude_to_cursor_skill(src: Path, dst_root: Path) -> bool:
    """Claude SKILL.md → Cursor SKILL.md (staging only)"""
    skill_md = src / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name", src.name)
    desc = meta.get("description", "")

    out_meta = {"name": name}
    if desc:
        out_meta["description"] = desc

    new_text = build_frontmatter(out_meta) + "\n" + body
    out_dir = dst_root / name
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "SKILL.md"
    if out_path.exists() and out_path.read_text(encoding="utf-8") == new_text:
        return False
    out_path.write_text(new_text, encoding="utf-8")
    return True

def claude_to_mdc(src: Path, dst_root: Path) -> bool:
    """Claude SKILL.md → Cursor .mdc (staging only)"""
    skill_md = src / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name", src.name)
    desc = meta.get("description", "")

    out_meta = {"description": desc, "globs": "", "alwaysApply": "false"}
    new_text = build_frontmatter(out_meta) + "\n" + body
    dst_root.mkdir(parents=True, exist_ok=True)
    out_path = dst_root / f"{name}.mdc"
    if out_path.exists() and out_path.read_text(encoding="utf-8") == new_text:
        return False
    out_path.write_text(new_text, encoding="utf-8")
    return True

# ── Commands ─────────────────────────────────────────────────────────────────
def cmd_status(_args):
    def count(p): return len(list(p.glob("*/SKILL.md"))) if p.exists() else 0
    def countf(p, pat): return len(list(p.glob(pat))) if p.exists() else 0
    print(f"Claude skills (live) : {count(CLAUDE_DIR)}")
    print(f"Cursor skills (live) : {count(CURSOR_DIR)}")
    print(f"MDC rules (live)     : {countf(MDC_DIR, '*.mdc')}")
    print(f"Staging cursor       : {count(STAGE_CURSOR)}")
    print(f"Staging MDC          : {countf(STAGE_MDC, '*.mdc')}")

def cmd_stage(_args):
    """Convert Claude → staging dirs. Never touches live Cursor/MDC dirs."""
    STAGE_CURSOR.mkdir(parents=True, exist_ok=True)
    STAGE_MDC.mkdir(parents=True, exist_ok=True)

    n_cursor = n_mdc = 0
    for skill_dir in sorted(CLAUDE_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        if claude_to_cursor_skill(skill_dir, STAGE_CURSOR):
            n_cursor += 1
        if claude_to_mdc(skill_dir, STAGE_MDC):
            n_mdc += 1

    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Stage complete: {n_cursor} cursor-skills, {n_mdc} MDC files updated")
    print(f"  staging/cursor-skills/ → {STAGE_CURSOR}")
    print(f"  staging/cursor-mdc/    → {STAGE_MDC}")
    print("  (nothing written to ~/.cursor — run 'deploy' to push live)")

def _backup(src: Path, label: str):
    if not src.exists():
        return
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    bak = STAGE / "backups" / f"{label}_{ts}"
    shutil.copytree(src, bak)
    print(f"  Backed up {src} → {bak}")

def cmd_deploy(args):
    """Backup live dirs then copy staging → live."""
    if not STAGE_CURSOR.exists() or not any(STAGE_CURSOR.iterdir()):
        print("Staging is empty. Run 'stage' first.")
        sys.exit(1)

    print("Backing up live Cursor dirs...")
    _backup(CURSOR_DIR, "cursor-skills")
    _backup(MDC_DIR,    "cursor-mdc")

    # Copy staging → live (preserve existing non-staged files)
    n_cursor = n_mdc = 0
    for src in sorted(STAGE_CURSOR.iterdir()):
        if not src.is_dir():
            continue
        dst = CURSOR_DIR / src.name
        if not dst.exists():
            shutil.copytree(src, dst)
            n_cursor += 1
        else:
            # Only update SKILL.md if changed
            sp = src / "SKILL.md"
            dp = dst / "SKILL.md"
            if sp.exists() and (not dp.exists() or sp.read_text() != dp.read_text()):
                shutil.copy2(sp, dp)
                n_cursor += 1

    CURSOR_DIR.mkdir(parents=True, exist_ok=True)
    MDC_DIR.mkdir(parents=True, exist_ok=True)
    for src in sorted(STAGE_MDC.glob("*.mdc")):
        dst = MDC_DIR / src.name
        if not dst.exists() or src.read_text() != dst.read_text():
            shutil.copy2(src, dst)
            n_mdc += 1

    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Deploy complete: {n_cursor} cursor-skills, {n_mdc} MDC files")

def cmd_watch(args):
    interval = int(args.interval)
    print(f"Watching {CLAUDE_DIR} every {interval}s (Ctrl-C to stop)...")
    print("Auto-staging only. Run 'deploy' manually to push to live.")
    seen = {}
    while True:
        changed = []
        if CLAUDE_DIR.exists():
            for skill_dir in CLAUDE_DIR.iterdir():
                sm = skill_dir / "SKILL.md"
                if sm.exists():
                    mtime = sm.stat().st_mtime
                    if seen.get(str(sm)) != mtime:
                        seen[str(sm)] = mtime
                        changed.append(skill_dir)
        if changed:
            STAGE_CURSOR.mkdir(parents=True, exist_ok=True)
            STAGE_MDC.mkdir(parents=True, exist_ok=True)
            n_c = n_m = 0
            for skill_dir in changed:
                if claude_to_cursor_skill(skill_dir, STAGE_CURSOR): n_c += 1
                if claude_to_mdc(skill_dir, STAGE_MDC): n_m += 1
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] {len(changed)} changed → staged {n_c} cursor, {n_m} MDC")
        time.sleep(interval)

# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Skill sync tool")
    sub = p.add_subparsers(dest="cmd")

    sub.add_parser("status")
    sub.add_parser("stage")
    deploy_p = sub.add_parser("deploy")
    watch_p  = sub.add_parser("watch")
    watch_p.add_argument("--interval", default=3)

    args = p.parse_args()
    if   args.cmd == "status": cmd_status(args)
    elif args.cmd == "stage":  cmd_stage(args)
    elif args.cmd == "deploy": cmd_deploy(args)
    elif args.cmd == "watch":  cmd_watch(args)
    else: p.print_help()

if __name__ == "__main__":
    main()
