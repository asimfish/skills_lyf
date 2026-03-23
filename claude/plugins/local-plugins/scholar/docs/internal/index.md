# Internal Documentation

Maintainer-facing documentation for the Scholar plugin. These pages cover release processes, architectural decisions, authoring conventions, and CI/CD pipelines that don't belong in the user-facing docs.

## Who This Is For

- **Core maintainers** making releases, authoring schemas, or modifying CI
- **Contributors** who want to understand project conventions beyond code style
- **Future you** — decisions and processes that are easy to forget

## Contents

| Document | Purpose |
|----------|---------|
| [Release Checklist](release-checklist.md) | End-to-end release runbook with checklist |
| [Decision Log](decision-log.md) | Architecture Decision Records (ADRs) |
| [Session Conventions](session-conventions.md) | `.STATUS` file format and session notes |
| [Prompt Authoring](prompt-authoring.md) | Writing and maintaining prompt templates |
| [Schema & Template Conventions](schema-conventions.md) | JSON Schema and template authoring rules |
| [CI/CD Pipeline](ci-pipeline.md) | GitHub Actions workflows and troubleshooting |
| [Insights Report (Feb 2026)](insights-2026-02.md) | Session analysis driving v2.15.0 enhancements |

## Relationship to User-Facing Docs

These internal docs complement — but do not duplicate — the public documentation:

| Topic | User-Facing Doc | Internal Doc |
|-------|----------------|--------------|
| Git workflow | [Contributing Guide](../CONTRIBUTING.md) | — |
| Code style | [Contributing Guide](../CONTRIBUTING.md) | — |
| Testing | [Testing Guide](../TESTING-GUIDE.md) | — |
| Adding commands | [Contributing Guide](../CONTRIBUTING.md) | — |
| Architecture | [Architecture](../ARCHITECTURE.md) | [Decision Log](decision-log.md) |
| Prompt customization | [Prompt Customization Guide](../PROMPT-CUSTOMIZATION-GUIDE.md) | [Prompt Authoring](prompt-authoring.md) |
| Schemas (usage) | [Configuration Reference](../CONFIGURATION.md) | [Schema Conventions](schema-conventions.md) |
| CI (setup) | [GitHub Actions Setup](../github-actions-setup.md) | [CI/CD Pipeline](ci-pipeline.md) |
| Releases | [Contributing Guide](../CONTRIBUTING.md#release-process) | [Release Checklist](release-checklist.md) |

When in doubt: user-facing docs explain **how to use** Scholar; internal docs explain **how to maintain** it.
