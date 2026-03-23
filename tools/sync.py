#!/usr/bin/env python3
"""skill sync tool — Claude Code is canonical source of truth.

Supported tools:
  claude   ~/.claude/skills/NAME/SKILL.md   (canonical)
  codex    ~/.codex/skills/NAME/SKILL.md    (identical format, bidirectional)
  cursor   ~/.cursor/skills-cursor/NAME/SKILL.md  (simplified frontmatter)
  mdc      ~/.cursor/rules/NAME.mdc         (globs/alwaysApply format)
  openclaw clawd/skills/NAME/SKILL.md       (description-as-instructions format)

Commands:
  status          show skill counts across all tools
  stage           convert claude → staging/ (SAFE, never touches live)
  deploy          backup live dirs, copy staging → live
  watch           poll claude dir, auto-stage on changes (no auto-deploy)
"""
import argparse, json, re, shutil, sys, textwrap, time
from datetime import datetime
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
REPO         = Path(__file__).resolve().parent.parent
STAGE        = REPO / "staging"

CLAUDE_DIR   = Path.home() / ".claude" / "skills"
CODEX_DIR    = Path.home() / ".codex" / "skills"
CURSOR_DIR   = Path.home() / ".cursor" / "skills-cursor"
MDC_DIR      = Path.home() / ".cursor" / "rules" / "skills"
OPENCLAW_DIR = Path.home() / "clawd" / "skills"

STAGE_CODEX    = STAGE / "codex-skills"
STAGE_CURSOR   = STAGE / "cursor-skills"
STAGE_MDC      = STAGE / "cursor-mdc"
STAGE_OPENCLAW = STAGE / "openclaw-skills"

# ── Frontmatter helpers ───────────────────────────────────────────────────────
def parse_frontmatter(text: str):
    """Returns (meta_dict, body_str). meta values are raw strings."""
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

def write_if_changed(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists() or path.read_text(encoding="utf-8") != content:
        path.write_text(content, encoding="utf-8")
        return True
    return False

# ── Claude → Codex (identical format, just copy) ─────────────────────────────
def claude_to_codex(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    dst = dst_dir / src_dir.name
    dst.mkdir(parents=True, exist_ok=True)
    # Copy all files/dirs in skill dir
    changed = False
    for f in src_dir.iterdir():
        d = dst / f.name
        if f.is_dir():
            if not d.exists():
                shutil.copytree(f, d)
                changed = True
        elif f.suffix in (".md", ".txt", ".sh", ".py", ".toml", ".json"):
            if write_if_changed(d, f.read_text(encoding="utf-8")):
                changed = True
        elif not d.exists():
            shutil.copy2(f, d)
            changed = True
    return changed

# ── Codex → Claude (only new skills not in Claude) ───────────────────────────
def codex_to_claude(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    dst_skill = dst_dir / src_dir.name / "SKILL.md"
    if dst_skill.exists():
        return False  # Claude is source of truth
    dst = dst_dir / src_dir.name
    dst.mkdir(parents=True, exist_ok=True)
    for f in src_dir.iterdir():
        if f.is_dir():
            shutil.copytree(f, dst / f.name)
        else:
            shutil.copy2(f, dst / f.name)
    return True

# ── Claude → Cursor skill ─────────────────────────────────────────────────────
def claude_to_cursor(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name") or src_dir.name
    out_meta = {"name": name}
    if meta.get("description"):
        out_meta["description"] = meta["description"]
    new_text = build_frontmatter(out_meta) + "\n" + body
    return write_if_changed(dst_dir / name / "SKILL.md", new_text)

# ── Claude → Cursor MDC ───────────────────────────────────────────────────────
def claude_to_mdc(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name") or src_dir.name
    desc = meta.get("description", "")
    # Truncate description for MDC (single line)
    short_desc = desc[:120] + "..." if len(desc) > 120 else desc
    out_meta = {
        "description": short_desc,
        "globs": "",
        "alwaysApply": "false",
    }
    new_text = build_frontmatter(out_meta) + "\n" + body
    return write_if_changed(dst_dir / f"{name}.mdc", new_text)

# ── Claude → OpenClaw ─────────────────────────────────────────────────────────
def claude_to_openclaw(src_dir: Path, dst_dir: Path) -> bool:
    """Convert Claude skill to OpenClaw format.
    OpenClaw uses description field as short summary;
    full instructions go in body under ## Instructions.
    """
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name") or src_dir.name
    desc = meta.get("description", "")
    # Short description (first sentence or 120 chars)
    short = desc.split("。")[0].split(". ")[0]
    short = short[:120] if len(short) > 120 else short

    out_meta = {"name": name, "description": short}
    # Ensure body has ## Instructions section
    if "## Instructions" not in body and "## " in body:
        new_body = body  # keep original structure
    elif "## Instructions" not in body:
        new_body = "## Instructions\n\n" + body
    else:
        new_body = body

    new_text = build_frontmatter(out_meta) + "\n" + new_body
    return write_if_changed(dst_dir / name / "SKILL.md", new_text)

# ── OpenClaw → Claude (only new skills) ──────────────────────────────────────
def openclaw_to_claude(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    dst_skill = dst_dir / src_dir.name / "SKILL.md"
    if dst_skill.exists():
        return False  # Claude is source of truth
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name") or src_dir.name
    desc = meta.get("description", "")
    # description in OpenClaw can be very long; take first sentence as Claude description
    short = desc.split("。")[0].split(". ")[0]
    short = short[:200] if len(short) > 200 else short
    out_meta = {"name": name, "origin": "openclaw-migration"}
    if short:
        out_meta["description"] = short
    dst_dir2 = dst_dir / name
    dst_dir2.mkdir(parents=True, exist_ok=True)
    write_if_changed(dst_dir2 / "SKILL.md",
        build_frontmatter(out_meta) + "\n" + body)
    return True

# ── Cursor skill → Claude (only new) ─────────────────────────────────────────
def cursor_to_claude(src_dir: Path, dst_dir: Path) -> bool:
    skill_md = src_dir / "SKILL.md"
    if not skill_md.exists():
        return False
    text = skill_md.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(text)
    name = meta.get("name") or src_dir.name
    dst_skill = dst_dir / name / "SKILL.md"
    if dst_skill.exists():
        return False
    out_meta = {"name": name, "origin": "cursor-migration"}
    if meta.get("description"):
        out_meta["description"] = meta["description"]
    dst2 = dst_dir / name
    dst2.mkdir(parents=True, exist_ok=True)
    write_if_changed(dst2 / "SKILL.md",
        build_frontmatter(out_meta) + "\n" + body)
    return True

# ── Batch helpers ──────────────────────────────────────────────────────────────
def batch(src_dir: Path, dst_dir: Path, fn) -> int:
    if not src_dir.exists():
        return 0
    n = 0
    for d in src_dir.iterdir():
        if d.is_dir() and fn(d, dst_dir):
            n += 1
    return n

def batch_mdc(src_dir: Path, dst_dir: Path) -> int:
    if not src_dir.exists():
        return 0
    n = 0
    for d in src_dir.iterdir():
        if d.is_dir() and claude_to_mdc(d, dst_dir):
            n += 1
    return n

# ── Commands ──────────────────────────────────────────────────────────────────
def cmd_status():
    def count_skills(d: Path) -> int:
        if not d.exists(): return 0
        return sum(1 for x in d.iterdir() if x.is_dir() and (x / "SKILL.md").exists())
    def count_mdc(d: Path) -> int:
        if not d.exists(): return 0
        return sum(1 for x in d.iterdir() if x.suffix == ".mdc")
    print(f"Claude skills (live)   : {count_skills(CLAUDE_DIR)}")
    print(f"Codex skills (live)    : {count_skills(CODEX_DIR)}")
    print(f"Cursor skills (live)   : {count_skills(CURSOR_DIR)}")
    print(f"MDC rules (live)       : {count_mdc(MDC_DIR)}")
    print(f"OpenClaw skills (live) : {count_skills(OPENCLAW_DIR)}")
    print(f"Staging codex          : {count_skills(STAGE_CODEX)}")
    print(f"Staging cursor         : {count_skills(STAGE_CURSOR)}")
    print(f"Staging MDC            : {count_mdc(STAGE_MDC)}")
    print(f"Staging openclaw       : {count_skills(STAGE_OPENCLAW)}")

def cmd_import():
    """Import new skills from Codex/Cursor/OpenClaw into Claude (never overwrites)."""
    c2cl = batch(CODEX_DIR, CLAUDE_DIR, codex_to_claude)
    cur2cl = batch(CURSOR_DIR, CLAUDE_DIR, cursor_to_claude)
    oc2cl = batch(OPENCLAW_DIR, CLAUDE_DIR, openclaw_to_claude)
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Import to Claude complete:")
    print(f"  codex→claude    : {c2cl} new skills")
    print(f"  cursor→claude   : {cur2cl} new skills")
    print(f"  openclaw→claude : {oc2cl} new skills")
    if c2cl + cur2cl + oc2cl == 0:
        print("  (nothing new — Claude already has all skills)")

def cmd_stage():
    """Convert Claude skills to all target formats in staging/. Never touches live."""
    STAGE_CODEX.mkdir(parents=True, exist_ok=True)
    STAGE_CURSOR.mkdir(parents=True, exist_ok=True)
    STAGE_MDC.mkdir(parents=True, exist_ok=True)
    STAGE_OPENCLAW.mkdir(parents=True, exist_ok=True)

    n_codex   = batch(CLAUDE_DIR, STAGE_CODEX,    claude_to_codex)
    n_cursor  = batch(CLAUDE_DIR, STAGE_CURSOR,   claude_to_cursor)
    n_mdc     = batch_mdc(CLAUDE_DIR, STAGE_MDC)
    n_openclaw = batch(CLAUDE_DIR, STAGE_OPENCLAW, claude_to_openclaw)

    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Stage complete (nothing written to live dirs):")
    print(f"  claude→codex    : {n_codex}")
    print(f"  claude→cursor   : {n_cursor}")
    print(f"  claude→mdc      : {n_mdc}")
    print(f"  claude→openclaw : {n_openclaw}")
    print(f"  staging dirs    : {STAGE}")
    print(f"  (run 'deploy' to push to live)")

def cmd_deploy(targets: list):
    """Backup live dirs then copy staging → live."""
    all_targets = ["codex", "cursor", "mdc", "openclaw"]
    if not targets:
        targets = all_targets

    ts_label = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_base = STAGE / "backups" / ts_label

    deploy_map = {
        "codex":    (STAGE_CODEX,    CODEX_DIR),
        "cursor":   (STAGE_CURSOR,   CURSOR_DIR),
        "mdc":      (STAGE_MDC,      MDC_DIR),
        "openclaw": (STAGE_OPENCLAW, OPENCLAW_DIR),
    }

    print("Backing up live dirs...")
    for t in targets:
        stage_src, live_dst = deploy_map[t]
        if not stage_src.exists():
            print(f"  [skip] staging/{t} not found, run 'stage' first")
            continue
        if live_dst.exists():
            bk = backup_base / t
            shutil.copytree(live_dst, bk)
            print(f"  Backed up {live_dst} → {bk}")

    print("Deploying...")
    counts = {}
    for t in targets:
        stage_src, live_dst = deploy_map[t]
        if not stage_src.exists():
            counts[t] = 0
            continue
        if t == "mdc":
            live_dst.mkdir(parents=True, exist_ok=True)
            n = 0
            for f in stage_src.iterdir():
                if f.suffix == ".mdc":
                    dst = live_dst / f.name
                    content = f.read_text(encoding="utf-8")
                    if write_if_changed(dst, content):
                        n += 1
            counts[t] = n
        else:
            live_dst.mkdir(parents=True, exist_ok=True)
            n = 0
            for d in stage_src.iterdir():
                if d.is_dir():
                    dst = live_dst / d.name
                    if dst.is_symlink():
                        dst.unlink()
                    elif dst.exists():
                        shutil.rmtree(dst)
                    shutil.copytree(d, dst)
                    n += 1
            counts[t] = n

    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] Deploy complete:")
    for t, n in counts.items():
        print(f"  {t:10s}: {n} skills/files")
    print(f"  backup at: {backup_base}")

def cmd_watch(interval: int):
    """Poll Claude dir; auto-stage when changes detected."""
    print(f"Watching {CLAUDE_DIR} every {interval}s (Ctrl-C to stop)...")
    print("Note: auto-stage only. Run 'deploy' manually to push to live.")
    last_snapshot = {}

    def snapshot():
        s = {}
        if not CLAUDE_DIR.exists():
            return s
        for d in CLAUDE_DIR.iterdir():
            sm = d / "SKILL.md"
            if sm.exists():
                s[d.name] = sm.stat().st_mtime
        return s

    last_snapshot = snapshot()
    while True:
        time.sleep(interval)
        cur = snapshot()
        added   = [k for k in cur if k not in last_snapshot]
        changed = [k for k in cur if k in last_snapshot and cur[k] != last_snapshot[k]]
        removed = [k for k in last_snapshot if k not in cur]
        if added or changed or removed:
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] Changes detected: +{len(added)} ~{len(changed)} -{len(removed)}")
            cmd_stage()
        last_snapshot = cur

# ── CLI ───────────────────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(description="Skill sync: Claude ↔ Codex / Cursor / MDC / OpenClaw")
    sub = p.add_subparsers(dest="cmd")

    sub.add_parser("status",  help="Show skill counts across all tools")
    sub.add_parser("import",  help="Import new skills from Codex/Cursor/OpenClaw into Claude")
    sub.add_parser("stage",   help="Convert Claude → staging/ (safe, no live changes)")

    dp = sub.add_parser("deploy", help="Backup + deploy staging → live")
    dp.add_argument("targets", nargs="*",
        metavar="{codex,cursor,mdc,openclaw}",
        help="Which tools to deploy (default: all)")

    wp = sub.add_parser("watch", help="Auto-stage on Claude skill changes")
    wp.add_argument("--interval", type=int, default=5, help="Poll interval seconds (default: 5)")

    args = p.parse_args()
    if args.cmd == "status":        cmd_status()
    elif args.cmd == "import":      cmd_import()
    elif args.cmd == "stage":       cmd_stage()
    elif args.cmd == "deploy":      cmd_deploy(getattr(args, "targets", []))
    elif args.cmd == "watch":       cmd_watch(args.interval)
    else:
        p.print_help()

if __name__ == "__main__":
    main()
