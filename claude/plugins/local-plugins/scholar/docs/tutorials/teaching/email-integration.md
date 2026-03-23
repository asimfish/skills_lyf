# Tutorial: Email Integration

**Time:** 10 minutes
**Prerequisites:**

- Scholar plugin installed ({{ scholar.version }}+)
- Claude Code running with ANTHROPIC_API_KEY set
- Himalaya MCP configured in Claude Code (email provider connected)
- A course with `teach-config.yml` (optional, for default recipients)

**What you'll learn:**

- Send generated content directly to TAs or students with `--send`
- Use explicit email addresses or config-based defaults
- Configure `course.staff.ta_email` in teach-config.yml
- Understand which commands support `--send`
- Preview emails before sending
- Troubleshoot email delivery issues

---

## Overview

The `--send` flag adds email delivery to content-generating commands. After Scholar generates a solution key, assignment, or rubric, `--send` composes an email with the content attached and sends it via the himalaya MCP — all without leaving Claude Code.

**Why use `--send`?**

- Eliminates the copy-paste-email workflow for distributing materials to TAs
- Keeps generated content and delivery in a single step
- Subject lines and formatting are handled automatically
- Recipient defaults can be configured once in teach-config.yml

**What you'll get:**

```
/teaching:solution "HW3" --send ta@university.edu

  Generated: solutions/hw3-solution.qmd
  Composing email...
    To: ta@university.edu
    Subject: [STAT 301] Solution Key: HW3
    Attachment: hw3-solution.qmd

  Email sent successfully.
```

---

## Step 1: Send with an Explicit Email Address

**What to do:**

Add `--send` followed by the recipient's email address to any supported command.

**Example:**

```bash
/teaching:solution "HW3 Solution Key" --send ta@university.edu
```

**What happens:**

1. Scholar generates the solution content via AI
2. The file is saved to disk
3. An email is composed with the file as an attachment
4. The email is sent via himalaya MCP
5. Confirmation is displayed

**Sample output:**

```
  Generated: solutions/hw3-solution-key.qmd

  Composing email...
    To: ta@university.edu
    Subject: [STAT 301] Solution Key: HW3 Solution Key
    Attachment: hw3-solution-key.qmd
    Body: Please find the solution key for HW3 attached.

  Email sent successfully.
```

**Checkpoint:**

- Verify the "Email sent successfully" confirmation appears
- Check that the recipient and subject line are correct
- The recipient should receive the email within a few minutes

---

## Step 2: Send Using Config Defaults

If you configure a default TA email in `teach-config.yml`, you can use `--send` without specifying an address:

```bash
/teaching:assignment "HW4" --send
```

When no email address follows `--send`, Scholar looks up `course.staff.ta_email` from your teach-config.yml.

**Sample output:**

```
  Generated: assignments/hw4.qmd

  Composing email...
    To: jane.doe@university.edu (from teach-config.yml)
    Subject: [STAT 301] Assignment: HW4
    Attachment: hw4.qmd

  Email sent successfully.
```

---

## Step 3: Configure teach-config.yml

Set up default email recipients in your course configuration:

```yaml
# .flow/teach-config.yml
scholar:
  course_info:
    name: "STAT 301"
    level: "undergraduate"
    field: "statistics"

  course:
    staff:
      ta_email: "jane.doe@university.edu"
      instructor_email: "prof.smith@university.edu"
```

**Recipient resolution order:**

1. Explicit email on the command line: `--send ta@university.edu`
2. `course.staff.ta_email` from teach-config.yml: `--send` (no address)
3. Error if neither is available

This means you can override the default for one-off sends while keeping the config for routine distribution.

---

## Step 4: Supported Commands

The `--send` flag is available on three commands (v2.17.0: removed from exam and quiz due to implementation issues):

| Command | Typical Recipient | Example |
|---------|------------------|---------|
| `/teaching:solution` | TA (for grading) | `/teaching:solution "HW3" --send` |
| `/teaching:assignment` | TA (for review) or students | `/teaching:assignment "HW4" --send` |
| `/teaching:rubric` | TA (for grading reference) | `/teaching:rubric "HW3" --send` |

All three use the same shared email utility (`src/teaching/utils/send-output.js`), ensuring consistent subject lines, formatting, and delivery behavior.

> **v2.17.0 change:** `/teaching:exam` and `/teaching:quiz` no longer support `--send`. For exam/quiz delivery, generate the file and use your email client or the himalaya CLI directly.

---

## Step 5: Email Format and Preview

Each email is formatted with a standard structure:

**Subject line format:**

```
[COURSE_NAME] Content Type: Title
```

Examples:

- `[STAT 301] Solution Key: HW3`
- `[STAT 301] Assignment: HW4`
- `[STAT 301] Exam: Midterm`
- `[STAT 301] Quiz: Week 5`
- `[STAT 301] Rubric: HW3`

The course name comes from `course_info.name` in teach-config.yml. If not configured, the subject line omits the course prefix.

**Email body:**

The body includes a brief description and the generated content is included as an attachment. For shorter content (quizzes, rubrics), the content may also be included inline in the email body for quick review.

**Preview before sending:**

The email is composed via himalaya MCP with a confirmation step. You will see the composed email before it is sent:

```
  Composing email...
    To: ta@university.edu
    Subject: [STAT 301] Solution Key: HW3
    Attachment: hw3-solution.qmd

  Send this email? [Y/n]
```

This gives you a chance to review the recipient, subject, and attachment before delivery.

---

## Step 6: Combining with Other Flags

The `--send` flag works alongside other flags:

```bash
# Generate, validate R code, then email
/teaching:solution "HW3" --validate --send ta@university.edu

# Generate in specific format, then email
/teaching:assignment "HW4" --format qmd --send

# Dry-run to preview without generating or sending
/teaching:solution "HW3" --dry-run --send ta@university.edu
```

When combined with `--validate`, the email is only sent if validation passes. This prevents distributing materials with broken R code.

When combined with `--dry-run`, the email composition is previewed but nothing is generated or sent.

---

## Troubleshooting

### "Himalaya MCP not available"

**Cause:** The himalaya email MCP server is not configured in Claude Code.

**Solution:**

1. Verify himalaya is installed: `which himalaya`
2. Check that the himalaya MCP is configured in your Claude Code settings
3. Test email access: `himalaya envelope list` should return your inbox

### "No recipient specified"

**Cause:** No email address was provided on the command line and `course.staff.ta_email` is not set in teach-config.yml.

**Solution:**

Either provide an explicit address:

```bash
/teaching:solution "HW3" --send ta@university.edu
```

Or configure a default in teach-config.yml:

```yaml
scholar:
  course:
    staff:
      ta_email: "ta@university.edu"
```

### "Email sent but not received"

**Cause:** The email may be in the recipient's spam folder, or the himalaya account's sending address is not recognized.

**Solution:**

1. Check the recipient's spam/junk folder
2. Verify your himalaya sending address: `himalaya account list`
3. Ask the recipient to allowlist your sending address
4. Check himalaya logs for delivery errors

### "Invalid email address"

**Cause:** The email address format is invalid.

**Solution:** Verify the address format (e.g., `name@domain.edu`). Common mistakes include trailing spaces, missing domain, or using angle brackets.

### "teach-config.yml not found"

**Cause:** Using `--send` without an explicit address and no teach-config.yml exists.

**Solution:**

Either create a `.flow/teach-config.yml` with staff email configuration, or always provide an explicit email address with `--send`.

---

## Additional Options

| Flag | Purpose | Example |
|------|---------|---------|
| `--send EMAIL` | Send to explicit recipient | `/teaching:solution "HW3" --send ta@uni.edu` |
| `--send` | Send to config default | `/teaching:assignment "HW4" --send` |

---

## Next Steps

### Integrate into your workflow

1. Configure `course.staff.ta_email` in teach-config.yml for one-time setup
2. Add `--send` to your content generation commands
3. Combine `--validate --send` for validated delivery
4. Use explicit addresses for one-off sends to students

### Related Tutorials

- **[Assignments, Solutions & Rubrics](assignments-solutions-rubrics.md)** -- Generate the content that `--send` delivers
- **[Course Configuration](configuration.md)** -- Set up teach-config.yml
- **[R Validation Pipeline](validate-pipeline.md)** -- Validate before sending

### Related Commands

- **`/teaching:solution`** -- Generate solution keys
- **`/teaching:assignment`** -- Generate assignments
- **`/teaching:exam`** -- Generate exams
- **`/teaching:quiz`** -- Generate quizzes
- **`/teaching:rubric`** -- Generate rubrics

---

**You've learned how to send generated content directly via email.** Use `--send` to streamline the distribution of teaching materials to your TAs and students.
