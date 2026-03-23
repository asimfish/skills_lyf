# Release Checklist

End-to-end release process for Scholar. Follow every step — skipping one is how broken releases happen.

> **See also:** [Contributing Guide](../CONTRIBUTING.md#release-process) covers the contributor-facing summary. This page is the full maintainer runbook.

---

## Minor / Major Release (vX.Y.0)

### Pre-Release

- [ ] All tests pass: `npm test` (expect 2,630+ tests, 0 failures)
- [ ] Lint clean: `npm run lint`
- [ ] No CI failures on `dev` branch
- [ ] CHANGELOG.md `[Unreleased]` section has all changes listed
- [ ] Documentation builds without warnings: `mkdocs build 2>&1 | grep -i warning`

### Version Bump

Update version in **3 files** (must match exactly):

- [ ] `package.json` → `"version": "X.Y.Z"`
- [ ] `.claude-plugin/plugin.json` → `"version": "X.Y.Z"`
- [ ] `docs/index.md` → version badge URL

```bash
# Verify all three match
grep '"version"' package.json .claude-plugin/plugin.json
grep 'badge.*v[0-9]' docs/index.md
```

- [ ] Rename `[Unreleased]` in CHANGELOG.md to `[vX.Y.Z] - YYYY-MM-DD`
- [ ] Add empty `[Unreleased]` section above
- [ ] Update `.STATUS` file: version, milestone, release history table

### Commit & PR

- [ ] Commit: `chore: bump version to vX.Y.Z`
- [ ] Push to `dev`
- [ ] Create release PR: `gh pr create --base main --head dev --title "Release: vX.Y.Z"`
- [ ] Verify all CI checks pass on the PR

### Release

- [ ] Merge PR to `main`
- [ ] Create GitHub release from `main`:

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z - Short Description" \
  --notes-file RELEASE-NOTES.md \
  --target main
```

### Post-Release

- [ ] Verify Homebrew formula auto-updated (check `homebrew-release.yml` run)
- [ ] Verify docs deployed to GitHub Pages (check `docs.yml` run)
- [ ] Update `.STATUS` file with session summary
- [ ] Verify release: `brew upgrade scholar && scholar --version`
- [ ] Update CLAUDE.md if command counts, test counts, or version changed
- [ ] Test fresh install: `brew install data-wise/tap/scholar`

---

## Patch Release (vX.Y.Z where Z > 0)

Abbreviated process for bug fixes and doc-only changes.

- [ ] All tests pass
- [ ] Version bump in 3 files
- [ ] CHANGELOG.md updated
- [ ] Commit: `chore: bump version to vX.Y.Z`
- [ ] Push to `dev`, create PR to `main`, merge
- [ ] `gh release create vX.Y.Z --target main --title "vX.Y.Z - Fix description"`
- [ ] Verify Homebrew auto-update
- [ ] Verify docs deploy

---

## Common Pitfalls

| Problem | Prevention |
|---------|-----------|
| Version mismatch between files | Always grep all 3 files after bump |
| Homebrew SHA mismatch | Wait for release tarball to be available before formula runs |
| Docs deploy fails | Check `mkdocs build` locally first |
| CI red on `main` after merge | Run full test suite on `dev` before PR |
| Missing CHANGELOG entry | Review git log since last release: `git log v2.5.0..HEAD --oneline` |
