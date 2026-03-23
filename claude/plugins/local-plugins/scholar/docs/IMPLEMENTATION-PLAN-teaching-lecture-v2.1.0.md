# Implementation Plan: /teaching:lecture Command (v2.1.0)

**Created:** 2026-01-14
**Target Release:** Scholar v2.1.0
**Estimated Effort:** 28-40 hours (3-4 weeks)

---

## Worktree-Based Development Strategy

**Philosophy:** Each phase gets an isolated worktree, enabling parallel development and clean PR reviews. The `dev` branch serves as the integration hub and project control center.

---

## Branch Architecture

```
main (production)
  ↑ PR merge (release)
dev (integration hub) ─────────────────────────────────────
  │
  ├─→ feature/lecture-phase1-skeleton    [Worktree 1]
  │     └─ Command skeleton + JSON template
  │
  ├─→ feature/lecture-phase2-generator   [Worktree 2]
  │     └─ Core generator + Quarto formatter
  │
  └─→ feature/lecture-phase3-integration [Worktree 3]
        └─ 4-layer style + lesson plan + tests
```

---

## Phase 1: Command Skeleton (4-6 hours)

**Branch:** `feature/lecture-phase1-skeleton`
**Worktree:** `~/.git-worktrees/scholar-lecture-phase1`

### Deliverables (Phase 1 Command)

```
src/
├── plugin-api/commands/teaching/
│   └── lecture.md              # Command definition
└── teaching/
    └── templates/
        └── lecture-notes.json  # JSON Schema template
```

### Tasks (Phase 1 Command)

1. Create command skeleton with argument parsing
2. Define JSON Schema for lecture notes structure
3. Implement `--dry-run` outline generation (no AI)
4. Add command to plugin registry
5. Update docs/REFCARD.md

### Setup Commands (Phase 1 Command)

```bash
# From dev branch
git worktree add ~/.git-worktrees/scholar-lecture-phase1 -b feature/lecture-phase1-skeleton
cd ~/.git-worktrees/scholar-lecture-phase1

# Work here...
# When complete:
git push -u origin feature/lecture-phase1-skeleton
gh pr create --base dev --title "feat: /teaching:lecture Phase 1 - Command Skeleton"
```

### Exit Criteria (When complete)

- [ ] `/teaching:lecture "topic" --dry-run` shows outline
- [ ] JSON Schema validates sample lecture structure
- [ ] Command appears in `/help teaching`

---

## Phase 2: Core Generator (10-14 hours)

**Branch:** `feature/lecture-phase2-generator`
**Worktree:** `~/.git-worktrees/scholar-lecture-phase2`
**Depends on:** Phase 1 merged to dev

### Deliverables (Phase 2 Core)

```
src/teaching/
├── generators/
│   └── lecture-notes.js        # Section-by-section generator
├── formatters/
│   └── quarto-lecture.js       # Quarto document formatter
└── ai/
    └── lecture-prompts.js      # AI prompt templates
```

### Tasks (Phase 2 Core)

1. Implement section-by-section generation strategy
2. Build continuity context between sections
3. Create Quarto formatter with multi-format output
4. Add progress reporting during generation
5. Implement caching for failure recovery

### Setup Commands (Phase 2 Core)

```bash
# After Phase 1 PR merged to dev
git fetch origin
git checkout dev && git pull
git worktree add ~/.git-worktrees/scholar-lecture-phase2 -b feature/lecture-phase2-generator
cd ~/.git-worktrees/scholar-lecture-phase2
```

### Exit Criteria (After Phase 1)

- [ ] `/teaching:lecture "Multiple Regression"` generates full notes
- [ ] Output compiles with `quarto render`
- [ ] HTML, PDF, DOCX all render correctly
- [ ] Progress bar shows during generation

---

## Phase 3: Integration & Polish (8-12 hours)

**Branch:** `feature/lecture-phase3-integration`
**Worktree:** `~/.git-worktrees/scholar-lecture-phase3`
**Depends on:** Phase 2 merged to dev

### Deliverables (Phase 3 Integration)

```
src/teaching/
├── config/
│   └── style-loader.js         # 4-layer teaching style
├── utils/
│   └── lesson-plan-loader.js   # -from-plan support
└── validators/
    └── plan-coverage.js        # Validate against plan

tests/teaching/
└── lecture/
    ├── lecture.test.js         # Unit tests
    └── integration.test.js     # E2E tests
```

### Tasks (Phase 3 Integration)

1. Implement 4-layer style loader (Global → Course → Command → Lesson)
2. Add `--from-plan=weekNN` lesson plan integration
3. Validate generated content against lesson plan
4. Write comprehensive test suite
5. Update documentation (API-REFERENCE.md, USER-GUIDE.md)

### Setup Commands (Phase 3 Integration)

```bash
# After Phase 2 PR merged to dev
git fetch origin
git checkout dev && git pull
git worktree add ~/.git-worktrees/scholar-lecture-phase3 -b feature/lecture-phase3-integration
cd ~/.git-worktrees/scholar-lecture-phase3
```

### Exit Criteria (After Phase 2)

- [ ] Teaching style affects generated content
- [ ] `--from-plan=week03` uses lesson plan objectives
- [ ] All tests pass (target: 30+ new tests)
- [ ] Documentation complete

---

## Dev Branch as Control Center

### Track progress on dev with PR milestones

```bash
# View all lecture-related branches
git branch -a | grep lecture

# Check worktree status
git worktree list

# View open PRs
gh pr list --state open
```

### Merge Sequence

1. Phase 1 PR → dev (review + merge)
2. Phase 2 PR → dev (after Phase 1 complete)
3. Phase 3 PR → dev (after Phase 2 complete)
4. dev → main (v2.1.0 release PR)

### Progress Tracking

| Phase   | PR Created | Reviewed | Merged | Notes               |
| ------- | ---------- | -------- | ------ | ------------------- |
| Phase 1 | [ ]        | [ ]      | [ ]    | Command skeleton    |
| Phase 2 | [ ]        | [ ]      | [ ]    | Core generator      |
| Phase 3 | [ ]        | [ ]      | [ ]    | Integration + tests |
| Release | [ ]        | [ ]      | [ ]    | v2.1.0 to main      |

---

## Worktree Cleanup Protocol

After each phase merges:

```bash
# Remove worktree
git worktree remove ~/.git-worktrees/scholar-lecture-phase1

# Delete local branch (after PR merged)
git branch -d feature/lecture-phase1-skeleton

# Prune stale worktree references
git worktree prune
```

---

## Timeline

| Phase       | Duration      | Dependencies   | Deliverables          |
| ----------- | ------------- | -------------- | --------------------- |
| **Phase 1** | 4-6 hrs       | None           | Command + Template    |
| **Phase 2** | 10-14 hrs     | Phase 1 merged | Generator + Formatter |
| **Phase 3** | 8-12 hrs      | Phase 2 merged | Integration + Tests   |
| **Total**   | **22-32 hrs** |                | v2.1.0 release        |

**Parallel work opportunity:** While waiting for PR review, can start planning/researching next phase.

---

## Quick Reference

### Start Phase 1

```bash
cd ~/projects/dev-tools/scholar
git checkout dev && git pull
git worktree add ~/.git-worktrees/scholar-lecture-phase1 -b feature/lecture-phase1-skeleton
cd ~/.git-worktrees/scholar-lecture-phase1
```

### Complete Phase (any)

```bash
# Commit changes
git add . && git commit -m "feat(lecture): description"

# Push and create PR
git push -u origin feature/lecture-phaseN-name
gh pr create --base dev --title "feat: /teaching:lecture Phase N - Description"
```

### After PR Merged

```bash
# Cleanup
git worktree remove ~/.git-worktrees/scholar-lecture-phaseN
git branch -d feature/lecture-phaseN-name
git worktree prune
```

---

## Related Documents

- Planning documents archived (see git history)
