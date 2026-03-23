---
name: teaching:syllabus
description: Generate a comprehensive course syllabus
---

# Create Course Syllabus

I'll help you create a comprehensive course syllabus with all necessary components.

**Usage:** `/teaching:syllabus <course-name>` or `/teaching:syllabus <course-name> <semester>`

**Examples:**
- `/teaching:syllabus "Introduction to Statistics"`
- `/teaching:syllabus "Regression Analysis" "Fall 2026"`
- `/teaching:syllabus "STAT-440" --dry-run`

**Options:**
- `--weeks N` - Number of weeks in semester (default: 15)
- `--format FMT` - Output format: markdown, pdf, latex
- `--dry-run` - Preview what would be generated without API calls
- `--json` - Output dry-run as JSON (requires --dry-run)
- `--config PATH` - Explicit config file path (bypasses .flow/teach-config.yml discovery)
- `-i "text"` / `--instructions "text"` - Custom instructions to guide AI generation (merged with active prompt)
- `-i @file.txt` - Load instructions from a file
- `--debug` - Enable debug logging

## What course would you like to create a syllabus for?

Provide the course name and optionally the semester/term.

<system>
This command generates a comprehensive course syllabus using the Phase 0 foundation:
- Template System for structure (syllabus.json)
- Config Loader for course settings
- Validator Engine for quality assurance
- AI Provider for content generation

## Implementation

```javascript
import { generateSyllabus, exportSyllabus } from '../../../teaching/generators/syllabus.js';
import { buildConversationalPrompt, processGeneratedSyllabus } from '../../../teaching/generators/syllabus-conversational.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Parse user input
const args = parseArgs(userInput);

// Default options
const options = {
  courseTitle: args.title || args._[0] || '',
  courseCode: args.code || '',
  semester: args.semester || args._[1] || '',
  credits: parseInt(args.credits) || 3,
  level: args.level || undefined,
  weeks: parseInt(args.weeks) || 16,
  format: args.format || 'in-person',
  topics: args.topics ? args.topics.split(',').map(t => t.trim()) : [],
  instructor: {
    name: args.instructor || undefined,
    email: args.email || undefined,
    office: args.office || undefined
  },
  prerequisites: args.prereqs ? args.prereqs.split(',').map(p => p.trim()) : [],
  includeTemplatePolicy: !args['no-policies'],
  configPath: args.config || null,
  instructions: args.instructions || args.i || null,
  debug: args.debug || false
};

// ─── Custom Instructions Pipeline ───
if (options.instructions) {
  const { InstructionMerger } = await import('../../../teaching/ai/instruction-merger.js');
  const { AIProvider } = await import('../../../teaching/ai/provider.js');
  const { loadTeachConfig } = await import('../../../teaching/config/loader.js');

  // Load from file if @reference
  let instructionText = options.instructions;
  if (instructionText.startsWith('@')) {
    instructionText = await InstructionMerger.loadFromFile(instructionText.slice(1));
  }

  // Load config for conflict detection
  const config = loadTeachConfig(process.cwd());

  // Create Haiku provider for fast categorization
  const haiku = new AIProvider({
    model: 'claude-haiku-4-5-20251001',
    apiKey: config.scholar?.ai_generation?.api_key || process.env.ANTHROPIC_API_KEY,
    maxTokens: 1024,
    debug: options.debug
  });

  const merger = new InstructionMerger(haiku, { debug: options.debug });

  // Build the base prompt (check for user override first)
  let basePrompt;
  let isCustomPrompt = false;

  try {
    const { PromptLoader } = await import('../../../teaching/ai/prompt-loader.js');
    const { PromptBuilder } = await import('../../../teaching/ai/prompt-builder.js');
    const loaded = PromptLoader.load('syllabus', process.cwd());
    basePrompt = PromptBuilder.build(loaded.body, {
      courseCode: config.scholar?.course_info?.code || '',
      courseTitle: config.scholar?.course_info?.title || '',
      level: config.scholar?.course_info?.level || 'undergraduate',
      semester: options.semester,
      weeks: options.weeks,
      credits: options.credits,
      format: options.format,
      prerequisites: options.prerequisites.join(', ') || 'None specified',
      topics: options.topics.join(', ') || 'Use course curriculum'
    });
    isCustomPrompt = true;
  } catch {
    // No user override — generator will use buildSyllabusPrompt() internally
    basePrompt = null;
  }

  // === Approval Loop (unlimited iterations) ===
  let accepted = false;
  let allInstructions = instructionText;

  while (!accepted) {
    // Analyze with AI
    const categories = await merger.analyze(allInstructions, 'syllabus');

    // For preview: merge with base prompt (or placeholder if no custom prompt)
    const previewPrompt = basePrompt || `[Default syllabus prompt: ${options.courseTitle}, ${options.weeks} weeks]`;
    const mergeResult = merger.merge(previewPrompt, categories, config.scholar || {}, {
      isCustomPrompt,
      commandType: 'syllabus'
    });

    // Show summary
    const summary = merger.summarize(mergeResult);
    console.log(summary);
    console.log('---');
    console.log('**Accept** to generate | **Modify** to change instructions | **Cancel** to abort');

    // Wait for user response (Claude Code conversation context)
    const userResponse = await waitForUserResponse();

    if (userResponse.action === 'accept') {
      // Pass merged prompt to generator (only if we have a real base prompt)
      if (isCustomPrompt) {
        options.mergedPrompt = mergeResult.mergedPrompt;
      }
      // Always pass instruction metadata for the generator
      options.instructionText = allInstructions;
      options.mergedCategories = categories;
      accepted = true;
    } else if (userResponse.action === 'modify') {
      allInstructions = allInstructions + '\n' + userResponse.newInstructions;
    } else if (userResponse.action === 'cancel') {
      console.log('❌ Generation cancelled.');
      process.exit(0);
    }
  }
}

// For API-based generation:
const result = await generateSyllabus(options);

// For conversational generation (Claude Code):
const prompt = buildConversationalPrompt(options);
// Claude generates JSON following the prompt
const syllabus = processGeneratedSyllabus(generatedContent);
```

## JSON Output Structure

```json
{
  "title": "Regression Analysis",
  "course_code": "STAT 440",
  "semester": "Fall 2026",
  "credits": 3,
  "level": "undergraduate",
  "prerequisites": ["STAT 250", "MATH 200"],
  "instructor": {
    "name": "Dr. Smith",
    "title": "Associate Professor",
    "email": "smith@university.edu",
    "office": "Science Building 301",
    "office_hours": "MW 2-4 PM"
  },
  "meeting_times": {
    "days": ["Monday", "Wednesday", "Friday"],
    "time": "10:00 AM - 10:50 AM",
    "location": "Science Building 100",
    "format": "in-person"
  },
  "description": "This course introduces students to regression analysis...",
  "learning_objectives": [
    "Apply simple and multiple regression models to real data",
    "Interpret regression coefficients and assess model fit",
    "Diagnose and address violations of regression assumptions",
    "Communicate statistical findings through written reports"
  ],
  "required_materials": {
    "textbooks": [{
      "title": "Applied Linear Regression Models",
      "author": "Kutner et al.",
      "edition": "4th Edition",
      "required": true
    }],
    "software": [{
      "name": "R",
      "version": "4.0+",
      "license": "free"
    }]
  },
  "grading": {
    "components": [
      {"name": "Homework", "percentage": 25},
      {"name": "Quizzes", "percentage": 10},
      {"name": "Midterm", "percentage": 25},
      {"name": "Final Exam", "percentage": 30},
      {"name": "Project", "percentage": 10}
    ],
    "scale": [
      {"grade": "A", "minimum": 93},
      {"grade": "A-", "minimum": 90}
    ],
    "late_policy": "10% off per day, max 3 days"
  },
  "schedule": [
    {
      "week": 1,
      "topic": "Introduction to Regression",
      "readings": ["Chapter 1"],
      "assignments_due": []
    },
    {
      "week": 8,
      "topic": "Midterm Exam",
      "readings": [],
      "assignments_due": ["Midterm"]
    }
  ],
  "policies": {
    "academic_integrity": "...",
    "accessibility": "...",
    "attendance": "...",
    "late_policy": "..."
  }
}
```

## Output Formats

Supported export formats:
- **markdown/md** - For course websites and LMS
- **json** - Structured data for processing
- **latex/tex** - Professional PDF generation
- **html** - Self-contained web page

## Standard Policies

The generator includes template policies for:
- Academic integrity
- Accessibility/accommodations
- Attendance expectations
- Late work policy
- Communication policy
- Technology in classroom
- Mental health resources
- Diversity statement

Use `--no-policies` to exclude standard policy templates.

## Follow-up Actions

After generating the syllabus, offer to:
- Create the first week's lecture outline
- Generate assignment prompts for the course
- Create a grading rubric for major assignments
- Export to different formats (PDF via LaTeX, HTML)
- Add calendar events for all class sessions

## Best Practices

Include:
- ✅ Clear learning objectives (measurable, actionable)
- ✅ Detailed grading breakdown with scale
- ✅ Academic integrity statement
- ✅ Accessibility/accommodations statement
- ✅ Weekly schedule with topics and readings
- ✅ Key dates (exams, project deadlines)

Avoid:
- ❌ Vague objectives ("understand" → use "apply", "analyze", "evaluate")
- ❌ Missing prerequisite information
- ❌ Unclear grading criteria
- ❌ No contact information or office hours

## Dry-Run Handler

```javascript
import { isDryRun, executeDryRun } from '../../../teaching/utils/dry-run.js';

// Parse user input
const args = parseArgs(userInput);

const options = {
  courseName: args._[0] || '',
  semester: args._[1] || '',
  weeks: parseInt(args.weeks) || 15,
  format: args.format || 'markdown',
  instructions: args.instructions || args.i || null,
  dryRun: args['dry-run'] || false,
  json: args.json || false
};

// Handle dry-run mode
if (isDryRun(options)) {
  executeDryRun('syllabus', options);
}

// Continue with generation...
```
</system>
