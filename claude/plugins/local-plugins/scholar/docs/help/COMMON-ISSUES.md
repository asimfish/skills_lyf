# Common Issues Index

> **Quick navigation to common problems and solutions**

This index helps you quickly find solutions to frequent issues. For comprehensive troubleshooting, see the full guides linked below.

## Installation & Setup

| Issue | Guide | Section |
|-------|-------|---------|
| Scholar command not found | [Teaching](TROUBLESHOOTING-teaching.md#installation-setup-issues) | Installation |
| Plugin not loading | [Teaching](TROUBLESHOOTING-teaching.md#installation-setup-issues) | Plugin Loading |
| Config file not detected | [Teaching](TROUBLESHOOTING-teaching.md#configuration-problems) | Config Detection |
| API key not set | [Research](TROUBLESHOOTING-research.md#installation-setup-issues) | Authentication |

## Teaching Commands

See [Command Execution](#command-execution) and [Content Quality](#content-quality) sections below for teaching-specific issues.

## Research Commands

See [Research-Specific](#research-specific) section below for research workflow issues.

## Command Execution

| Issue | Guide | Section |
|-------|-------|---------|
| Command not found error | [Teaching](TROUBLESHOOTING-teaching.md#command-execution-errors) | Syntax |
| API authentication failed | [Teaching](TROUBLESHOOTING-teaching.md#command-execution-errors) | API Auth |
| Rate limit errors | [Teaching](TROUBLESHOOTING-teaching.md#command-execution-errors) | Rate Limits |
| Timeout errors | [Teaching](TROUBLESHOOTING-teaching.md#command-execution-errors) | Timeouts |

## Content Quality

| Issue | Guide | Section |
|-------|-------|---------|
| Generated content too generic | [Teaching](TROUBLESHOOTING-teaching.md#content-generation-problems) | Quality |
| Wrong difficulty level | [Teaching](TROUBLESHOOTING-teaching.md#content-generation-problems) | Difficulty |
| Missing question types | [Teaching](TROUBLESHOOTING-teaching.md#content-generation-problems) | Question Types |
| Solution quality issues | [Teaching](TROUBLESHOOTING-teaching.md#content-generation-problems) | Solutions |

## Output Formats

| Issue | Guide | Section |
|-------|-------|---------|
| LaTeX compilation errors | [Teaching](TROUBLESHOOTING-teaching.md#output-format-issues) | LaTeX |
| Quarto rendering failures | [Teaching](TROUBLESHOOTING-teaching.md#output-format-issues) | Quarto |
| Markdown formatting problems | [Teaching](TROUBLESHOOTING-teaching.md#output-format-issues) | Markdown |
| Canvas QTI upload issues | [Teaching](TROUBLESHOOTING-teaching.md#output-format-issues) | Canvas |

## Research-Specific

| Issue | Guide | Section |
|-------|-------|---------|
| arXiv search no results | [Research](TROUBLESHOOTING-research.md#literature-command-issues) | arXiv |
| DOI lookup failures | [Research](TROUBLESHOOTING-research.md#literature-command-issues) | DOI |
| BibTeX parsing errors | [Research](TROUBLESHOOTING-research.md#literature-command-issues) | BibTeX |
| Simulation design unclear | [Research](TROUBLESHOOTING-research.md#simulation-command-issues) | Design |
| Methods section too generic | [Research](TROUBLESHOOTING-research.md#manuscript-command-issues) | Methods |

## Integration

| Issue | Guide | Section |
|-------|-------|---------|
| flow-cli not found | [Teaching](TROUBLESHOOTING-teaching.md#integration-issues) | Flow CLI |
| Git operations failing | [Teaching](TROUBLESHOOTING-teaching.md#integration-issues) | Git |
| GitHub Pages deployment | [Teaching](TROUBLESHOOTING-teaching.md#integration-issues) | Deployment |
| LaTeX/Overleaf integration | [Research](TROUBLESHOOTING-research.md#integration-workflow-issues) | LaTeX |

## Performance

| Issue | Guide | Section |
|-------|-------|---------|
| Generation taking too long | [Teaching](TROUBLESHOOTING-teaching.md#performance-quality) | Speed |
| Poor content quality | [Teaching](TROUBLESHOOTING-teaching.md#performance-quality) | Quality |
| Memory issues | [Teaching](TROUBLESHOOTING-teaching.md#performance-quality) | Memory |

## Command Discovery

| Issue | Solution | Section |
|-------|----------|---------|
| Can't remember command name | Run `/scholar:hub quick` for full listing | [Hub Tutorial](../tutorials/getting-started-with-hub.md) |
| Don't know which commands exist | Run `/scholar:hub` for categorized overview | [Hub Tutorial](../tutorials/getting-started-with-hub.md) |
| Need usage examples for a command | Run `/scholar:hub <command>` for details | [Hub Tutorial](../tutorials/getting-started-with-hub.md) |

## Quick Fixes

### Most Common (Fix in <1 minute)

1. **API Key Not Set**

   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Config Not Found**

   ```bash
   # Create in project root
   mkdir -p .flow
   touch .flow/teach-config.yml
   ```

3. **Wrong Directory**

   ```bash
   cd ~/teaching/my-course
   # Run commands from course root
   ```

## Full Documentation

**Comprehensive Troubleshooting Guides:**

- [Teaching Troubleshooting](TROUBLESHOOTING-teaching.md) - 40+ problems with solutions
- [Research Troubleshooting](TROUBLESHOOTING-research.md) - 27+ problems with solutions

**Frequently Asked Questions:**

- [Teaching FAQ](FAQ-teaching.md) - 60+ Q&A pairs
- [Research FAQ](FAQ-research.md) - 50+ Q&A pairs

**Getting Help:**

- [GitHub Issues](https://github.com/Data-Wise/scholar/issues)
- [GitHub Discussions](https://github.com/Data-Wise/scholar/discussions)

---

**Last Updated**: 2026-01-31
**Purpose**: Quick navigation index for common issues
