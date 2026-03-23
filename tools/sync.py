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

def cmd_deploy(targets: list, merge: bool = False):
    """Backup live dirs then copy staging → live.
    merge=True: only add skills not already present (never overwrite).
    """
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

    mode_label = "merge (add-only)" if merge else "overwrite"
    print(f"Deploying [{mode_label}]...")
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
                    if merge and dst.exists():
                        continue
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
                    if merge and (dst.exists() or dst.is_symlink()):
                        continue
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

# ── Security patterns ────────────────────────────────────────────────────────
_SECURITY_PATTERNS = [
    (r'(?i)(api[_-]?key|secret|password|token|credential)\s*[:=]\s*[\'"`][^\'"`]{6,}', "hardcoded secret"),
    (r'(?i)\b(eval|exec)\s*\(', "dynamic code execution"),
    (r'(?i)subprocess\.call.*shell\s*=\s*True', "shell=True subprocess"),
    (r'(?i)' + 'os\.system' + r'\s*\(', "os.system call"),
    (r'(?i)rm\s+-rf\s+/', "destructive rm -rf /"),
    (r'(?i)curl\s+.*\|\s*(ba)?sh', "curl-pipe-shell"),
    (r'(?i)wget\s+.*-O\s*-.*\|\s*(ba)?sh', "wget-pipe-shell"),
    (r'(?i)DROP\s+TABLE|DELETE\s+FROM\s+\w+\s*;', "destructive SQL"),
]

def _check_security(skill_dir: Path) -> list:
    """Return list of security issue descriptions found in skill files."""
    issues = []
    for f in skill_dir.rglob("*"):
        if not f.is_file():
            continue
        if f.suffix not in (".md", ".py", ".sh", ".txt", ".json", ".toml"):
            continue
        try:
            text = f.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern, label in _SECURITY_PATTERNS:
            if re.search(pattern, text):
                issues.append(f"{f.name}: {label}")
    return issues

# ── Tool suitability heuristics ───────────────────────────────────────────────
_CATEGORIES = {
    "ML/AI":        ["torch", "pytorch", "tensorflow", "jax", "vllm", "llm", "transformer", "diffusion", "rlhf", "fine-tun", "training", "inference", "cuda", "gpu"],
    "Research":     ["arxiv", "paper", "literature", "review", "survey", "research", "experiment", "ablation"],
    "Backend":      ["django", "fastapi", "flask", "api", "rest", "graphql", "database", "postgres", "sql", "redis"],
    "Frontend":     ["react", "vue", "svelte", "css", "html", "typescript", "javascript", "webpack", "vite"],
    "DevOps":       ["docker", "kubernetes", "ci/cd", "github actions", "deploy", "terraform", "ansible"],
    "Security":     ["auth", "oauth", "jwt", "security", "pentest", "vulnerability", "encryption", "ssl"],
    "Data Science": ["pandas", "numpy", "sklearn", "scipy", "matplotlib", "seaborn", "notebook", "jupyter"],
    "Writing":      ["article", "blog", "content", "writing", "academic", "paper", "manuscript"],
    "Productivity": ["task", "workflow", "schedule", "reminder", "meeting", "email", "slack"],
}

def _categorize(meta: dict, body: str) -> str:
    haystack = (" ".join(str(v) for v in meta.values()) + " " + body[:500]).lower()
    for cat, keywords in _CATEGORIES.items():
        if any(kw in haystack for kw in keywords):
            return cat
    return "General"

def _tool_suitability(meta: dict, body: str) -> dict:
    allowed_tools = meta.get("allowed-tools", "")
    has_bash  = "Bash" in allowed_tools or "bash" in body.lower()
    has_mcp   = "mcp__" in allowed_tools or "mcp__" in body
    desc_len  = len(meta.get("description", ""))
    body_len  = len(body)
    ratings = {}
    ratings["codex"]    = "Good" if has_bash or has_mcp else ("OK" if body_len > 200 else "Poor")
    ratings["cursor"]   = "Poor" if has_mcp else ("Good" if not has_bash and body_len > 100 else "OK")
    ratings["mdc"]      = "Good" if desc_len > 20 and body_len < 3000 else ("OK" if body_len < 6000 else "Poor")
    ratings["openclaw"] = "Good" if "## Instructions" in body or "## " in body else "OK"
    return ratings

def cmd_audit(output_json: bool = False):
    """Summarise, categorise, rate suitability, and flag security issues for all Claude skills."""
    if not CLAUDE_DIR.exists():
        print(f"Claude skills dir not found: {CLAUDE_DIR}")
        return

    from collections import defaultdict
    results = []
    for d in sorted(CLAUDE_DIR.iterdir()):
        if not d.is_dir():
            continue
        sk = d / "SKILL.md"
        if not sk.exists():
            continue
        text = sk.read_text(encoding="utf-8", errors="ignore")
        meta, body = parse_frontmatter(text)
        name     = meta.get("name") or d.name
        desc     = meta.get("description", "")[:80]
        category = _categorize(meta, body)
        ratings  = _tool_suitability(meta, body)
        issues   = _check_security(d)
        results.append({"dir": d.name, "name": name, "desc": desc,
                        "category": category, "ratings": ratings, "issues": issues})

    if output_json:
        print(json.dumps(results, ensure_ascii=False, indent=2))
        return

    by_cat = defaultdict(list)
    for r in results:
        by_cat[r["category"]].append(r)

    total_issues = sum(len(r["issues"]) for r in results)
    print(f"\n{'='*70}")
    print(f"  SKILL AUDIT — {len(results)} skills, {total_issues} security flags")
    print(f"{'='*70}")
    for cat in sorted(by_cat):
        skills = by_cat[cat]
        print(f"\n[{cat}] ({len(skills)} skills)")
        print(f"  {'Name':<35} {'Codex':>5} {'Cursor':>6} {'MDC':>4} {'OpenClaw':>8}  Issues")
        print(f"  {'-'*35} {'-'*5} {'-'*6} {'-'*4} {'-'*8}  ------")
        for r in skills:
            rt  = r["ratings"]
            iss = ", ".join(r["issues"]) if r["issues"] else ""
            flag = "  *" if iss else ""
            print(f"  {r['name']:<35} {rt['codex']:>5} {rt['cursor']:>6} {rt['mdc']:>4} {rt['openclaw']:>8}{flag}")
            if iss:
                print(f"    {'':35}  -> {iss}")
    print(f"\nRating key: Good = recommended  OK = usable  Poor = not ideal")
    if total_issues:
        print(f"  {total_issues} security flag(s) found — excluded from 'pack'")

def cmd_pack(out_path, fmt: str = "claude"):
    """Bundle safe, non-duplicate skills into a distributable zip.
    fmt: 'claude' (raw), 'cursor' (simplified frontmatter), 'mdc' (.mdc files)
    """
    import zipfile, tempfile

    if not CLAUDE_DIR.exists():
        print(f"Claude skills dir not found: {CLAUDE_DIR}")
        return

    # Deduplicate by frontmatter name (keep first by dir sort order)
    name_to_dir = {}
    for d in sorted(CLAUDE_DIR.iterdir()):
        if not d.is_dir():
            continue
        sk = d / "SKILL.md"
        if not sk.exists():
            continue
        text = sk.read_text(encoding="utf-8", errors="ignore")
        meta, _ = parse_frontmatter(text)
        canonical = meta.get("name") or d.name
        if canonical not in name_to_dir:
            name_to_dir[canonical] = d

    safe, flagged = [], []
    for name, d in sorted(name_to_dir.items()):
        issues = _check_security(d)
        if issues:
            flagged.append((name, issues))
        else:
            safe.append((name, d))

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fmt_label = f"-{fmt}" if fmt != "claude" else ""
    zip_path = Path(out_path) if out_path else REPO / f"skills-pack{fmt_label}-{ts}.zip"

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        if fmt == "cursor":
            # Convert each safe skill to Cursor format in a temp dir, then zip
            with tempfile.TemporaryDirectory() as tmp:
                tmp_dir = Path(tmp)
                for name, d in safe:
                    claude_to_cursor(d, tmp_dir)
                # tmp_dir now has skill-name subdirs
                for skill_dir in tmp_dir.iterdir():
                    if skill_dir.is_dir():
                        for f in skill_dir.rglob("*"):
                            if f.is_file():
                                arcname = f"skills-cursor/{skill_dir.name}/{f.relative_to(skill_dir)}"
                                zf.write(f, arcname)
        elif fmt == "mdc":
            with tempfile.TemporaryDirectory() as tmp:
                tmp_dir = Path(tmp)
                for name, d in safe:
                    claude_to_mdc(d, tmp_dir)
                for f in tmp_dir.iterdir():
                    if f.suffix == ".mdc":
                        zf.write(f, f"rules/skills/{f.name}")
        else:  # claude raw
            for name, d in safe:
                for f in d.rglob("*"):
                    if f.is_file():
                        arcname = f"skills/{d.name}/{f.relative_to(d)}"
                        zf.write(f, arcname)

    print(f"Pack complete: {zip_path}")
    print(f"  Format   : {fmt}")
    print(f"  Included : {len(safe)} skills")
    print(f"  Excluded : {len(flagged)} skills (security flags)")
    if flagged:
        print("  Flagged skills:")
        for name, issues in flagged:
            print(f"    {name}: {', '.join(issues)}")

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
    dp.add_argument("--merge", action="store_true",
        help="Add-only: skip skills already present in live (never overwrite)")

    wp = sub.add_parser("watch", help="Auto-stage on Claude skill changes")
    wp.add_argument("--interval", type=int, default=5, help="Poll interval seconds (default: 5)")

    ap = sub.add_parser("audit", help="Categorise skills, rate tool suitability, flag security issues")
    ap.add_argument("--json", action="store_true", dest="output_json", help="Output as JSON")

    pp = sub.add_parser("pack", help="Bundle safe non-duplicate skills into a zip")
    pp.add_argument("--out", default=None, help="Output zip path (default: repo root)")

    args = p.parse_args()
    if args.cmd == "status":        cmd_status()
    elif args.cmd == "import":      cmd_import()
    elif args.cmd == "stage":       cmd_stage()
    elif args.cmd == "deploy":      cmd_deploy(getattr(args, "targets", []), merge=getattr(args, "merge", False))
    elif args.cmd == "watch":       cmd_watch(args.interval)
    elif args.cmd == "audit":       cmd_audit(output_json=getattr(args, "output_json", False))
    elif args.cmd == "pack":        cmd_pack(getattr(args, "out", None))
    else:
        p.print_help()

if __name__ == "__main__":
    main()
