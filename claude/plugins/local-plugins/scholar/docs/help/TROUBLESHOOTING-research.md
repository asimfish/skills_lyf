# Troubleshooting Research Commands

Diagnostic and resolution guide for Scholar's research commands, organized by symptom and error type.

**Quick Navigation:**

- [Quick Diagnostics](#quick-diagnostics)
- [Installation & Setup](#installation-setup-issues)
- [Literature Commands](#literature-command-issues)
- [Manuscript Commands](#manuscript-command-issues)
- [Simulation Commands](#simulation-command-issues)
- [Research Planning](#research-planning-issues)
- [Integration & Workflow](#integration-workflow-issues)
- [API & Network](#api-network-issues)
- [Data & Quality](#data-quality-issues)

---

## Quick Diagnostics

Use these checks to identify the root cause of issues quickly.

### Check 1: Scholar Installation

**Symptom:** "command not found: scholar" or command errors

**Diagnostic:**

```bash
# Verify installation
which scholar
scholar --version

# Check plugin registration
scholar plugin list

# Verify Claude Code session
echo $CLAUDE_API_KEY
```

**Expected Output:**

```
/opt/homebrew/bin/scholar
v2.6.0
[researcher, academic, statistics]
[API key present]
```

**If Failed:**

- Go to [Scholar Not Installed](#problem-scholar-not-installed)

---

### Check 2: API Key Configuration

**Symptom:** "Authentication failed" or "Invalid API key"

**Diagnostic:**

```bash
# Check Claude API key
echo $CLAUDE_API_KEY | head -c 10
echo "..."

# Test API connectivity
curl -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $CLAUDE_API_KEY" | head -c 50

# Check Claude Code session
/research:arxiv "test" --debug
```

**If Failed:**

- Go to [API Authentication Problems](#problem-api-key-invalid)

---

### Check 3: Network Connectivity

**Symptom:** "Connection timeout" or "Network unreachable"

**Diagnostic:**

```bash
# Test internet connectivity
ping -c 1 8.8.8.8

# Test arXiv access
curl -I https://arxiv.org/

# Test API endpoint
curl -I https://api.anthropic.com/

# Check DNS
nslookup arxiv.org
nslookup api.anthropic.com
```

**Expected Output:**

```
PING 8.8.8.8: bytes=X time=XXms
HTTP/2 200
HTTP/2 401
```

**If Failed:**

- Go to [Network Connectivity Issues](#problem-network-timeout)

---

### Check 4: Command Syntax

**Symptom:** "Invalid command" or "Unrecognized option"

**Diagnostic:**

```bash
# Get help for specific command
/research:arxiv --help

# List all research commands
/research --list

# Check command structure
scholar help:research:arxiv

# Show examples
scholar examples:literature
```

**Common Syntax Errors:**

```bash
# WRONG: Missing quotes
/research:arxiv causal mediation

# RIGHT: Query in quotes
/research:arxiv "causal mediation"

# WRONG: Invalid flag
/research:arxiv "query" --output=html

# RIGHT: Valid flag
/research:arxiv "query" --recent
```

**If Failed:**

- Go to [Command Syntax Validation](#problem-rpython-syntax-errors)

---

### Check 5: Prerequisites

**Symptom:** "Missing dependency" or "Cannot find required tool"

**Diagnostic:**

```bash
# Check R installation (for simulations)
R --version

# Check Python (alternative for simulations)
python3 --version

# Check Git (for version control)
git --version

# Check required packages
R -e "installed.packages()"
pip list | grep bibtexparser
```

**Expected:** All required tools should be present and accessible.

**If Failed:**

- Go to [Installation & Setup Issues](#installation-setup-issues)

---

## Installation & Setup Issues

### Problem: Scholar Not Installed

**Symptoms:**

- `command not found: scholar`
- `/research:*` commands not recognized
- Plugin not appearing in Claude Code

**Common Causes:**

1. Homebrew installation did not complete
2. Plugin cache corrupted
3. Shell session not restarted after installation
4. Incorrect installation method

**Diagnosis:**

```bash
# Check Homebrew installation
brew list scholar

# Check installation path
ls -la /opt/homebrew/opt/scholar/

# Check plugin directory
ls -la ~/.claude/plugins/scholar/

# Verify PATH
echo $PATH | grep homebrew
```

**Solution:**

**Step 1:** Clean previous installation

```bash
# Remove old installation
brew uninstall scholar
rm -rf ~/.claude/plugins/scholar/
rm -rf ~/.claude/cache/scholar-*
```

**Step 2:** Reinstall Scholar

```bash
# Add tap if needed
brew tap data-wise/tap

# Install fresh
brew install data-wise/tap/scholar

# Verify
scholar --version
```

**Step 3:** Restart Claude Code session

```bash
# Option A: Restart Claude Code completely
# (Close and reopen the application)

# Option B: Reload plugins
scholar plugin:reload
```

**Step 4:** Verify installation

```bash
# Check available commands
/research --list

# Try basic command
/research:arxiv "test search" --limit 1
```

**Expected:** Command executes without "not found" error.

**Prevention:**

- Use official Homebrew tap: `brew tap data-wise/tap`
- Verify installation with `scholar --version` immediately after install
- Check Claude Code session logs for plugin loading errors

**Related:**

- [Plugin Loading Failures](#problem-plugin-loading-failures)
- [FAQ: Installation](../help/FAQ-research.md#installation)

---

### Problem: Plugin Loading Failures

**Symptoms:**

- Scholar commands timeout
- Commands appear to load but produce no output
- "Plugin initialization failed" error
- Commands work inconsistently

**Common Causes:**

1. Plugin cache corrupted
2. Multiple Claude Code sessions competing
3. Plugin version mismatch with Claude Code
4. Missing plugin dependencies
5. Insufficient memory

**Diagnosis:**

```bash
# Check plugin loading status
scholar plugin:status

# View plugin logs
tail -f ~/.claude/logs/scholar-plugin.log

# Check Claude Code session
ps aux | grep "Claude Code"

# Monitor memory usage
top -l 1 | head -20
```

**Solution:**

**Step 1:** Clear plugin cache

```bash
# Stop current Scholar processes
pkill -f "scholar"
sleep 2

# Clear cache
rm -rf ~/.claude/cache/scholar-*
rm -rf ~/.claude/tmp/scholar-*

# Clear node cache if applicable
rm -rf ~/.npm
npm cache clean --force
```

**Step 2:** Reload plugin

```bash
# Reload plugin in Claude Code
scholar plugin:reload

# Or restart Claude Code session
# (Close and reopen application)
```

**Step 3:** Verify plugin state

```bash
# Check plugin status
scholar plugin:status

# Monitor loading process
scholar plugin:debug

# Try simple command with debug output
/research:arxiv "simple test" --debug
```

**Step 4:** Check Claude Code session

```bash
# Ensure only one session running
ps aux | grep -i claude

# If multiple sessions, close extras
# Only one Claude Code window should be open
```

**Expected:** Plugin loads immediately, commands respond in <10 seconds.

**Prevention:**

- Avoid running multiple Claude Code instances
- Monitor plugin logs periodically
- Restart Claude Code if commands become unresponsive
- Keep Scholar and Claude Code updated

**Related:**

- [Scholar Not Installed](#problem-scholar-not-installed)
- [API & Network Issues](#api-network-issues)

---

### Problem: API Key Invalid

**Symptoms:**

- "Authentication failed" error
- "Invalid API key" message
- "Unauthorized" (401) response
- Commands fail silently with no output

**Common Causes:**

1. `CLAUDE_API_KEY` environment variable not set
2. API key expired or revoked
3. API key has wrong permissions
4. API key copied incorrectly (hidden characters)
5. Using old Anthropic API key format

**Diagnosis:**

```bash
# Check if API key is set
echo $CLAUDE_API_KEY

# Check API key format
echo $CLAUDE_API_KEY | wc -c

# Test API key validity
curl -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" | jq '.'

# Check in Claude Code
/research:arxiv "test" --debug 2>&1 | grep -i "auth\|key\|401"
```

**Expected Output:**

```bash
sk-ant-... (starts with sk-ant-)
[API key length typically 80-100 characters]
[JSON response with model list]
```

**Solution:**

**Step 1:** Verify API key is set

```bash
# Check current value (first 10 chars only for security)
if [ -z "$CLAUDE_API_KEY" ]; then
  echo "ERROR: API key not set"
else
  echo "API key is set: ${CLAUDE_API_KEY:0:10}..."
fi
```

**Step 2:** Update API key (if needed)

```bash
# Check your API key at console.anthropic.com
# Copy the full key (starts with sk-ant-)

# Set in current session
export CLAUDE_API_KEY="sk-ant-..."

# Make permanent in shell config
echo 'export CLAUDE_API_KEY="sk-ant-..."' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $CLAUDE_API_KEY
```

**Step 3:** Check for hidden characters

```bash
# Copy API key to temp file
echo "Your API key" > /tmp/key.txt

# Check for hidden characters
od -c /tmp/key.txt | head -5

# Try with clean copy
# Re-copy directly from console.anthropic.com
```

**Step 4:** Test API connectivity

```bash
# Test with curl (exact format)
curl -s https://api.anthropic.com/v1/models \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -w "\nStatus: %{http_code}\n"

# Try simple Scholar command
/research:arxiv "bootstrap" --limit 1
```

**Expected:** Command executes, returns results within 30 seconds.

**Prevention:**

- Store API key in `.zshrc` / `.bashrc` for persistence
- Never commit API keys to Git
- Rotate API keys quarterly
- Monitor API usage at console.anthropic.com

**Security Warning:**

- Never share or commit your API key
- Treat API key like a password
- If exposed, immediately regenerate at console.anthropic.com

**Related:**

- [Network Connectivity Issues](#problem-network-timeout)
- [FAQ: Authentication](../help/FAQ-research.md#how-do-i-set-up-authentication)

---

### Problem: Permission Errors

**Symptoms:**

- "Permission denied" when reading/writing files
- "Cannot access configuration file"
- "Write to bibliography failed"
- `.bib` file modifications rejected

**Common Causes:**

1. Bibliography file not readable/writable
2. Working directory not writable
3. Home directory permissions misconfigured
4. File owned by different user
5. Mounted filesystem is read-only

**Diagnosis:**

```bash
# Check directory permissions
ls -ld ~/.scholar/
ls -ld $(pwd)

# Check bibliography file permissions
ls -l references.bib

# Check file ownership
stat references.bib
stat ~/.scholar/config.yml

# Test write permissions
touch /tmp/test-write.txt && rm /tmp/test-write.txt && echo "OK"
```

**Solution:**

**Step 1:** Fix directory permissions

```bash
# Ensure Scholar config directory is writable
mkdir -p ~/.scholar
chmod 755 ~/.scholar

# Ensure home directory is readable
chmod 755 ~
```

**Step 2:** Fix bibliography file permissions

```bash
# Make bibliography readable and writable
chmod 644 references.bib

# If file is owned by different user, take ownership
sudo chown $USER references.bib

# Verify
ls -l references.bib
```

**Step 3:** Check working directory

```bash
# Ensure working directory is writable
pwd
touch test-file.txt && rm test-file.txt

# If not writable, change to writable directory
cd ~
cd ~/researcher/
```

**Step 4:** Test bibliography operations

```bash
# Create test bibliography
echo '@article{test2024,
  title={Test},
  author={Author},
  year={2024}
}' > test.bib

# Test reading
/research:bib:search "test" test.bib

# Test writing
/research:bib:add test.bib references.bib

# Clean up
rm test.bib
```

**Expected:** Files are readable/writable, commands complete without permission errors.

**Prevention:**

- Keep bibliography files in home directory
- Use consistent file permissions (644 for files, 755 for directories)
- Avoid mixing users in research directory
- Use umask to set default permissions: `umask 022`

**Related:**

- [Bibliography File Issues](#problem-bibliography-file-issues)

---

## Literature Command Issues

### Problem: arXiv Search Returns No Results

**Symptoms:**

- Search query runs but returns "No results found"
- Expected papers missing from results
- Results are outdated
- Specific paper not found despite knowing it exists

**Common Causes:**

1. Search query too specific or poorly formatted
2. Paper published recently (arXiv indexing delay)
3. Paper is in non-statistics category
4. Search operator syntax incorrect
5. arXiv database temporarily unavailable

**Diagnosis:**

```bash
# Check arXiv availability
curl -I https://arxiv.org/ | grep "200\|503"

# Test basic search
/research:arxiv "mediation analysis"

# Try with debug output
/research:arxiv "mediation analysis" --debug

# Check search history
scholar history:arxiv

# View recent searches
cat ~/.scholar/search_history.log
```

**Solution:**

**Step 1:** Simplify search query

```bash
# WRONG: Too many search terms
/research:arxiv "causal mediation analysis bootstrap confidence intervals methodology"

# RIGHT: Core concepts only
/research:arxiv "mediation analysis"

# BETTER: With date filter
/research:arxiv "mediation analysis" --recent --limit 5
```

**Step 2:** Use search operators

```bash
# Search by author
/research:arxiv "au:Pearl"

# Search by title keywords
/research:arxiv "ti:mediation"

# Combine searches
/research:arxiv "(mediation OR causal) AND bootstrap"

# Exclude terms
/research:arxiv "mediation NOT machine-learning"
```

**Step 3:** Check arXiv categories

```bash
# Scholar defaults to stat.* categories
# To search all categories
/research:arxiv "mediation analysis" --categories "stat.ME,stat.TH"

# View paper category
/research:arxiv "causal inference" --limit 3 --verbose
```

**Step 4:** Verify paper exists

```bash
# Try different search terms
/research:arxiv "causal inference propensity"

# Search by arXiv ID if known
curl https://arxiv.org/abs/2401.12345

# Try direct DOI search
/research:doi "10.48550/arXiv.2401.12345"
```

**Step 5:** Check for indexing delays

```bash
# arXiv may have indexing delay of 1-2 days
# For very recent papers, check arXiv directly
open https://arxiv.org/search/?query=mediation&searchtype=title

# Or use DOI if available
/research:doi "10.48550/arXiv.2401.12345"
```

**Expected:** Relevant papers returned in <5 seconds, typically 5-20 results.

**Common Search Patterns:**

| Goal | Query |
|------|-------|
| Find papers on topic | `/research:arxiv "topic name"` |
| Find by author | `/research:arxiv "au:AuthorName"` |
| Find recent papers | `/research:arxiv "topic" --recent` |
| Find 2024+ papers | `/research:arxiv "topic" --from 2024` |
| Boolean search | `/research:arxiv "(method1 OR method2) AND application"` |
| Exclude terms | `/research:arxiv "mediation NOT ML"` |

**Prevention:**

- Use 2-3 key terms, not full sentences
- Start broad, then refine search
- Use `--recent` flag for latest research
- Combine multiple searches if first returns no results
- Bookmark successful search queries

**Related:**

- [DOI Lookup Failures](#problem-doi-lookup-failures)
- [Tutorial: First Literature Search](../tutorials/research/first-literature-search.md)

---

### Problem: DOI Lookup Failures

**Symptoms:**

- "DOI not found" error
- No BibTeX entry returned
- Partial metadata returned (missing author, year, etc.)
- Timeout errors on DOI requests
- "Invalid DOI format" message

**Common Causes:**

1. DOI is malformed or incorrect
2. DOI not yet registered (very new papers)
3. DOI service temporarily unavailable
4. Paper is preprint (use arXiv ID instead)
5. Special characters in DOI causing parsing errors

**Diagnosis:**

```bash
# Check DOI format (should start with 10.)
echo "10.1080/01621459.2020.1765785"

# Validate DOI format
if [[ "$DOI" =~ ^10\. ]]; then
  echo "Valid DOI format"
else
  echo "Invalid DOI format"
fi

# Test DOI service
curl -s -I "https://doi.org/10.1080/01621459.2020.1765785"

# Try lookup
/research:doi "10.1080/01621459.2020.1765785" --debug
```

**Solution:**

**Step 1:** Verify DOI format

```bash
# Valid DOI format
10.1080/01621459.2020.1765785  # ✓ Correct
10.48550/arXiv.2401.12345      # ✓ Correct (arXiv DOI)
10.1145/3025453.3026274        # ✓ Correct

# Invalid DOI format
doi: 10.1080/...               # ✗ Prefix "doi:" not needed
https://doi.org/10.1080/...    # ✗ Full URL not needed
10.1080-01621459               # ✗ Wrong separator
DOI10.1080/01621459            # ✗ Malformed
```

**Step 2:** Get correct DOI

```bash
# For published papers
# Check journal website or CrossRef

# For preprints (recommended)
/research:arxiv "paper title"
# arXiv ID can be converted to DOI: 10.48550/arXiv.YYYY.XXXXX

# For papers with multiple DOIs
# Use the official DOI from journal or CrossRef
curl -s "https://api.crossref.org/works?query=title" | jq '.message.items[0].DOI'
```

**Step 3:** Try alternative lookup methods

```bash
# If DOI fails, try arXiv search
# Extract arXiv ID from paper metadata
/research:arxiv "paper title or author"

# For very new papers, try direct citation
/research:doi "10.48550/arXiv.2401.12345"

# If preprint, use arXiv version instead
/research:arxiv "exact paper title" --limit 1
```

**Step 4:** Handle preprints correctly

```bash
# WRONG: Using journal DOI for preprint not yet published
/research:doi "10.1080/99999999.9999.9999999"  # Not yet assigned

# RIGHT: Use arXiv DOI instead
/research:doi "10.48550/arXiv.2401.12345"

# OR: Use arXiv search directly
/research:arxiv "2401.12345"  # arXiv ID
```

**Step 5:** Retry with timeout

```bash
# If timeout occurs, DOI service may be slow
# Retry with explicit timeout
timeout 30 /research:doi "10.1080/01621459.2020.1765785"

# If consistently fails, service may be down
# Check service status
curl -s https://status.doi.org/
```

**Expected:** BibTeX entry returned with complete metadata (title, authors, year, journal).

**Sample BibTeX Output:**

```bibtex
@article{author2020title,
  title={Title of Paper},
  author={Author, A. and Author, B.},
  journal={Journal Name},
  volume={42},
  number={3},
  pages={123--145},
  year={2020},
  doi={10.1080/01621459.2020.1765785}
}
```

**Prevention:**

- Use official DOIs from journal websites
- For preprints, prefer arXiv DOIs
- Verify DOI before lookup (CrossRef.org)
- Keep list of verified DOIs for repeated lookups

**Related:**

- [arXiv Search Returns No Results](#problem-arxiv-search-returns-no-results)
- [Bibliography File Issues](#problem-bibliography-file-issues)

---

### Problem: BibTeX Parsing Errors

**Symptoms:**

- "Invalid BibTeX syntax" error
- Entries not added to bibliography
- "Failed to parse BibTeX file" message
- Malformed entries in output
- Special characters cause formatting issues

**Common Causes:**

1. BibTeX file has syntax errors
2. Special characters not escaped properly (e.g., accented letters)
3. Quotes or braces mismatched
4. File encoding not UTF-8
5. Comments in BibTeX not formatted correctly

**Diagnosis:**

```bash
# Check BibTeX file syntax
bibtex references.bib

# Validate file format
file references.bib

# Check file encoding
file -I references.bib

# Check for common syntax errors
grep -n "{$" references.bib  # Unclosed braces
grep -n "^[^@]" references.bib  # Non-entry lines
```

**Solution:**

**Step 1:** Validate BibTeX file structure

```bash
# Correct BibTeX format
@article{key2024,
  title={Title},
  author={Author, A.},
  journal={Journal},
  year={2024}
}

# Check for common errors
# Missing @article/@book prefix
# Missing key before comma
# Unclosed braces or quotes
```

**Step 2:** Fix encoding issues

```bash
# Check if UTF-8 encoded
file -I references.bib

# Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 references.bib > references_utf8.bib
mv references_utf8.bib references.bib

# Verify
file -I references.bib
```

**Step 3:** Fix special characters

```bash
# WRONG: Unescaped special characters
@article{paper,
  title={Methods for Café Analysis},  # Accent not escaped
  author={Müller, K.}  # Umlaut not escaped
}

# RIGHT: Properly escaped
@article{paper,
  title={Methods for Caf\'{e} Analysis},
  author={M\"{u}ller, K.}
}

# ALSO CORRECT: UTF-8 characters (modern)
@article{paper,
  title={Methods for Café Analysis},
  author={Müller, K.}
}
```

**Step 4:** Fix structural issues

```bash
# WRONG: Missing comma after field
@article{key,
  title={Title}
  author={Author}
}

# RIGHT: Comma after each field
@article{key,
  title={Title},
  author={Author}
}

# WRONG: Comment on wrong line
@article{key,
  title={Title},  % This is a comment
  author={Author}
}

# RIGHT: Comments outside entries or with %
@article{key,
  title={Title},
  author={Author}
}
% This is a comment
```

**Step 5:** Clean and validate

```bash
# Create clean BibTeX file
cat references.bib | \
  iconv -f ISO-8859-1 -t UTF-8 | \
  sed 's/[{}]//g' > references_clean.bib

# Or use Scholar to fix
/research:bib:search "*" references.bib > references_clean.bib

# Validate entries
grep "@article\|@book\|@inproceedings" references_clean.bib | wc -l
```

**Expected:** BibTeX file with properly formatted entries, valid syntax, UTF-8 encoding.

**Validation Checklist:**

- [ ] All entries start with @article, @book, etc.
- [ ] Each entry has unique key
- [ ] Braces and quotes properly matched
- [ ] Commas between all fields
- [ ] File encoded as UTF-8
- [ ] No trailing commas in entries
- [ ] Required fields present (author, title, year, etc.)

**Prevention:**

- Use BibTeX generators (like Scholar's `/research:doi`)
- Validate with online tools before adding
- Maintain consistent field formatting
- Use UTF-8 encoding for all files

**Related:**

- [Bibliography File Issues](#problem-bibliography-file-issues)
- [DOI Lookup Failures](#problem-doi-lookup-failures)

---

### Problem: Bibliography File Issues

**Symptoms:**

- "Cannot find bibliography file"
- "File not readable" error
- Changes not saved to bibliography
- File becomes corrupted after adding entries
- `add` command reports success but entries missing

**Common Causes:**

1. Bibliography file not in current directory
2. File path has spaces or special characters
3. File doesn't exist (needs to be created first)
4. File is read-only
5. Concurrent file access (multiple processes writing)
6. File path specified incorrectly

**Diagnosis:**

```bash
# Check if file exists
ls -la references.bib

# Check file location
find ~ -name "references.bib" -o -name "*.bib" | head -10

# Check file permissions
stat references.bib

# Check file size (empty = 0 bytes)
wc -l references.bib

# Check for file locks
lsof references.bib
```

**Solution:**

**Step 1:** Verify file exists and is accessible

```bash
# Check current directory
pwd
ls -la *.bib

# If not found, check home directory
ls -la ~/.bibliography/
ls -la ~/Documents/*.bib

# Check if file readable
cat references.bib | head -5
```

**Step 2:** Create bibliography file if missing

```bash
# Create new empty bibliography
touch references.bib

# Or create with sample entry
cat > references.bib << 'EOF'
@article{sample2024,
  title={Sample Entry},
  author={Author, A.},
  journal={Journal},
  year={2024}
}
EOF

# Verify creation
ls -l references.bib
```

**Step 3:** Handle file path with spaces

```bash
# WRONG: Spaces not quoted
/research:bib:search "query" My Bibliography.bib

# RIGHT: Path in quotes
/research:bib:search "query" "My Bibliography.bib"

# BETTER: Use path without spaces
mv "My Bibliography.bib" my_bibliography.bib
/research:bib:search "query" my_bibliography.bib
```

**Step 4:** Fix permissions and access

```bash
# Make file readable and writable
chmod 644 references.bib

# Check if file is locked
lsof references.bib

# If locked, close application and retry
# Or wait for lock to clear (usually < 5 seconds)

# Backup before modifying
cp references.bib references.bib.backup
```

**Step 5:** Use full path to avoid ambiguity

```bash
# Use absolute path for reliability
/research:bib:search "query" ~/references.bib
/research:bib:add entry.bib ~/references.bib

# Or change to correct directory
cd ~/researcher/project1/
/research:bib:add entry.bib references.bib
```

**Step 6:** Recover from corruption

```bash
# Check for backup
ls -la references.bib*

# Restore from backup if available
cp references.bib.backup references.bib

# Or rebuild from entries
# Re-add entries one by one using /research:bib:add

# Validate and clean
/research:bib:search "*" references.bib | wc -l
```

**Expected:** Bibliography file exists, is readable/writable, contains valid BibTeX entries.

**File Structure:**

```
~/researcher/project1/
├── references.bib       # Main bibliography
├── references.bib.backup # Backup
├── manuscript.md        # Your manuscript
└── README.md
```

**Best Practices:**

- Keep bibliography in project root directory
- Use filename without spaces: `references.bib`
- Backup regularly: `cp references.bib references.bib.$(date +%s)`
- Use absolute paths to avoid ambiguity: `~/project/references.bib`
- Close editors before adding entries to avoid locks

**Related:**

- [BibTeX Parsing Errors](#problem-bibtex-parsing-errors)
- [Permission Errors](#problem-permission-errors)

---

### Problem: Zotero Integration Failures

**Symptoms:**

- "Cannot connect to Zotero"
- "Zotero library not found"
- Entries not syncing between Scholar and Zotero
- Duplicate entries appearing
- Zotero changes not reflected in bibliography

**Common Causes:**

1. Zotero not running or not configured
2. Zotero API key not set
3. Zotero library folder not accessible
4. Scholar has wrong Zotero library ID
5. Sync permissions not granted

**Diagnosis:**

```bash
# Check if Zotero is running
ps aux | grep -i zotero

# Check Zotero configuration
ls -la ~/.zotero/profiles/*/

# Check for Zotero API key
echo $ZOTERO_API_KEY

# Check library accessibility
ls -la ~/Zotero/storage/ 2>/dev/null | head -10

# Check Scholar's Zotero config
cat ~/.scholar/config.yml | grep -i zotero
```

**Solution:**

**Step 1:** Install and configure Zotero (if not already done)

```bash
# Install Zotero
brew install zotero

# Or download from zotero.org
open https://www.zotero.org/download/

# Launch Zotero
open -a Zotero
```

**Step 2:** Set up Zotero API key

```bash
# Get API key from Zotero account
# https://www.zotero.org/settings/keys

# Add to shell config
echo 'export ZOTERO_API_KEY="your-key-here"' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $ZOTERO_API_KEY
```

**Step 3:** Configure Scholar for Zotero

```bash
# Update Scholar config
cat > ~/.scholar/config.yml << 'EOF'
zotero:
  enabled: true
  api_key: ${ZOTERO_API_KEY}
  library_id: "your-library-id"
  library_type: "user"  # or "group"
EOF

# Get library ID from Zotero settings
# https://www.zotero.org/settings/keys
```

**Step 4:** Test Zotero connection

```bash
# Search Zotero library
/research:bib:search "author" --source zotero

# Sync with Zotero
scholar zotero:sync

# Check sync status
scholar zotero:status
```

**Step 5:** Fix sync issues

```bash
# Clear cache and resync
rm -rf ~/.scholar/cache/zotero-*
scholar zotero:sync --force

# If duplicates appear, deduplicate
scholar zotero:deduplicate

# Verify sync completed
scholar zotero:status
```

**Expected:** Zotero integration works, entries sync automatically, no errors.

**Prevention:**

- Enable Zotero sync in settings
- Keep Zotero running during Scholar sessions
- Regularly backup Zotero library
- Use unique keys for bibliography entries

**Related:**

- [Citation Format Errors](#problem-citation-format-errors)
- [Bibliography File Issues](#problem-bibliography-file-issues)

---

### Problem: Citation Format Errors

**Symptoms:**

- Wrong citation format in output
- "Unsupported citation style" error
- Citation appears formatted incorrectly in text
- Multiple citation formats conflicting
- LaTeX bibliography compilation fails

**Common Causes:**

1. Requested citation style not supported
2. BibTeX entries missing required fields
3. Citation style not compatible with output format
4. Style configuration file missing or corrupted
5. Formatting instructions not applied correctly

**Diagnosis:**

```bash
# Check supported citation formats
scholar csl:list

# Check BibTeX entry completeness
/research:bib:search "query" references.bib --check-required-fields

# Test citation formatting
/research:doi "10.1080/01621459.2020.1765785" --format apa

# Check output format
file output.md
```

**Solution:**

**Step 1:** Use supported citation styles

```bash
# Supported styles
APA        # apa
Chicago    # chicago-notes, chicago-author-date
Harvard    # harvard1
IEEE       # ieee
Bibtex     # bibtex

# Correct usage
/research:doi "10.1080/..." --format apa
/research:bib:search "query" references.bib --format chicago-author-date
```

**Step 2:** Ensure BibTeX entries have required fields

```bash
# Required fields by entry type

# @article requires: author, title, journal, year
@article{key,
  author = "Smith, John",
  title = "Title of Article",
  journal = "Journal Name",
  year = 2024
}

# @book requires: author, title, publisher, year
@book{key,
  author = "Smith, John",
  title = "Book Title",
  publisher = "Publisher",
  year = 2024
}

# @inproceedings requires: author, title, booktitle, year
@inproceedings{key,
  author = "Smith, John",
  title = "Paper Title",
  booktitle = "Conference Proceedings",
  year = 2024
}
```

**Step 3:** Match citation format to output format

```bash
# For Markdown output, use BibTeX format
/research:manuscript:methods "..." --output markdown --bib-format bibtex

# For LaTeX output, use BibTeX format
/research:manuscript:methods "..." --output latex --bib-format bibtex

# For Word output, use specific citation format
/research:manuscript:methods "..." --output docx --bib-format apa
```

**Step 4:** Configure citation style

```bash
# Create CSL style config
cat > ~/.scholar/citation.yml << 'EOF'
default_style: apa
supported_styles:
  - apa
  - chicago-author-date
  - harvard
bibliography_format: bibtex
EOF

# Verify configuration
cat ~/.scholar/citation.yml
```

**Step 5:** Validate and fix entries

```bash
# Check all entries have required fields
/research:bib:search "*" references.bib --validate

# Fix missing fields
# Add missing authors, titles, years, etc.

# Export in correct format
/research:bib:search "*" references.bib --format apa > references_apa.txt
```

**Expected:** Citations formatted consistently, no errors during bibliography compilation.

**Quick Reference:**

| Style | Code | Use Case |
|-------|------|----------|
| APA | `apa` | Psychology, education, social sciences |
| Chicago | `chicago-author-date` | History, humanities |
| Harvard | `harvard1` | UK universities |
| IEEE | `ieee` | Engineering, technical |
| BibTeX | `bibtex` | LaTeX documents |

**Prevention:**

- Always include complete entry information
- Use consistent citation style across manuscript
- Validate entries before use
- Test bibliography compilation early

**Related:**

- [BibTeX Parsing Errors](#problem-bibtex-parsing-errors)
- [Bibliography File Issues](#problem-bibliography-file-issues)

---

## Manuscript Command Issues

### Problem: Methods Section Too Generic

**Symptoms:**

- Generated methods lack specificity to your study
- Doesn't mention your specific statistical method
- Missing parameter details (e.g., sample size, effect size)
- Not tailored to your study design
- Looks like copy-paste generic text

**Common Causes:**

1. Input prompt too vague or missing details
2. Not including necessary context (study design, methods)
3. Missing information about specific parameters
4. Not specifying the field/methodology detail level
5. Generated for general method instead of specific application

**Diagnosis:**

```bash
# Compare generated output with input
# Check if output reflects specific details from input

# Generate with different levels of detail
/research:manuscript:methods "mediation analysis" --debug

# vs.

/research:manuscript:methods "Direct effect of behavioral intervention on depression symptoms, mediated by social support, using product-of-coefficients method with 10,000 bootstrap replicates, among 500 RCT participants" --debug
```

**Solution:**

**Step 1:** Provide complete study context

```bash
# WRONG: Too vague
/research:manuscript:methods "mediation analysis"

# RIGHT: Include study design
/research:manuscript:methods "Randomized controlled trial examining the indirect effect of a cognitive-behavioral intervention on depressive symptoms mediated by social support using mediation analysis"

# BETTER: Add specific methodological details
/research:manuscript:methods "RCT (n=500) with intervention group (n=250) and control group (n=250). Primary outcome: PHQ-9 depression score at 12 weeks. Mediator: UCLA Loneliness Scale score at 6 weeks. Analysis: Product-of-coefficients method with 10,000 bootstrap replicates. Sensitivity analysis for unmeasured confounding using Imai et al. approach."
```

**Step 2:** Specify statistical framework

```bash
# Include framework and assumptions
/research:manuscript:methods "Causal mediation analysis under the counterfactual framework (Rubin, 1974). Assumptions: sequential ignorability, consistency, positivity. Methods: product-of-coefficients estimation with delta method standard errors. Bootstrap confidence intervals (95%, 10,000 replicates, percentile method)."

# Include software
/research:manuscript:methods "Implementation in R 4.3.1 using the mediation package version 4.5.0. Mediation analysis conducted using ordinary least squares regression with robust standard errors."
```

**Step 3:** Add specific parameters

```bash
# Include all relevant parameters
/research:manuscript:methods "Sample size n=500, effect size for intervention on mediator α=0.35 (medium), effect size for mediator on outcome β=0.25 (medium). Type I error rate 0.05. Power analysis indicated n=420 sufficient for 80% power to detect indirect effect."

# Include missing details
/research:manuscript:methods "Covariates adjusted: age, sex, baseline depression severity. Interaction tested: intervention × mediator. Multiple testing correction: Bonferroni adjustment for 3 tests."
```

**Step 4:** Specify output level of detail

```bash
# Request detailed methods
/research:manuscript:methods "YOUR TOPIC" --level detailed

# Request concise methods
/research:manuscript:methods "YOUR TOPIC" --level concise

# Request methods with proofs
/research:manuscript:methods "YOUR TOPIC" --include-proofs

# Request methods with code
/research:manuscript:methods "YOUR TOPIC" --include-code
```

**Step 5:** Refine with iteration

```bash
# If first output is too generic:
/research:manuscript:methods "TOPIC with more specificity about your method, sample, and analysis plan"

# Build on previous output:
# Copy generated text and ask for refinement
/research:manuscript:methods "The current methods section is [previous output]. Please expand the bootstrap procedures section and add computational details."

# Ask for additional sections
/research:manuscript:methods "TOPIC. Please also include a subsection on sensitivity analyses and model diagnostics."
```

**Expected:** Methods section mentions your specific study design, sample size, methods, parameters, and software.

**Methods Section Checklist:**

- [ ] Study design clearly stated (RCT, observational, simulation, etc.)
- [ ] Sample size and power analysis included
- [ ] Variables defined (outcome, predictor, mediator, confounders)
- [ ] Statistical models specified with equations
- [ ] Parameter estimates and confidence intervals described
- [ ] Assumptions explicitly stated
- [ ] Software and package versions listed
- [ ] Sensitivity analyses mentioned

**Prevention:**

- Always provide specific study context
- Include details about variables and parameters
- Mention specific software and versions
- Specify field and methodology area
- Request refinements if output is too generic

**Related:**

- [Notation Inconsistencies](#problem-citation-format-errors)
- [Quality Concerns](#problem-quality-concerns)

---

### Problem: Results Section Incomplete

**Symptoms:**

- Missing statistical test results
- No confidence intervals or p-values
- Effect sizes not reported
- Table descriptions incomplete
- Missing interpretation of findings
- Statistical findings don't match input data

**Common Causes:**

1. Input data not provided in correct format
2. Missing information about statistical analysis
3. Summary statistics incomplete
4. Results prompt too vague
5. Output format not specified correctly

**Diagnosis:**

```bash
# Check what's being provided to command
cat results_summary.txt | head -20

# Test command with minimal input
/research:manuscript:results "F(2,100)=5.24, p=.008" --debug

# vs. with complete input
/research:manuscript:results "Simulation comparing bootstrap percentile vs BCa methods with results: bias 0.012, MSE 0.045, 95% CI coverage 0.945" --debug
```

**Solution:**

**Step 1:** Provide complete results data

```bash
# WRONG: Incomplete results
/research:manuscript:results "sample size 200, method worked well"

# RIGHT: Complete results with statistics
/research:manuscript:results "Monte Carlo simulation with 5000 replications, sample size n=200. Bootstrap percentile: bias=0.008 (SE=0.002), MSE=0.021, 95% CI coverage=0.945. BCa method: bias=0.006 (SE=0.002), MSE=0.018, 95% CI coverage=0.948."

# BETTER: Tabular format
/research:manuscript:results "
Method,n,Bias,SE_Bias,MSE,Coverage_95
Percentile,50,0.018,0.005,0.045,0.932
Percentile,100,0.008,0.003,0.021,0.941
BCa,50,0.012,0.004,0.038,0.940
BCa,100,0.006,0.002,0.018,0.948
"
```

**Step 2:** Include all statistics

```bash
# Ensure results include:
# - Point estimates
# - Standard errors or confidence intervals
# - Test statistics (t, F, χ², Z)
# - P-values or significance levels
# - Effect sizes (Cohen's d, η², etc.)
# - Sample sizes

/research:manuscript:results "t(198)=3.45, p=0.0008, 95% CI [0.15, 0.52], Cohen's d=0.49"

# Describe where statistics came from
/research:manuscript:results "From mixed-effects model comparing treatment vs control on primary outcome after adjusting for baseline covariates and site. Coefficient=0.38 (SE=0.11), t(450)=3.45, p=.0006, 95% CI [0.17, 0.59]"
```

**Step 3:** Specify output format for tables

```bash
# Request table formatting
/research:manuscript:results "RESULTS DATA" --table-format markdown

# Request specific table style
/research:manuscript:results "RESULTS DATA" --table-format latex

# Request data in long format
/research:manuscript:results "RESULTS DATA" --format long

# Request multiple tables
/research:manuscript:results "RESULTS DATA" --create-tables
```

**Step 4:** Provide context for interpretation

```bash
# Include context about analysis
/research:manuscript:results "Simulation results for mediation analysis with sample sizes 50, 100, 200, 500. Outcome: indirect effect estimation bias and 95% CI coverage. Methods: product-of-coefficients with bootstrap (10,000 replicates). Sample size n=10,000 replications per condition."

# Specify interpretation approach
/research:manuscript:results "RESULTS DATA. Please include interpretation of clinical significance, not just statistical significance. Compare to effect size thresholds in prior literature."
```

**Step 5:** Load results from file

```bash
# Paste directly
/research:manuscript:results "F(2,100)=5.24, p=.008, η²=0.095"

# Or from file
cat results.csv | /research:manuscript:results

# Or show file path
/research:manuscript:results --input-file results.csv

# For large datasets
/research:manuscript:results --input-file results.csv --input-format csv --summarize
```

**Expected:** Results section with complete statistics, properly formatted tables, interpretation of findings.

**Results Section Checklist:**

- [ ] All test statistics reported (t, F, χ², etc.)
- [ ] P-values or significance levels included
- [ ] 95% confidence intervals provided
- [ ] Effect sizes reported (Cohen's d, η², etc.)
- [ ] Sample sizes or degrees of freedom specified
- [ ] Tables properly formatted with captions
- [ ] Figures described with axis labels
- [ ] Findings interpreted in context
- [ ] Missing data handling described

**Prevention:**

- Collect all statistics before writing results
- Use consistent reporting format
- Include confidence intervals and effect sizes
- Create comprehensive summary before calling command
- Specify output format upfront

**Related:**

- [Notation Inconsistencies](#problem-citation-format-errors)
- [LaTeX Compilation Errors](#problem-latexoverleaf-integration)

---

### Problem: Reviewer Response Tone Issues

**Symptoms:**

- Response sounds defensive or hostile
- Tone too casual or disrespectful
- Doesn't acknowledge reviewer concerns adequately
- Sounds arrogant or dismissive
- Fails to remain professional

**Common Causes:**

1. Input contained emotional language
2. Reviewer comment interpreted as personal attack
3. Response generated without professional tone guidance
4. Not using proper framing for disagreements
5. Missing professional language conventions

**Diagnosis:**

```bash
# Review generated response
cat reviewer_response.md | head -50

# Check for tone issues
grep -i "simply\|obvious\|clear\|just\|easy" reviewer_response.md

# Read response aloud to check tone
# Does it sound professional and collaborative?
```

**Solution:**

**Step 1:** Frame reviewer feedback constructively

```bash
# WRONG: Defensive framing
/research:manuscript:reviewer "Reviewer says our method is outdated, but they're wrong because newer methods haven't been validated"

# RIGHT: Constructive framing
/research:manuscript:reviewer "Reviewer raised concern about method comparison with more recent approaches. We can expand discussion of method selection rationale and acknowledge recent developments"

# BETTER: Problem-solving framing
/research:manuscript:reviewer "Reviewer 2 suggests comparison with method X. We agree this would strengthen the manuscript. We've conducted supplementary analysis comparing our approach with X, showing comparable performance with improved computational efficiency"
```

**Step 2:** Use respectful language templates

```bash
# Acknowledge and thank
/research:manuscript:reviewer "Thank the reviewer for constructive feedback. Reviewer suggested [...]. We appreciate this suggestion and have [action taken]"

# Respectful disagreement
/research:manuscript:reviewer "Reviewer suggests [...]. We respectfully disagree on this point because [scientific rationale]. We have [provided additional evidence/analysis] to support our approach"

# Point to evidence
/research:manuscript:reviewer "Reviewer noted [...]. We agree this is important. Supporting evidence is found in [previous work], and our analysis extends this by [contribution]"
```

**Step 3:** Specify professional tone

```bash
# Request professional tone
/research:manuscript:reviewer "REVIEWER COMMENT" --tone professional

# Request collaborative tone
/research:manuscript:reviewer "REVIEWER COMMENT" --tone collaborative

# Request detailed technical response
/research:manuscript:reviewer "REVIEWER COMMENT" --tone technical

# Request gratitude-focused response
/research:manuscript:reviewer "REVIEWER COMMENT" --tone appreciative
```

**Step 4:** Structure responses professionally

```bash
# Good structure:
1. Thank reviewer for feedback
2. Acknowledge the concern
3. Explain your perspective
4. Describe analysis or evidence
5. Show how manuscript was improved
6. Highlight new contributions

# Use template:
/research:manuscript:reviewer "Comment: [...].

Response: We thank the reviewer for this constructive feedback. The concern about [...] is valid. To address this, we [action taken]. Our supplementary analysis (Table X) demonstrates [...]. The revised manuscript now includes [...], strengthening the contribution."
```

**Step 5:** Review and refine response

```bash
# If tone seems off:
# 1. Read response aloud
# 2. Look for dismissive language
# 3. Verify all concerns acknowledged
# 4. Check for proper citations
# 5. Ensure professional language

# Common tone problems to fix:
# "obviously" → "as demonstrated in"
# "simply" → "straightforwardly"
# "just" → remove or replace
# "they missed" → "we extend prior work by"
# "this is wrong" → "this is an important point that we address by"
```

**Expected:** Professional, respectful response that acknowledges concerns and explains actions taken.

**Reviewer Response Template:**

```markdown
**Comment:** [Summary of reviewer's concern]

**Response:** We thank Reviewer X for this thoughtful comment. [Acknowledge validity of concern]. To address this point, we [specific action taken]. Our revised [section/figure/table] now demonstrates [result]. This addition strengthens the contribution by [benefit].
```

**Response Quality Checklist:**

- [ ] Thanks reviewer for feedback
- [ ] Acknowledges the concern raised
- [ ] Does not sound defensive
- [ ] Provides specific actions taken
- [ ] References evidence or analyses
- [ ] Professional and collaborative tone
- [ ] Not dismissive of reviewer expertise
- [ ] Clear commitment to improvement

**Prevention:**

- Wait 24 hours before responding to reviews
- Have colleague review your response
- Use neutral language templates
- Focus on "what we learned" not "who was right"
- Remember: reviewers want paper to be better

**Related:**

- [Quality Concerns](#problem-quality-concerns)
- [FAQ: Reviewer Responses](../help/FAQ-research.md#responding-to-reviewers)

---

### Problem: Proof Review Accuracy Concerns

**Symptoms:**

- Proof review misses obvious errors
- Mathematical notation errors not caught
- Logic flow problems not identified
- Critical assumptions not mentioned
- Inconsistent variable usage not flagged
- Generated feedback seems superficial

**Common Causes:**

1. Proof too complex for command to fully understand
2. Notation not clearly defined before proof
3. Assumptions not explicitly stated
4. Missing context about what to verify
5. Command treating as generic text, not mathematical proof

**Diagnosis:**

```bash
# Review generated feedback
/research:manuscript:proof "PROOF TEXT" --debug

# Check if feedback is superficial
# Does it identify logical steps?
# Does it mention assumptions?
# Does it catch notation issues?

# Compare with manual review
# Are there errors the command missed?
```

**Solution:**

**Step 1:** Provide complete context

```bash
# WRONG: Minimal context
/research:manuscript:proof "If X then Y because α > 0 implies..."

# RIGHT: Full context
/research:manuscript:proof "Theorem: Under the sequential ignorability assumption and consistency, the indirect effect θ equals α × β.

Proof: Let M denote the mediator and Y the outcome. Under sequential ignorability (Imai et al., 2010) and no unmeasured confounding of M→Y, we show that...

[Full proof text with all assumptions and lemmas]"

# BETTER: Include assumptions and definitions
/research:manuscript:proof "Assumptions: 1) Sequential ignorability, 2) Consistency, 3) Positivity

Definitions: α = effect of Z on M, β = effect of M on Y|Z

Theorem: [Statement]

Proof: [Full mathematical derivation]"
```

**Step 2:** Define notation clearly

```bash
# WRONG: Notation used without definition
/research:manuscript:proof "By the chain rule, θ = α·β because..."

# RIGHT: Define all notation first
/research:manuscript:proof "Notation: Z = treatment, M = mediator, Y = outcome, α = coefficient of Z in mediator model, β = coefficient of M in outcome model.

Proof: By the chain rule of partial derivatives, θ = ∂E[Y]/∂Z = ∂E[Y]/∂M · ∂E[M]/∂Z = α·β"
```

**Step 3:** Request specific verification

```bash
# Generic review
/research:manuscript:proof "PROOF TEXT"

# Specific verification
/research:manuscript:proof "PROOF TEXT" --verify assumptions

# Check notation consistency
/research:manuscript:proof "PROOF TEXT" --check-notation

# Check logical flow
/research:manuscript:proof "PROOF TEXT" --check-logic

# Verify all steps complete
/research:manuscript:proof "PROOF TEXT" --check-completeness

# All checks
/research:manuscript:proof "PROOF TEXT" --verify all
```

**Step 4:** Request step-by-step validation

```bash
# Ask for line-by-line review
/research:manuscript:proof "PROOF TEXT" --detailed

# Ask for intermediate steps verification
/research:manuscript:proof "PROOF TEXT" --verify-steps

# Ask to identify all assumptions
/research:manuscript:proof "PROOF TEXT" --list-assumptions

# Ask to check for circular reasoning
/research:manuscript:proof "PROOF TEXT" --check-circularity
```

**Step 5:** Verify critical elements

```bash
# Ensure review identifies:
# 1. All assumptions used
# 2. All notation defined
# 3. Logical flow correct
# 4. All steps justified
# 5. Conclusion follows from premises
# 6. Edge cases considered

/research:manuscript:proof "PROOF TEXT. Please identify:
1. All assumptions used (stated or implicit)
2. Where each assumption is first used
3. Any circular reasoning
4. Any gaps in logic
5. Counterexamples or edge cases"
```

**Step 6:** Use for final verification, not primary review

```bash
# CORRECT USE:
# 1. Write proof yourself
# 2. Have colleague review
# 3. Use command for final polish
# 4. Verify command findings match your review

# INCORRECT USE:
# 1. Write proof quickly
# 2. Use command as primary review
# 3. Trust command over mathematical expertise

# Best practice:
# Use command to:
# - Check for typos and notation errors
# - Verify all steps present
# - Catch obvious gaps
# NOT as primary mathematical review
```

**Expected:** Feedback identifies logical flow, assumptions used, notation inconsistencies, and any gaps in reasoning.

**Proof Review Checklist (for your verification):**

- [ ] All assumptions explicitly stated
- [ ] All notation defined before use
- [ ] Each step justified or referenced
- [ ] No circular reasoning
- [ ] Conclusion follows from premises
- [ ] Edge cases considered
- [ ] Notation consistent throughout
- [ ] Mathematical rigor appropriate for field

**Prevention:**

- Always manually review proofs first
- Have mathematician/statistician co-review
- Use command for final verification, not primary review
- Be skeptical of command feedback on complex proofs
- Verify assumptions explicitly before proof

**Security Note:**

- Do not rely solely on AI for mathematical proof verification
- Mathematical rigor is critical for publication
- Always have human expert review
- Command is useful for catching obvious errors, not comprehensive verification

**Related:**

- [Notation Inconsistencies](#problem-citation-format-errors)
- [Quality Concerns](#problem-quality-concerns)

---

## Simulation Command Issues

### Problem: Design Parameters Unclear

**Symptoms:**

- Generated design is too vague about parameters
- Sample sizes not appropriate for problem
- Number of replications seems arbitrary
- Performance metrics not defined
- Design doesn't match your research question

**Common Causes:**

1. Input prompt too brief or non-specific
2. Research question not clearly defined
3. Context about field/methods not provided
4. No information about computational resources
5. Expected effect sizes not mentioned

**Diagnosis:**

```bash
# Check generated design
cat design.md | head -50

# Look for specificity in:
# - Sample sizes
# - Number of replications
# - Effect sizes
# - Performance metrics

# Compare with your expectations
# Does design address your research question?
```

**Solution:**

**Step 1:** Define research question clearly

```bash
# WRONG: Vague question
/research:simulation:design "Compare two methods"

# RIGHT: Specific question
/research:simulation:design "Compare bootstrap percentile vs BCa confidence intervals for mediation effects in terms of coverage probability and interval width"

# BETTER: Include context
/research:simulation:design "Compare bias, MSE, and coverage of bootstrap percentile vs BCa methods for estimating indirect effects in mediation analysis. Focus on small to moderate sample sizes (n=50 to 500) and varying effect sizes."
```

**Step 2:** Specify sample sizes and effect sizes

```bash
# Include expected ranges
/research:simulation:design "Design Monte Carlo study comparing methods for sample sizes n=50, 100, 200, 500. Effect sizes: small (α=0.2, β=0.2), medium (α=0.35, β=0.25), large (α=0.5, β=0.4)."

# Include practical context
/research:simulation:design "Study design with typical sample sizes from our field (RCTs usually n=200-500). Expected effect sizes from meta-analysis (Cohen's d = 0.3-0.5 range)."

# Include power considerations
/research:simulation:design "Design to achieve 80% power for detecting effect size d=0.3 at α=0.05. Across sample sizes where power varies from 60-95%."
```

**Step 3:** Request specific performance metrics

```bash
# Specify what to measure
/research:simulation:design "TOPIC. Primary metrics: bias (percent), MSE, coverage probability for 95% CI. Secondary metrics: power, Type I error, computational time."

# Specify metric definitions
/research:simulation:design "TOPIC. Define coverage as proportion of 1000 replications where true parameter falls within reported confidence interval. Bias as mean(estimate - true_value)."

# Request specific summary statistics
/research:simulation:design "TOPIC. Include mean, SD, min, max for each metric across replications."
```

**Step 4:** Include computational context

```bash
# Specify computational resources
/research:simulation:design "TOPIC. We have access to [local computer / cluster]. Expected run time: [hours/days]. Total replications budget: [time/money]."

# Request efficient design
/research:simulation:design "TOPIC. Please suggest efficient design that runs in <24 hours on standard laptop. Prioritize key conditions."

# Request scalable design
/research:simulation:design "TOPIC. Design should scale: start with 1000 replications for initial results, then expand to 10,000 for final results."
```

**Step 5:** Add specific software/method details

```bash
# Include implementation details
/research:simulation:design "TOPIC. Implementation in R using mediation package and boot package. Parallel processing with 4 cores available."

# Include algorithm choices
/research:simulation:design "TOPIC. Bootstrap using percentile method with 10,000 replicates per sample. Random seed: 2024 for reproducibility."

# Include data generation process
/research:simulation:design "TOPIC. Data generated from Y = β₀ + β₁Z + β₂M + εᵧ, M = α₀ + α₁Z + εₘ, with εₘ, εᵧ ~ N(0,1)."
```

**Expected:** Design document with clearly specified:

- Research question
- Sample sizes and rationale
- Effect sizes and source
- Number of replications
- Performance metrics and definitions
- Data generation process
- Analysis plan
- Expected computational requirements

**Design Specification Checklist:**

- [ ] Research question clearly stated
- [ ] Sample sizes: specific values with rationale
- [ ] Effect sizes: values and sources
- [ ] Replications: number and justification
- [ ] Metrics: defined operationally
- [ ] Data generation: mathematical specification
- [ ] Analysis plan: step-by-step procedures
- [ ] Software: specific packages and versions
- [ ] Computational needs: estimated time and resources

**Prevention:**

- Write clear research question before designing
- Specify all parameters explicitly
- Get design reviewed by statistician
- Verify design aligns with research question
- Document all parameter choices

**Related:**

- [Simulation Runtime Issues](#problem-simulation-runtime-issues)
- [Design vs. Implementation Mismatch](../tutorials/research/simulation-study.md)

---

### Problem: Code Generation Failures

**Symptoms:**

- Generated simulation code doesn't run
- R/Python syntax errors
- Missing functions or packages
- Code references undefined variables
- Generated code incomplete or malformed

**Common Causes:**

1. Language not specified (R vs Python)
2. Package dependencies not installed
3. Generated code has syntax errors
4. Code generation timeout
5. Complex design not translatable to code

**Diagnosis:**

```bash
# Check generated code
/research:simulation:design "TOPIC" --output code

# Try running generated code
# Check for errors
R < generated_code.R 2>&1 | head -50

# Check what packages are needed
grep "library\|import" generated_code.R

# Verify packages installed
R -e "installed.packages()[c('boot','mediation'),]"
```

**Solution:**

**Step 1:** Specify target language

```bash
# Explicitly request R code
/research:simulation:design "TOPIC" --language R

# Request Python code
/research:simulation:design "TOPIC" --language python

# Request both
/research:simulation:design "TOPIC" --language "R,python"

# Specify version
/research:simulation:design "TOPIC" --language R --version 4.3
```

**Step 2:** Install required packages

```bash
# For R, install dependencies
R -e "install.packages(c('boot', 'mediation', 'tidyverse'))"

# For Python, install dependencies
pip install numpy scipy pandas

# Verify installation
R -e "library(boot); sessionInfo()"
python -c "import numpy; print(numpy.__version__)"
```

**Step 3:** Request code with error handling

```bash
# Request code with comments
/research:simulation:design "TOPIC" --output code --include-comments

# Request code with validation
/research:simulation:design "TOPIC" --output code --include-validation

# Request minimal reproducible example
/research:simulation:design "TOPIC" --output code --minimal

# Request full working example
/research:simulation:design "TOPIC" --output code --full --test
```

**Step 4:** Test generated code incrementally

```bash
# Step 1: Test data generation only
head -50 generated_code.R > test_data.R
R < test_data.R

# Step 2: Test single iteration
head -100 generated_code.R > test_single.R
R < test_single.R

# Step 3: Test with small number of replications
sed 's/n_reps = 10000/n_reps = 10/' generated_code.R > test_small.R
R < test_small.R

# Step 4: Run full code if tests pass
R < generated_code.R
```

**Step 5:** Fix common syntax errors

```bash
# WRONG: Missing function definition
results <- bootstrap_ci(data)

# RIGHT: Use library or define function
library(boot)
results <- boot::boot(data, statistic=func, R=10000)

# WRONG: Undefined variable
result <- analyze(x, y, method=method_var)

# RIGHT: Define variable first
method_var <- "percentile"
result <- analyze(x, y, method=method_var)

# WRONG: Incorrect syntax
for i in 1:n_reps

# RIGHT: R syntax
for(i in 1:n_reps)
```

**Step 6:** Use as starting point, not final code

```bash
# BEST PRACTICE:
# 1. Request code structure/outline
# 2. Generate and review code
# 3. Manually test simple version
# 4. Fix any syntax errors
# 5. Expand to full simulation

# Request code scaffold
/research:simulation:design "TOPIC" --output code --skeleton

# Request code review feedback
/research:simulation:design "TOPIC" --review-code

# Request debugging help
# Share error message:
/research:simulation:design "My code produces: [error message]. Generated from: [design]. How do I fix this?"
```

**Expected:** Runnable code that:

- Executes without syntax errors
- Generates correct output format
- Completes in reasonable time
- Can be extended for full simulation

**Code Quality Checklist:**

- [ ] Syntax correct for language (R/Python)
- [ ] All functions defined or imported
- [ ] All packages listed and available
- [ ] All variables defined before use
- [ ] Comments explain key sections
- [ ] Output saved in expected format
- [ ] Runs without errors
- [ ] Produces expected structure

**Prevention:**

- Always test code before running full simulation
- Start with minimal example (n=10 replications)
- Specify language and version explicitly
- Install packages before running
- Have manual code review
- Keep generated code for reference, write production code manually

**Related:**

- [R/Python Syntax Errors](#problem-rpython-syntax-errors)
- [Simulation Runtime Issues](#problem-simulation-runtime-issues)

---

### Problem: R/Python Syntax Errors

**Symptoms:**

- "Unexpected symbol" or "invalid syntax" errors
- Function not found errors
- Missing package errors
- Vectorization problems
- Data type mismatches

**Common Causes:**

1. R vs Python syntax confusion
2. Package not loaded
3. Function parameters incorrect
4. Data type incompatibilities
5. Indentation issues (Python)

**Diagnosis:**

```bash
# R: Check syntax
R -c "source('code.R')" 2>&1

# Python: Check syntax
python -m py_compile code.py

# R: Show error with line numbers
R CMD BATCH --vanilla code.R code.Rout
tail code.Rout

# Python: Show full traceback
python code.py
```

**Solution:**

**R Syntax Errors:**

```r
# WRONG: Missing $ for data frame access
x <- data[col_name]

# RIGHT: Use $ or [[ ]]
x <- data$col_name
x <- data[["col_name"]]

# WRONG: Missing function import
result <- boot(data, statistic, R=1000)

# RIGHT: Load package first
library(boot)
result <- boot(data, statistic, R=1000)

# WRONG: Incorrect parameter
lm(data$y ~ data$x, data)

# RIGHT: Use formula notation
lm(y ~ x, data=data)

# WRONG: Vectorization issue
if(x > 0) result <- "positive"  # Error if x is vector

# RIGHT: Use ifelse or vectorized comparison
result <- ifelse(x > 0, "positive", "negative")

# WRONG: Type mismatch
mean(c("a", "b", "c"))

# RIGHT: Numeric vector
mean(c(1, 2, 3))
```

**Python Syntax Errors:**

```python
# WRONG: Missing colon
if x > 0
    print("positive")

# RIGHT: Colon required
if x > 0:
    print("positive")

# WRONG: Indentation error
for i in range(10):
print(i)  # Not indented

# RIGHT: Proper indentation
for i in range(10):
    print(i)

# WRONG: Array vs list confusion
x = np.array([1, 2, 3])
y = x.append(4)

# RIGHT: numpy append returns copy
x = np.append(x, 4)

# WRONG: Missing import
result = pd.DataFrame(data)

# RIGHT: Import pandas
import pandas as pd
result = pd.DataFrame(data)

# WRONG: Division behavior (Python 2)
result = 3 / 2  # Returns 1, not 1.5

# RIGHT: Use float division
result = 3 / 2  # Returns 1.5 (Python 3)
result = 3.0 / 2  # Returns 1.5 (Python 2)
```

**Solution Steps:**

**Step 1:** Read error message carefully

```bash
# R error usually shows:
# Error in function(args) : error message
#    ^- Function name
#        ^- Error description

# Python error shows traceback:
# File "code.py", line XX
#   error line of code
#   ^--- Point of error
# ErrorType: error message

# Go to line number shown in error
```

**Step 2:** Test simpler version

```r
# R: Test piece by piece
x <- 1:10
y <- rnorm(10)
summary(lm(y ~ x))

# Python: Test step by step
x = range(10)
y = [random.random() for _ in x]
import pandas as pd
df = pd.DataFrame({'x': x, 'y': y})
```

**Step 3:** Check package/module versions

```r
# R: Check version compatibility
sessionInfo()
packageVersion("package_name")

# Python: Check versions
import sys; print(sys.version)
import numpy; print(numpy.__version__)
```

**Step 4:** Use built-in help

```r
# R: Get help on function
?function_name
help(function_name)
example(function_name)

# Python: Get help
help(function_name)
function_name?  # In Jupyter
dir(object)  # See attributes/methods
```

**Step 5:** Copy error message and ask for help

```bash
# Share full error output:
/research:simulation:design "I'm getting this error: [full error message]

When running this code: [code snippet]

From this design: [design description]"
```

**Expected:** Code runs without syntax errors.

**Prevention:**

- Start with simple example
- Test each section separately
- Use IDE with syntax highlighting
- Check package documentation
- Run small replication first (n=10)

**Related:**

- [Code Generation Failures](#problem-code-generation-failures)
- [Simulation Runtime Issues](#problem-simulation-runtime-issues)

---

### Problem: Simulation Runtime Issues

**Symptoms:**

- Simulation takes much longer than expected
- Memory usage increases over time
- Process crashes or runs out of memory
- Code seems to hang/freeze
- Partial results but no completion message

**Common Causes:**

1. Too many replications for available resources
2. Inefficient code (nested loops, no vectorization)
3. Memory leak in implementation
4. Insufficient RAM for large matrices
5. Parallel processing not configured correctly

**Diagnosis:**

```bash
# Check resource availability
free -h  # Linux/Mac
top -l 1 | head -15  # macOS

# Monitor running process
top -p $(pgrep -f "Rscript simulation.R")

# Check script for efficiency
grep -n "for\|while\|apply" simulation.R | head -10

# Estimate memory needed
# Number_of_replications × Data_size_per_replication × Complexity
```

**Solution:**

**Step 1:** Reduce complexity for testing

```bash
# Start with minimal test
# E.g., 10 replications instead of 10,000

# In R code
n_reps <- 10  # Down from 10000

# Run test
time Rscript simulation.R

# Record time: if 10 reps takes 2 seconds
# 10,000 reps would take: 2 * (10000/10) = 2000 seconds = 33 minutes
```

**Step 2:** Optimize code

```r
# WRONG: Inefficient loop
results <- c()
for(i in 1:10000) {
  results[i] <- mean(rnorm(100))
}

# RIGHT: Vectorized or efficient
results <- replicate(10000, mean(rnorm(100)))

# WRONG: Inefficient nested loop
for(i in 1:1000) {
  for(j in 1:1000) {
    data[i,j] <- complicated_function(i, j)
  }
}

# RIGHT: Vectorized
data <- outer(1:1000, 1:1000, Vectorize(complicated_function))
```

**Step 3:** Reduce replications for initial test

```bash
# Phase 1: Quick test
n_reps <- 100   # ~1-2 minutes

# Phase 2: Reasonable test
n_reps <- 1000  # ~10-20 minutes

# Phase 3: Full study
n_reps <- 10000 # Final results
```

**Step 4:** Enable parallel processing

```r
# R: Use parallel package
library(parallel)
n_cores <- detectCores()  # Detect available cores
cl <- makeCluster(n_cores)

# Use parallel apply instead of regular loop
results <- parLapply(cl, 1:n_reps, function(i) {
  # Your replication code here
})
stopCluster(cl)
```

**Python:**

```python
import multiprocessing as mp
from functools import partial

# Use pool
with mp.Pool(mp.cpu_count()) as pool:
    results = pool.map(run_single_replication, range(n_reps))
```

**Step 5:** Monitor memory usage

```bash
# R: Monitor memory
gc()  # Run garbage collection
object.size(results)  # Check object size

# Python: Monitor memory
import tracemalloc
tracemalloc.start()
# ... your code ...
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
```

**Step 6:** Adjust design for resources

```bash
# If running out of memory:
# Option 1: Reduce replications
n_reps <- 5000  # Instead of 10000

# Option 2: Reduce sample sizes
sample_sizes <- c(50, 100, 200)  # Skip larger sizes initially

# Option 3: Reduce effect size conditions
effect_sizes <- c(0.2, 0.5)  # Only 2 instead of 5

# Option 4: Process in batches and save results
# Run simulation in chunks of 1000, save after each
```

**Expected:** Simulation completes in reasonable time (<24 hours), produces complete results.

**Efficiency Checklist:**

- [ ] Code is vectorized (minimal loops)
- [ ] Memory cleaned between replications (gc())
- [ ] Parallel processing configured
- [ ] Number of replications appropriate
- [ ] Sample sizes reasonable
- [ ] Progress monitoring implemented
- [ ] Results saved to disk

**Example Efficient Code (R):**

```r
# Generate all random data at once
set.seed(2024)
n_reps <- 10000
Z <- rbinom(n_reps, 1, 0.5)
M <- rnorm(n_reps)
Y <- rnorm(n_reps)

# Vectorized analysis
indirect_effect <- replicate(n_reps, {
  alpha <- coef(lm(M ~ Z))[2]
  beta <- coef(lm(Y ~ M + Z))[2]
  alpha * beta
})

# Calculate metrics
bias <- mean(indirect_effect) - true_effect
mse <- mean((indirect_effect - true_effect)^2)
```

**Prevention:**

- Test with small replication first
- Monitor runtime during development
- Use vectorized operations
- Enable parallel processing
- Save intermediate results

**Related:**

- [Design Parameters Unclear](#problem-design-parameters-unclear)
- [Code Generation Failures](#problem-code-generation-failures)

---

### Problem: Analysis Output Problems

**Symptoms:**

- Results file empty or incomplete
- Wrong data format in output
- Missing columns in results table
- Statistics not calculated
- Aggregation failed

**Common Causes:**

1. Output file path incorrect
2. Results not saved to disk
3. Data format mismatch
4. Analysis didn't complete
5. Aggregation function has errors

**Diagnosis:**

```bash
# Check if output file exists
ls -lh results.csv

# Check file contents
head results.csv
wc -l results.csv

# Check if code ran to completion
tail results.csv
grep -i "error\|failed\|incomplete" results.csv

# Check column names
head -1 results.csv | tr ',' '\n'
```

**Solution:**

**Step 1:** Verify output file location

```bash
# Check where results are saved
# Look in code for output file path
grep "write" simulation.R
grep "write" analysis.py
grep "saveRDS\|csv" simulation.R

# Search for results file
find ~ -name "results*" -type f 2>/dev/null

# If not found, results may not have been saved
```

**Step 2:** Ensure results are saved

```r
# R: Save results explicitly
saveRDS(results, "results.rds")
write.csv(results, "results.csv", row.names = FALSE)

# Python: Save results
import pandas as pd
results_df.to_csv("results.csv", index=False)

# Or save as json
results_df.to_json("results.json")
```

**Step 3:** Check data format

```bash
# Expected CSV format
condition,n,method,bias,mse,coverage
sim_50_1,50,percentile,0.012,0.045,0.932
sim_50_2,50,percentile,0.015,0.048,0.929

# Check actual format
head -5 results.csv

# If wrong format, reshape manually
```

**Step 4:** Verify analysis completed

```bash
# R: Check for completion marker
tail -10 results.csv
# Look for final row with all columns

# Count rows (should equal number of conditions × replications)
wc -l results.csv  # Should be n_reps × n_conditions + 1 (header)

# Python: Check file size
ls -lh results.csv
# Large file = likely completed
# Small/empty file = likely failed
```

**Step 5:** Re-run with debugging

```r
# R: Add verbose output
print(paste("Starting replication", i))
results_i <- analyze(data_i)
print(paste("Replication", i, "completed with bias =", results_i$bias))
write.csv(results_i, paste0("results_", i, ".csv"))

# Python: Add logging
import logging
logging.basicConfig(level=logging.INFO)
logging.info(f"Starting replication {i}")
result_i = analyze(data_i)
logging.info(f"Replication {i} bias = {result_i['bias']}")
```

**Step 6:** Check intermediate results

```bash
# If simulation crashed partway through
# Look for partial results
ls results_*.csv | wc -l  # How many individual files?

# Combine partial results
cat results_1.csv > results_all.csv
tail -n +2 results_2.csv >> results_all.csv
tail -n +2 results_3.csv >> results_all.csv

# Continue from where simulation stopped
# Modify code to start from condition N+1
```

**Expected:** Results file with complete data, all columns, proper format.

**Results File Checklist:**

- [ ] File exists at expected location
- [ ] File is not empty (>1 KB)
- [ ] Header row present with column names
- [ ] All expected columns present
- [ ] Data rows complete (no missing values)
- [ ] File format correct (CSV, RDS, JSON)
- [ ] Replication count matches expectation
- [ ] All conditions represented

**Prevention:**

- Save intermediate results (every 100 replications)
- Use progress bars to verify code running
- Check file size periodically
- Test save/load cycle in development
- Plan disk space for results

**Related:**

- [Performance Metrics Missing](#problem-performance-metrics-missing)
- [Result Interpretation Unclear](#problem-analysis-output-problems)

---

### Problem: Performance Metrics Missing

**Symptoms:**

- Bias not calculated
- MSE not reported
- Coverage probability missing
- Other metrics incomplete
- Summary statistics unavailable

**Common Causes:**

1. Metric calculations not in code
2. Incorrect data format for calculations
3. Results incomplete (see above)
4. Metrics calculated but not saved
5. Summary statistics script didn't run

**Diagnosis:**

```bash
# Check what metrics are in results file
head -1 results.csv | tr ',' '\n'

# Expected metrics
# - bias: mean(estimate - true_value)
# - mse: mean((estimate - true_value)^2)
# - coverage: proportion where CI contains truth

# Check if calculation code exists
grep -i "bias\|mse\|coverage" analysis.R
```

**Solution:**

**Step 1:** Verify true values known

```r
# Metrics require knowing the true parameter value

# WRONG: No true value specified
results <- data.frame(
  estimate = estimates,
  ci_lower = ci_lower,
  ci_upper = ci_upper
)
# Can't calculate bias without true_value

# RIGHT: Include true value
true_effect <- 0.3
results <- data.frame(
  estimate = estimates,
  true_value = true_effect,
  bias = estimates - true_effect,
  ci_lower = ci_lower,
  ci_upper = ci_upper
)
```

**Step 2:** Calculate basic metrics

```r
# R: Calculate metrics
true_indirect_effect <- 0.30

# Bias: mean(estimate - truth)
bias <- mean(estimates - true_indirect_effect)

# MSE: mean((estimate - truth)^2)
mse <- mean((estimates - true_indirect_effect)^2)

# Standard error of estimate
se_estimate <- sd(estimates)

# Coverage: proportion of CIs containing truth
coverage <- mean(ci_lower <= true_indirect_effect &
                 ci_upper >= true_indirect_effect)

# Summary
results <- data.frame(
  metric = c("bias", "mse", "se", "coverage"),
  value = c(bias, mse, se_estimate, coverage)
)
```

**Python:**

```python
import numpy as np

# Calculate metrics
bias = np.mean(estimates - true_effect)
mse = np.mean((estimates - true_effect) ** 2)
se = np.std(estimates)
coverage = np.mean((ci_lower <= true_effect) & (ci_upper >= true_effect))
```

**Step 3:** Request summary statistics from results

```bash
# If you have results but no summary:
/research:simulation:analysis results.csv

# Command automatically calculates:
# - Bias, MSE, coverage for each condition
# - Creates summary tables
# - Produces visualization code
```

**Step 4:** Add missing metrics

```bash
# Generate code to calculate additional metrics
/research:simulation:design "TOPIC" --output code --include-metrics

# Specify which metrics needed
/research:simulation:design "TOPIC" --output code --metrics "bias, mse, coverage, power, type1_error"
```

**Step 5:** Run analysis command

```bash
# Use /research:simulation:analysis to calculate all metrics
# From results file

/research:simulation:analysis results.csv

# Or from directory with multiple condition files
/research:simulation:analysis results/

# Specify output format
/research:simulation:analysis results.csv --output markdown
/research:simulation:analysis results.csv --output tables
```

**Expected:** Results include bias, MSE, coverage, and other relevant metrics.

**Standard Metrics by Command Type:**

| Metric | Formula | When to Use |
|--------|---------|------------|
| Bias | mean(est - true) | Estimation accuracy |
| MSE | mean((est - true)²) | Estimation precision |
| Coverage | % where CI contains true | Confidence interval validity |
| Power | % where p < 0.05 (true effect) | Test effectiveness |
| Type I Error | % where p < 0.05 (null true) | False positive rate |
| Efficiency | var(estimator) ratio | Relative performance |
| CI Width | mean(upper - lower) | Precision of CI |

**Prevention:**

- Specify metrics in design phase
- Include metric calculations in simulation code
- Verify metrics in test run
- Use /research:simulation:analysis command

**Related:**

- [Analysis Output Problems](#problem-analysis-output-problems)
- [Result Interpretation Unclear](#problem-analysis-output-problems)

---

## Research Planning Issues

### Problem: Gap Analysis Too Broad

**Symptoms:**

- Gap analysis identifies too many research directions
- Recommendations not specific to your topic
- Gaps are too general or well-known
- Actionable items unclear
- Analysis doesn't narrow scope

**Common Causes:**

1. Topic too broad (e.g., "mediation analysis" vs "mediation in health psychology")
2. Not specifying existing work or context
3. Asking for all possible gaps vs. specific areas
4. Missing information about your specific focus

**Diagnosis:**

```bash
# Review generated gap analysis
cat gap_analysis.md | head -100

# Check if gaps are specific to your area
# Are they relevant to your research question?
# Can you act on the recommendations?
```

**Solution:**

**Step 1:** Define scope clearly

```bash
# WRONG: Too broad
/research:lit-gap "mediation analysis"

# RIGHT: Specific scope
/research:lit-gap "Methods for mediation analysis in health psychology research"

# BETTER: Add constraints
/research:lit-gap "Statistical methods for mediation analysis in RCT designs with small sample sizes (n<100) in clinical psychology"

# MOST SPECIFIC: Add context
/research:lit-gap "Confidence interval methods for mediation analysis in RCTs. Current literature emphasizes bootstrapping and quasi-Bayesian approaches. Gap: coverage of methods for small samples (n=30-50) with non-normal mediators under MCAR missingness."
```

**Step 2:** Specify existing knowledge

```bash
# Include what's already established
/research:lit-gap "Mediation analysis. Bootstrap methods well-established (Efron & Tibshirani). Percentile and BCa methods compared in MacKinnon et al. (2004). Recently: ML-based bounds (Vansteelandt & VanderWeele, 2022). Gap: comparison with Bayesian sensitivity analysis methods"

# Include scope of literature review
/research:lit-gap "Search scope: mediation analysis + RCTs. Coverage: 2015-2025. Exclusions: qualitative studies, review articles. Findings: X, Y, Z addressed. Gaps: [specific areas]"
```

**Step 3:** Request gaps in specific areas

```bash
# Focus on methodological gaps
/research:lit-gap "TOPIC" --focus methodology

# Focus on application gaps
/research:lit-gap "TOPIC" --focus applications

# Focus on computational/software gaps
/research:lit-gap "TOPIC" --focus software

# Focus on population-specific gaps
/research:lit-gap "TOPIC" --focus populations
```

**Step 4:** Request actionable gaps only

```bash
# Ask for gaps you could address
/research:lit-gap "TOPIC. Please identify gaps that could be addressed through: (a) methodological paper, (b) application study, (c) simulation study. Focus on realistic gaps for a PhD dissertation."

# Specify feasibility constraints
/research:lit-gap "TOPIC. Identify gaps addressable within: 2-year timeline, one student researcher, with access to R and standard statistical methods."
```

**Step 5:** Ask for next steps

```bash
# Request prioritization
/research:lit-gap "TOPIC. Rank identified gaps by: feasibility, impact, novelty, feasibility for PhD dissertation."

# Request specific research questions
/research:lit-gap "TOPIC. For top 3 gaps, generate specific research questions and hypotheses that could be tested."

# Request related gaps
/research:lit-gap "TOPIC. Which gaps depend on others being addressed first? What's the prerequisite order?"
```

**Expected:** 3-5 specific, actionable gaps with clear connections to existing literature.

**Gap Analysis Checklist:**

- [ ] Scope narrower than original topic
- [ ] Builds on specific prior work cited
- [ ] Gaps are specific, not general
- [ ] Gaps are feasible to address
- [ ] Clear next steps identified
- [ ] Relevant to your research interests
- [ ] Supported by evidence from literature

**Prevention:**

- Define your specific research question first
- Read recent reviews before asking for gaps
- Specify constraints (time, resources, expertise)
- Focus on gaps within your expertise area

**Related:**

- [Hypothesis Generation Unclear](#problem-hypothesis-generation-unclear)
- [Analysis Plan Incomplete](#problem-analysis-plan-incomplete)

---

### Problem: Hypothesis Generation Unclear

**Symptoms:**

- Generated hypotheses are too obvious
- Hypotheses don't connect to your study
- Statistical hypothesis not properly formulated
- Alternative hypothesis unclear
- Power and sample size not addressed

**Common Causes:**

1. Not specifying prior research or context
2. Not providing study design details
3. Asking for general hypotheses vs. specific
4. Missing information about variables

**Diagnosis:**

```bash
# Review generated hypotheses
cat hypotheses.md | head -50

# Check structure:
# - H₀ (null hypothesis)
# - H₁ (alternative hypothesis)
# - Type I and II error rates
# - Statistical test procedures
# - Sample size and power
```

**Solution:**

**Step 1:** Provide study design context

```bash
# WRONG: Minimal context
/research:hypothesis "Does treatment affect outcome?"

# RIGHT: Study design included
/research:hypothesis "RCT design: 300 participants, treatment vs. control. Primary outcome: depression symptoms (PHQ-9). Mediator: social support. Hypothesis: treatment effect is mediated by increased social support."

# BETTER: Specific context with values
/research:hypothesis "RCT design: 300 participants randomized 1:1. Intervention: 8-week cognitive-behavioral therapy. Control: waitlist. Primary outcome: PHQ-9 (depression severity, 0-27). Mediator: UCLA Loneliness Scale (6 items). Baseline measurements: 1 week pre-randomization. Follow-up: 12 weeks post-randomization. Hypothesize: direct effect τ=2.0 (reduction of 2 PHQ-9 points), indirect effect θ=1.0."
```

**Step 2:** Specify hypothesis type

```bash
# Request formal statistical hypothesis
/research:hypothesis "TOPIC" --type formal

# Request directional hypothesis
/research:hypothesis "TOPIC" --type directional

# Request non-inferiority hypothesis
/research:hypothesis "TOPIC" --type noninferiority

# Request equivalence hypothesis
/research:hypothesis "TOPIC" --type equivalence
```

**Step 3:** Include information about prior research

```bash
# Add what's known from literature
/research:hypothesis "TOPIC. Prior studies show effect sizes: d=0.4-0.6 (Smith et al., 2020), d=0.3-0.5 (Jones et al., 2021). We expect comparable effect in our population. Hypothesis: treatment effect d>0.3 vs. null d=0."

# Reference expected values
/research:hypothesis "TOPIC. Meta-analysis summary effect: θ=0.25 (95% CI [0.15, 0.35]). We hypothesize our effect at least as large."
```

**Step 4:** Request power analysis

```bash
# Include power analysis
/research:hypothesis "TOPIC. Calculate sample size needed for 80% power to detect minimum clinically important difference. Type I error α=0.05 (two-tailed)."

# Ask for sensitivity analysis
/research:hypothesis "TOPIC. Provide sample sizes for 80%, 90%, and 95% power."

# Include multiple comparisons
/research:hypothesis "TOPIC. Multiple testing: primary outcome, 2 secondary outcomes, 3 sensitivity analyses. Bonferroni or other adjustment method?"
```

**Step 5:** Request testable hypotheses

```bash
# Ensure hypotheses are testable
/research:hypothesis "TOPIC. Generate hypotheses that are: (a) testable with our design, (b) specific about expected direction and magnitude, (c) connected to prior theory, (d) include statistical test procedures and sample size requirements."

# Request hypothesis hierarchy
/research:hypothesis "TOPIC. Specify: primary hypothesis (80% power), secondary hypotheses (exploratory), hypotheses to pre-register."
```

**Expected:** Formal statistical hypotheses with:

- Null and alternative hypotheses clearly stated
- Direction and magnitude specified
- Type I and II error rates
- Sample size and power analysis
- Statistical test procedures

**Hypothesis Checklist:**

- [ ] Null hypothesis (H₀) stated
- [ ] Alternative hypothesis (H₁) stated
- [ ] Directional or two-tailed specified
- [ ] Expected effect size stated
- [ ] Type I error (α) specified
- [ ] Type II error (β) or power stated
- [ ] Sample size justified
- [ ] Statistical test procedure named
- [ ] Assumptions stated

**Good Hypothesis Format:**

```markdown
## Primary Hypothesis

**H₀:** The treatment effect on depression (PHQ-9) equals zero: τ = 0

**H₁:** Treatment effect is positive and clinically meaningful: τ > 2.0 points

**Test:** Two-group t-test, α = 0.05 (two-tailed)

**Expected Effect Size:** Cohen's d = 0.40 (medium)

**Power Analysis:** N = 256 per group (n = 512 total) provides 80% power
to detect d = 0.40, accounting for 15% attrition

**Sample Size:** N = 600 (accounting for 15% attrition)
```

**Prevention:**

- Ground hypotheses in prior literature
- Specify all design details
- Include power analysis from start
- Request formal statistical hypothesis structure
- Have statistician review hypotheses

**Related:**

- [Gap Analysis Too Broad](#problem-gap-analysis-too-broad)
- [Analysis Plan Incomplete](#problem-analysis-plan-incomplete)

---

### Problem: Analysis Plan Incomplete

**Symptoms:**

- Plan missing primary analysis specification
- Secondary analyses undefined
- Sensitivity analyses not mentioned
- Multiple testing correction not addressed
- Missing data handling unclear
- No mention of assumptions or diagnostics

**Common Causes:**

1. Input too vague about analysis
2. Not specifying outcome variables
3. Not mentioning confounders/covariates
4. Not addressing design complexity
5. Not specifying pre-specification vs. exploratory

**Diagnosis:**

```bash
# Review generated analysis plan
cat analysis_plan.md

# Check for key sections:
# - Primary analysis specification
# - Secondary analyses
# - Sensitivity analyses
# - Multiple testing
# - Missing data
# - Assumption checks
# - Model diagnostics
```

**Solution:**

**Step 1:** Provide complete study design

```bash
# WRONG: Minimal information
/research:analysis-plan "Study with treatment and outcome"

# RIGHT: Complete design
/research:analysis-plan "RCT design with primary outcome (PHQ-9), mediator (UCLA Loneliness), covariates (age, sex, baseline severity, site). Outcomes measured at 12 weeks. Planned sample: n=300. Analysis: intention-to-treat with complete case sensitivity analysis."

# BETTER: Specify each element
/research:analysis-plan "
PRIMARY OUTCOME: PHQ-9 (depression), collected at baseline, 6 weeks, 12 weeks
MEDIATOR: UCLA Loneliness (6 items), baseline and 6 weeks
COVARIATES: age, sex, race/ethnicity, baseline PHQ-9 score, study site
TREATMENT: 8-week CBT intervention vs. waitlist control
DESIGN: RCT, 1:1 randomization
SAMPLE: N=300 (150 per arm)
MISSING DATA: <5% expected; MCAR assumption to be tested
"
```

**Step 2:** Specify primary analysis

```bash
# Include primary analysis clearly
/research:analysis-plan "DESIGN. Primary analysis: mediation model testing both direct effect of treatment on depression (τ) and indirect effect through loneliness (τ'). Method: product-of-coefficients, bootstrap CI (95%, 10,000 replicates), percentile method. Software: R, mediation package."

# Specify adjustment and models
/research:analysis-plan "DESIGN. Primary models:
1. Mediator model: Loneliness = α₀ + α₁×Treatment + covariates
2. Outcome model: PHQ-9 = β₀ + β₁×Treatment + β₂×Loneliness + covariates
3. Indirect effect: θ = α₁ × β₂"
```

**Step 3:** Request secondary and sensitivity analyses

```bash
# Specify secondary analyses
/research:analysis-plan "TOPIC. Secondary analyses: (1) subgroup analysis by baseline severity (mild/moderate/severe), (2) per-protocol analysis excluding non-compliant participants, (3) alternate outcome measure (BDI instead of PHQ-9)"

# Specify sensitivity analyses
/research:analysis-plan "TOPIC. Sensitivity analyses: (1) multiple imputation for missing data, (2) different bootstrap methods (BCa, studentized), (3) analysis excluding outliers, (4) unmeasured confounder sensitivity analysis"

# Specify exploratory analyses
/research:analysis-plan "TOPIC. Exploratory (not pre-specified): interaction by age, effect heterogeneity, latent classes"
```

**Step 4:** Address multiple testing and corrections

```bash
# Include multiple testing plan
/research:analysis-plan "TOPIC. Multiple testing: primary outcome (1 test), secondary outcomes (3 tests), sensitivity analyses (4 tests). Correction: Bonferroni adjustment for 8 tests, α = 0.05/8 = 0.00625 for each"

# Request specific correction
/research:analysis-plan "TOPIC. Primary outcome protected from multiple testing adjustment. Secondary outcomes exploratory (no adjustment)."
```

**Step 5:** Include assumption and diagnostic checking

```bash
# Request assumption checks
/research:analysis-plan "TOPIC. Include plan for checking: normality of residuals, homogeneity of variance, linearity, independence, sequential ignorability (for causal inference), positivity"

# Request diagnostics
/research:analysis-plan "TOPIC. Diagnostic procedures: (1) residual plots by group, (2) Q-Q plots, (3) VIF for multicollinearity, (4) covariate balance assessment (SMD table)"
```

**Step 6:** Address missing data explicitly

```bash
# Plan for missing data
/research:analysis-plan "TOPIC. Expected missing data rate: <5%. Handling: (1) primary analysis: complete case, (2) sensitivity analysis: multiple imputation (m=20, MICE), (3) missing data mechanism testing (Little's MCAR test)"

# Include details
/research:analysis-plan "TOPIC. Missing data: test MCAR assumption, if violated use inverse probability weighting. Specify imputation model (include all variables in analysis + auxiliary variables)"
```

**Step 7:** Request pre-specification checklist

```bash
# Get complete checklist
/research:analysis-plan "TOPIC. Generate specification document suitable for pre-registration including: (a) primary hypothesis, (b) primary analysis specification, (c) sample size justification, (d) secondary and exploratory analyses clearly labeled, (e) assumption checks and diagnostics, (f) sensitivity analyses, (g) all procedures operational (not conceptual)"
```

**Expected:** Complete analysis plan with:

- Primary analysis pre-specified
- Secondary and exploratory analyses labeled
- Multiple testing addressed
- Missing data handling detailed
- Assumptions and diagnostics planned
- Pre-registration ready

**Analysis Plan Checklist:**

- [ ] Primary outcome clearly defined
- [ ] Primary analysis specified (model, test)
- [ ] Covariates/confounders listed
- [ ] Secondary outcomes specified
- [ ] Sensitivity analyses planned
- [ ] Multiple testing correction described
- [ ] Missing data handling planned
- [ ] Assumptions to be checked listed
- [ ] Diagnostics planned
- [ ] Pre-specified vs. exploratory labeled

**Prevention:**

- Specify analysis plan before data collection
- Get statistician to review plan
- Pre-register plan before analysis
- Use standardized templates (e.g., OSF Registries)
- Keep plan and analysis separate from exploratory work

**Related:**

- [Hypothesis Generation Unclear](#problem-hypothesis-generation-unclear)
- [Gap Analysis Too Broad](#problem-gap-analysis-too-broad)

---

## Integration & Workflow Issues

### Problem: LaTeX/Overleaf Integration

**Symptoms:**

- Generated LaTeX doesn't compile
- Math notation causes errors
- Bibliography not linking correctly
- Figures/tables can't be included
- Overleaf synchronization issues

**Common Causes:**

1. Missing LaTeX packages
2. Unescaped special characters
3. Incorrect file paths for includes
4. Bibliography format incompatibility
5. Overleaf environment missing packages

**Diagnosis:**

```bash
# Check LaTeX compilation
pdflatex document.tex 2>&1 | grep "Error\|Package"

# Check generated LaTeX
cat methods.tex | head -50

# Check Overleaf project
# Look at compilation logs in Overleaf UI
```

**Solution:**

**Step 1:** Generate LaTeX-compatible output

```bash
# Specify LaTeX format
/research:manuscript:methods "TOPIC" --format latex

# Request preamble with packages
/research:manuscript:methods "TOPIC" --format latex --include-preamble

# Request for specific LaTeX document class
/research:manuscript:methods "TOPIC" --format latex --documentclass article
```

**Step 2:** Include required packages in Overleaf

```latex
% In Overleaf preamble, include:
\documentclass{article}
\usepackage{amsmath}      % Math environments
\usepackage{amssymb}      % Math symbols
\usepackage{amsbsy}       % Bold math
\usepackage{graphicx}     % Include figures
\usepackage{booktabs}     % Professional tables
\usepackage{natbib}       % Bibliography
\usepackage{hyperref}     % Links
```

**Step 3:** Handle special characters

```latex
% If compiled LaTeX has errors with characters:

% WRONG: Special characters not escaped
Müller et al. café naïve

% RIGHT: Use LaTeX commands
M\"{u}ller et al. caf\'{e} na\"{i}ve

% OR: Use UTF-8 with appropriate package
\usepackage[utf8]{inputenc}
Müller et al. café naïve
```

**Step 4:** Handle bibliography in Overleaf

```latex
% In Overleaf main document:
\documentclass{article}
\usepackage{natbib}

\begin{document}

\section{Methods}
% Insert generated methods.tex
\input{methods.tex}

% At end of document:
\bibliography{references}  % Your .bib file
\bibliographystyle{plainnat}

\end{document}
```

**Step 5:** Fix math mode issues

```latex
% WRONG: Mixed text and math
The coefficient α = 0.5 shows significance

% RIGHT: Proper math mode
The coefficient $\alpha = 0.5$ shows significance

% Or for display math:
We estimate:
\[
\theta = \alpha \times \beta
\]
```

**Step 6:** Sync with Overleaf

```bash
# If using Overleaf GitHub sync:

# 1. Clone Overleaf project
git clone https://github.com/overleaf/[project-id].git

# 2. Update files locally
cp methods.tex overleaf-project/

# 3. Commit and push
cd overleaf-project
git add methods.tex
git commit -m "Update methods section"
git push

# Overleaf updates automatically
```

**Expected:** LaTeX compiles without errors, appears correctly in Overleaf.

**LaTeX Integration Checklist:**

- [ ] All required packages included in preamble
- [ ] Special characters properly escaped
- [ ] Math mode used for equations
- [ ] Bibliography properly linked
- [ ] File paths use relative paths (no absolute)
- [ ] No unmatched braces or dollar signs
- [ ] Compilation successful
- [ ] PDF renders correctly

**Prevention:**

- Generate with `--format latex` for LaTeX output
- Include Overleaf preamble when starting document
- Test compilation before sharing
- Use consistent bibliography format (natbib or biblatex)

**Related:**

- [Results Section Incomplete](#problem-results-section-incomplete)
- [Methods Section Too Generic](#problem-methods-section-too-generic)

---

## API & Network Issues

### Problem: Network Timeout

**Symptoms:**

- Commands freeze/hang indefinitely
- "Connection timeout" error
- arXiv searches slow or fail
- API requests return 504 errors
- Request takes >30 seconds

**Common Causes:**

1. Internet connection slow or unstable
2. arXiv or API service temporarily down
3. Local network issues or firewall blocking
4. ISP throttling or DNS problems
5. DNS resolution slow

**Diagnosis:**

```bash
# Test internet connectivity
ping -c 3 8.8.8.8

# Test DNS resolution
nslookup arxiv.org
nslookup api.anthropic.com

# Test connection to arXiv
timeout 5 curl -I https://arxiv.org/

# Test API connectivity
timeout 5 curl -I https://api.anthropic.com/

# Check network speed
# Use tool like speedtest-cli
brew install speedtest-cli
speedtest-cli
```

**Solution:**

**Step 1:** Verify internet connection

```bash
# Check if internet is working
ping 8.8.8.8
# If fails: restart router/WiFi

# Check DNS resolution
nslookup arxiv.org
# Should return IP address

# Check WiFi connection quality
airport -s  # macOS: list nearby WiFi networks
```

**Step 2:** Test service availability

```bash
# Check arXiv status
open https://status.arxiv.org/

# Check Anthropic API status
open https://status.anthropic.com/

# Try with timeout to see what happens
timeout 10 /research:arxiv "test"

# If times out: service may be down
```

**Step 3:** Try with increased timeout

```bash
# Increase timeout for command
timeout 60 /research:arxiv "causal mediation"

# If successful with longer timeout: network is slow
# Try again during off-peak hours
```

**Step 4:** Retry logic

```bash
# Retry with exponential backoff
# Wait 2 seconds, try again
sleep 2
/research:arxiv "query"

# Wait 5 seconds, try again
sleep 5
/research:arxiv "query"

# Wait 10 seconds, try again
sleep 10
/research:arxiv "query"
```

**Step 5:** Use cached results if available

```bash
# Check if previous similar search cached
scholar history:arxiv

# Use cached result if available
/research:arxiv "similar query" --use-cache
```

**Step 6:** Try alternative time

```bash
# arXiv may have high load during certain times
# Try again during off-peak (early morning, late evening)

# Or try different day if possible
```

**Expected:** Command completes within 30 seconds, returns results.

**Prevention:**

- Test network connection before important operations
- Run during off-peak hours (midnight-6am UTC)
- Have backup internet (mobile hotspot)
- Cache important searches
- Check service status before starting work

**Related:**

- [API Authentication Problems](#problem-api-key-invalid)
- [DOI Lookup Failures](#problem-doi-lookup-failures)

---

### Problem: Rate Limiting from arXiv

**Symptoms:**

- arXiv search returns "Too many requests" error
- Rate limit warning appears
- Searches suddenly stop working
- Need to wait before searches work again
- 429 error code

**Common Causes:**

1. Too many searches in short period
2. Parallel/concurrent searches
3. arXiv API daily quota exceeded
4. Automated searches without delays
5. IP address flagged as bot

**Diagnosis:**

```bash
# Check for rate limit error
/research:arxiv "test" --debug 2>&1 | grep "429\|rate"

# Check how many searches recently
scholar history:arxiv | wc -l

# Check search history by time
scholar history:arxiv --recent 1h
```

**Solution:**

**Step 1:** Understand arXiv rate limits

```bash
# arXiv allows:
# - ~1 request per 3 seconds per IP
# - ~1000 requests per IP per month
# - No automated scraping

# Current usage
scholar history:arxiv | tail -10
# Check timestamps to see rate
```

**Step 2:** Implement delays

```bash
# Space out searches

# Slow approach (recommended)
/research:arxiv "topic 1"
sleep 5
/research:arxiv "topic 2"
sleep 5
/research:arxiv "topic 3"

# Script with delays
for query in "mediation" "causal inference" "bootstrap"; do
  /research:arxiv "$query"
  sleep 5
done
```

**Step 3:** Batch searches efficiently

```bash
# Rather than multiple searches:
# Combine into single search when possible

# WRONG: Multiple searches
/research:arxiv "mediation"
/research:arxiv "causal inference"
/research:arxiv "bootstrap"

# BETTER: Combined search
/research:arxiv "(mediation OR causal) AND bootstrap"
```

**Step 4:** Request increased rate limit

```bash
# If doing legitimate research with many searches:
# 1. Contact arXiv support
# 2. Explain research use case
# 3. Request higher rate limit for academic IP range

# Or use Overleaf academic IP (usually higher limit)
```

**Step 5:** Use caching

```bash
# Scholar caches recent searches
# Reuse results when possible

/research:arxiv "common search" --use-cache

# Or manually save results
/research:arxiv "topic" > my_searches.txt
# Reuse instead of re-searching
```

**Step 6:** Wait and retry

```bash
# If rate-limited, must wait

# Check when limit resets
# Usually 1 hour or less

# Retry after 1 hour
sleep 3600
/research:arxiv "query that was limited"
```

**Expected:** Searches work without rate limit errors when spaced appropriately.

**Prevention:**

- Space searches ≥ 3 seconds apart
- Batch searches when possible
- Cache important searches
- Avoid parallel/concurrent searches
- Check rate limit status before bulk operations

**Related:**

- [arXiv Search Returns No Results](#problem-arxiv-search-returns-no-results)
- [Network Timeout](#problem-network-timeout)

---

## Data & Quality Issues

### Problem: Quality Concerns

**Symptoms:**

- Generated content seems superficial
- Statistical reasoning not rigorous
- Output contains obvious errors
- Content doesn't match your expertise level
- Missing important nuances

**Common Causes:**

1. Input too vague to generate quality output
2. Complex topic not fully conveyed
3. Context missing about field/audience

- Not specifying expectations

1. AI limitations on specific topic

**Diagnosis:**

```bash
# Review generated output
# Compare with:
# - Peer-reviewed literature
# - Your own knowledge
# - Expected rigor level

# Look for:
# - Specific citations
# - Mathematical notation
# - Assumptions stated
# - Limitations acknowledged
```

**Solution:**

**Step 1:** Use as starting point, not final product

```bash
# WRONG: Accept generated text directly
Generated output → Publish directly

# RIGHT: Use as scaffold
Generated output → Review & critique → Add citations →
Verify claims → Write final version
```

**Step 2:** Provide detailed context for quality

```bash
# WRONG: Minimal input
/research:manuscript:methods "mediation analysis"

# RIGHT: Rich context
/research:manuscript:methods "RCT examining behavioral intervention effect on depression mediated by social support. Methods for quantifying direct and indirect effects using causal mediation framework. Must address sequential ignorability assumptions, non-linear relationships between mediator and outcome, and sensitivity to unmeasured confounding. Target audience: statistical methodology journal readers (high statistical literacy). Emphasize counterfactual framework, comparative advantages vs. G-estimation, and recent developments."
```

**Step 3:** Request specific elements

```bash
# Be explicit about quality expectations
/research:manuscript:methods "TOPIC. Include: formal statistical notation, three citations to foundational papers, explicit statement of assumptions, discussion of when method fails or limitations. Level: appropriate for research methods course for advanced PhD students."

# Request verification
/research:manuscript:methods "TOPIC. After generating, please verify: (a) all formulas correct, (b) notation consistent, (c) claims supported by citations, (d) assumptions explicitly stated"
```

**Step 4:** Add expert review step

```bash
# Always have expert review:

# 1. Generate draft
/research:manuscript:methods "TOPIC"

# 2. Review yourself (detailed)
# - Check all claims
# - Verify math
# - Identify gaps

# 3. Have colleague review
# - Provides external perspective
# - Catches errors you missed

# 4. Revise based on feedback
# - Make specific improvements
# - Ask for refinement on weak sections
```

**Step 5:** Request source verification

```bash
# Ask for citations
/research:manuscript:methods "TOPIC. Please include citations for each major claim. Format: Author (Year) for narrative citations."

# Ask for specific sources
/research:manuscript:methods "TOPIC. Ground in: (a) foundational papers, (b) recent methodological advances (2020+), (c) software/implementation papers, (d) applied examples"

# Request literature
/research:manuscript:methods "TOPIC. Create comprehensive reference list of key papers on this topic from last 10 years."
```

**Step 6:** Test and verify output

```bash
# For code or methodology:
# 1. Check syntax
# 2. Run simple example
# 3. Verify results match theory
# 4. Check edge cases

# For methods sections:
# 1. Verify all citations
# 2. Check mathematical correctness
# 3. Compare with published methods sections
# 4. Peer review
```

**Expected:** High-quality, accurate, well-cited output suitable for publication.

**Quality Checklist:**

- [ ] Specific to your topic (not generic)
- [ ] Appropriate level of rigor
- [ ] Assumptions explicitly stated
- [ ] Limitations acknowledged
- [ ] Supported by citations
- [ ] Mathematical notation correct
- [ ] Free of obvious errors
- [ ] Expert reviewed

**Prevention:**

- Treat output as draft, not final
- Always review and critique
- Require citations for all claims
- Have colleague or expert review
- Test methodology/code before using
- Compare with published examples

**Related:**

- [Methods Section Too Generic](#problem-methods-section-too-generic)
- [Proof Review Accuracy Concerns](#problem-proof-review-accuracy-concerns)

---

## Quick Reference: Error Messages to Solutions

| Error Message | Likely Problem | Solution |
|---|---|---|
| "command not found: scholar" | Scholar not installed | [Scholar Not Installed](#problem-scholar-not-installed) |
| "Authentication failed" | API key invalid | [API Key Invalid](#problem-api-key-invalid) |
| "Connection timeout" | Network issue | [Network Timeout](#problem-network-timeout) |
| "Permission denied" | File permissions | [Permission Errors](#problem-permission-errors) |
| "No results found" | arXiv search issue | [arXiv Returns No Results](#problem-arxiv-search-returns-no-results) |
| "DOI not found" | DOI lookup issue | [DOI Lookup Failures](#problem-doi-lookup-failures) |
| "Invalid BibTeX" | File format issue | [BibTeX Parsing Errors](#problem-bibtex-parsing-errors) |
| "File not found" | Bibliography missing | [Bibliography File Issues](#problem-bibliography-file-issues) |
| "Too many requests" | Rate limiting | [Rate Limiting from arXiv](#problem-rate-limiting-from-arxiv) |

---

## Getting Help

### Before Asking for Help

1. **Check this guide** - Your error message above
2. **Check the FAQ** - [FAQ-research.md](../help/FAQ-research.md)
3. **Check examples** - [Research Examples](../examples/research.md)
4. **Search existing issues** - GitHub Issues

### Where to Get Help

**For bugs:**

- GitHub Issues: https://github.com/Data-Wise/scholar/issues

**For questions:**

- GitHub Discussions: https://github.com/Data-Wise/scholar/discussions

**For documentation:**

- [Research Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)
- [Tutorials](../tutorials/research/first-literature-search.md)
- [Workflows](../workflows/research/literature-review.md)

---

**Version:** v2.9.0
**Last Updated:** 2026-01-31
**License:** MIT

---

**Navigation:** [Home](../index.md) | [Research Index](../research/index.md) | [FAQ](FAQ-research.md) | [Commands Reference](RESEARCH-COMMANDS-REFERENCE.md)
