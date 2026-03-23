# Scholar Plugin - Architecture Diagrams

Comprehensive visual documentation of the Scholar plugin's internal architecture, including data flow, configuration hierarchy, and multi-stage generation pipelines.

---

## 1. Generator → Formatter → Output Flow

Shows how content flows from generators through formatters to final output files.

```mermaid
graph LR
    subgraph Generators["Generators (Content Creation)"]
        GenLec["Lecture Generator"]
        GenExam["Exam Generator"]
        GenQuiz["Quiz Generator"]
        GenAssign["Assignment Generator"]
        GenSyl["Syllabus Generator"]
    end

    subgraph AI["AI Provider"]
        APICall["Claude API Call"]
        Parse["JSON Parse"]
        Validate["Schema Validation"]
    end

    subgraph Formatters["Formatters (Output Transformation)"]
        FmtMD["Markdown Formatter"]
        FmtQMD["Quarto Formatter"]
        FmtTex["LaTeX Formatter"]
        FmtCanvas["Canvas/QTI Formatter"]
    end

    subgraph Output["Final Output"]
        OutMD["📄 .md files"]
        OutQMD["📄 .qmd files"]
        OutTex["📄 .tex files"]
        OutQTI["📄 .qti files"]
    end

    GenLec -->|Prompt| APICall
    GenExam -->|Prompt| APICall
    GenQuiz -->|Prompt| APICall
    GenAssign -->|Prompt| APICall
    GenSyl -->|Prompt| APICall

    APICall -->|JSON Response| Parse
    Parse -->|Validated Content| Validate

    Validate -->|Content Object| FmtMD
    Validate -->|Content Object| FmtQMD
    Validate -->|Content Object| FmtTex
    Validate -->|Content Object| FmtCanvas

    FmtMD -->|Transform to Markdown| OutMD
    FmtQMD -->|Transform to Quarto YAML| OutQMD
    FmtTex -->|Transform to LaTeX| OutTex
    FmtCanvas -->|Transform to QTI XML| OutQTI

    style Generators fill:#e1f5ff
    style AI fill:#fff3e0
    style Formatters fill:#f3e5f5
    style Output fill:#e8f5e9
```

### Flow Summary

1. **Generators** create content using AI-powered templates (lecture, exam, quiz, assignment, syllabus)
2. **AI Provider** handles Claude API calls with retry logic and rate limiting
3. **Formatters** transform the JSON output to target formats (Markdown, Quarto, LaTeX, Canvas QTI)
4. **Output** files are written with appropriate file extensions

### Formatter Architecture

```mermaid
classDiagram
    BaseFormatter <|-- MarkdownFormatter
    BaseFormatter <|-- QuartoFormatter
    BaseFormatter <|-- LaTeXFormatter
    BaseFormatter <|-- CanvasFormatter

    class BaseFormatter {
        #options: Object
        +format(content, options): string
        +validate(output): ValidationResult
        +getFileExtension(): string
        #formatLatex(text, format): string
        #escapeMarkdown(text): string
        #escapeLatex(text): string
        #processLatex(text): string
    }

    class MarkdownFormatter {
        +format(content): string
        +getFileExtension(): '.md'
    }

    class QuartoFormatter {
        +format(content): string
        +getFileExtension(): '.qmd'
    }

    class LaTeXFormatter {
        +format(content): string
        +getFileExtension(): '.tex'
    }

    class CanvasFormatter {
        +format(content): string
        +getFileExtension(): '.qti'
    }

    style BaseFormatter fill:#f3e5f5
    style MarkdownFormatter fill:#e1f5ff
    style QuartoFormatter fill:#e1f5ff
    style LaTeXFormatter fill:#e1f5ff
    style CanvasFormatter fill:#e1f5ff
```

---

## 2. Four-Layer Teaching Style System

Visual representation of how teaching styles are merged hierarchically from 4 sources.

```mermaid
graph TB
    subgraph Layer1["Layer 1: Global"]
        Global["~/.claude/CLAUDE.md<br/>teaching_style YAML"]
    end

    subgraph Layer2["Layer 2: Course"]
        Course[".claude/teaching-style.local.md<br/>Course defaults"]
    end

    subgraph Layer3["Layer 3: Command"]
        CmdOverride["command_overrides<br/>teaching_style.lecture<br/>teaching_style.exam<br/>..."]
    end

    subgraph Layer4["Layer 4: Lesson"]
        Lesson["lesson-plans/weekNN.yml<br/>teaching_style_overrides"]
    end

    subgraph Merge["Merge Engine"]
        DefaultStyle["1. Start with<br/>Default Style"]
        Apply1["2. Apply<br/>Global"]
        Apply2["3. Apply<br/>Course"]
        Apply4["4. Apply<br/>Lesson"]
        Apply3["5. Apply<br/>Command<br/>(highest priority)"]
        Result["Final Merged<br/>Teaching Style"]
    end

    subgraph Usage["Generation"]
        Prompt["buildStyleGuidance()<br/>in AI Prompts"]
        Generator["Lecture/Exam/<br/>Quiz/etc Generator"]
    end

    Global --> Apply1
    Course --> Apply2
    CmdOverride --> Apply3
    Lesson --> Apply4

    DefaultStyle --> Apply1
    Apply1 --> Apply2
    Apply2 --> Apply4
    Apply4 --> Apply3
    Apply3 --> Result

    Result --> Prompt
    Prompt --> Generator

    style Layer1 fill:#bbdefb
    style Layer2 fill:#c5e1a5
    style Layer3 fill:#ffe0b2
    style Layer4 fill:#f8bbd0
    style Merge fill:#e1bee7
    style Usage fill:#b2dfdb
```

### Precedence Rules

### Highest to Lowest Priority

1. **Command Overrides** - Teaching style for specific commands (lecture, exam, quiz)
2. **Lesson Plan** - Per-lesson teaching style overrides
3. **Course Style** - Course-wide teaching style preferences
4. **Global Style** - User's personal teaching style from ~/.claude/CLAUDE.md
5. **Defaults** - Built-in defaults when no overrides present

### Teaching Style Structure

```mermaid
graph LR
    Style["Teaching Style"]

    Style --> Ped["pedagogical_approach"]
    Style --> Expl["explanation_style"]
    Style --> Assess["assessment_philosophy"]
    Style --> Student["student_interaction"]
    Style --> Content["content_preferences"]

    Ped --> PA1["primary"]
    Ped --> PA2["secondary"]
    Ped --> PA3["class_structure[]"]

    Expl --> ES1["formality"]
    Expl --> ES2["proof_style"]
    Expl --> ES3["notation_preference"]
    Expl --> ES4["example_depth"]
    Expl --> ES5["analogies"]

    Assess --> AP1["primary_focus"]
    Assess --> AP2["feedback_style"]
    Assess --> AP3["revision_policy"]
    Assess --> AP4["partial_credit"]

    Student --> SI1["questioning"]
    Student --> SI2["group_work"]
    Student --> SI3["discussion_format"]

    Content --> CP1["real_world_examples"]
    Content --> CP2["historical_context"]
    Content --> CP3["computational_tools"]
    Content --> CP4["interdisciplinary_connections"]

    style Style fill:#e1bee7
    style Ped fill:#bbdefb
    style Expl fill:#c5e1a5
    style Assess fill:#ffe0b2
    style Student fill:#f8bbd0
    style Content fill:#b2dfdb
```

---

## 3. Lecture Generation Pipeline (Multi-Stage)

The complete workflow for generating instructor lecture notes with the `/teaching:lecture` command.

```mermaid
sequenceDiagram
    participant User as User
    participant CLI as CLI Interface
    participant Config as Config Loader
    participant Style as Style Loader
    participant Prompt as Prompt Builder
    participant AI as Claude API
    participant Output as Output Formatter

    User ->> CLI: /teaching:lecture<br/>--topic "Bayesian Methods"<br/>--level graduate

    CLI ->> Config: loadTeachConfig()
    Config -->> CLI: .flow/teach-config.yml<br/>(course info, defaults)

    CLI ->> Style: loadTeachingStyle()<br/>command: "lecture"
    Style -->> CLI: Merged style<br/>(4 layers)

    CLI ->> Prompt: buildOutlinePrompt()
    Prompt ->> Prompt: buildStyleGuidance()
    Prompt -->> CLI: Outline prompt<br/>(8-12 sections)

    CLI ->> AI: POST /messages<br/>System + Outline Prompt
    AI -->> CLI: JSON Outline<br/>(sections with IDs)

    Note over CLI: Parse & Validate<br/>Outline Structure

    loop For Each Section
        CLI ->> Prompt: buildSectionPrompt()
        Prompt ->> Prompt: Include previous context<br/>for coherence
        Prompt -->> CLI: Section prompt

        CLI ->> AI: POST /messages<br/>Section + Context
        AI -->> CLI: JSON Section Content<br/>(markdown, code, etc)

        CLI ->> CLI: Append to lecture
    end

    CLI ->> Output: format(lecture,<br/>format: 'quarto')
    Output ->> Output: Transform content<br/>to .qmd format
    Output -->> CLI: Quarto lecture notes

    CLI -->> User: 📄 lecture-notes.qmd<br/>✅ Generated successfully

    style User fill:#e8f5e9
    style CLI fill:#e1f5ff
    style Config fill:#f3e5f5
    style Style fill:#f3e5f5
    style Prompt fill:#fff3e0
    style AI fill:#ffe0b2
    style Output fill:#f3e5f5
```

### Phase Breakdown

| Phase           | Step               | Description                                          |
| --------------- | ------------------ | ---------------------------------------------------- |
| **1. Setup**    | Load Config        | Discover .flow/teach-config.yml with course info     |
|                 | Load Style         | Merge 4-layer teaching styles                        |
| **2. Outline**  | Build Prompt       | Create outline generation prompt with style guidance |
|                 | AI Call            | Generate 8-12 section structure with page estimates  |
|                 | Parse              | Validate JSON structure and section IDs              |
| **3. Sections** | Loop (per section) | For each section in outline...                       |
|                 | Build Prompt       | Create section-specific prompt with context          |
|                 | AI Call            | Generate section content                             |
|                 | Append             | Add to lecture manuscript                            |
| **4. Format**   | Transform          | Convert to target format (Quarto, LaTeX, etc.)       |
|                 | Save               | Write file with metadata                             |

---

## 4. Configuration Resolution Order

How Scholar discovers and merges configuration files during startup.

```mermaid
graph TD
    Start["Command Execution<br/>e.g., /teaching:lecture"]

    Start --> Q1{Explicit config<br/>provided?<br/>--config flag}

    Q1 -->|Yes| ExplicitPath["Use provided path"]
    Q1 -->|No| Discovery["Search for config"]

    ExplicitPath --> CheckPath{File<br/>exists?}
    CheckPath -->|No| ErrorPath["Error: Config not found"]
    CheckPath -->|Yes| LoadFile1["Load config file"]

    Discovery --> Search["Search parent dirs<br/>for .flow/teach-config.yml"]

    Search --> Found{Found?}
    Found -->|No| Defaults["Use default config"]
    Found -->|Yes| LoadFile2["Load config file"]

    LoadFile1 --> Parse1["Parse YAML"]
    LoadFile2 --> Parse2["Parse YAML"]

    Parse1 --> Validate["Validate config<br/>structure"]
    Parse2 --> Validate

    Validate --> Valid{Valid?}

    Valid -->|No| Warn["Warn user<br/>(non-strict mode)"]
    Valid -->|No, strict| Err["Error & exit"]
    Valid -->|Yes| Merge["Deep merge with<br/>defaults"]

    Warn --> Merge
    Defaults --> Merge

    Merge --> Final["Final Config<br/>Ready for generation"]

    ErrorPath :::error
    Err :::error
    Final :::success

    classDef error fill:#ffcdd2
    classDef success fill:#c8e6c9
```

### Configuration File Discovery

```mermaid
graph LR
    subgraph Search["Search Upward from CWD"]
        D1["./"]
        D2["../"]
        D3["../../"]
        D4["../../../"]
        D5["..."]
    end

    Target[".flow/teach-config.yml"]

    D1 --> Target
    D2 --> Target
    D3 --> Target
    D4 --> Target
    D5 --> Target

    Target -->|Found| Load["Load & Parse"]
    Target -->|Not Found| Default["Use defaults"]

    Load --> Merge["Merge with Defaults"]
    Default --> Merge

    style D1 fill:#e1f5ff
    style D2 fill:#e1f5ff
    style D3 fill:#e1f5ff
    style D4 fill:#e1f5ff
    style D5 fill:#e1f5ff
    style Target fill:#fff3e0
    style Load fill:#f3e5f5
    style Default fill:#f3e5f5
    style Merge fill:#e8f5e9
```

### Configuration Structure

```mermaid
graph TD
    Root["teach-config.yml"]

    Root --> Scholar["scholar:"]

    Scholar --> CourseInfo["course_info:"]
    Scholar --> Defaults["defaults:"]
    Scholar --> Style["style:"]

    CourseInfo --> CI1["level: undergraduate|graduate"]
    CourseInfo --> CI2["field: statistics|biology|..."]
    CourseInfo --> CI3["code: STAT-440"]
    CourseInfo --> CI4["title: Course Title"]

    Defaults --> D1["exam_format: markdown"]
    Defaults --> D2["lecture_format: quarto"]
    Defaults --> D3["question_types: [...]"]

    Style --> S1["tone: formal|conversational"]
    Style --> S2["notation: statistical|mathematical"]
    Style --> S3["examples: true|false"]

    style Root fill:#e1f5ff
    style Scholar fill:#c5e1a5
    style CourseInfo fill:#ffe0b2
    style Defaults fill:#ffe0b2
    style Style fill:#f8bbd0
```

---

## 5. AI Prompt Flow for Lecture Generation

Shows how prompts are constructed and sent to Claude API with teaching style integration.

```mermaid
graph LR
    subgraph Input["Input Parameters"]
        Topic["Topic"]
        Level["Level"]
        Lang["Language"]
        Field["Field"]
    end

    subgraph StylePrep["Style Preparation"]
        LoadStyle["loadTeachingStyle()"]
        ToPrompt["toPromptStyle()"]
        BuildGuidance["buildStyleGuidance()"]
    end

    subgraph PromptGen["Prompt Generation"]
        OutlineGen["buildOutlinePrompt()"]
        SectionGen["buildSectionPrompt()"]
    end

    subgraph Template["Template Integration"]
        Schema["Lecture Schema<br/>(JSON structure)"]
        Guidelines["Section Type<br/>Guidelines"]
    end

    subgraph APICall["API Call"]
        System["System Prompt"]
        UserMsg["User Prompt<br/>+ Style Guidance"]
        Request["POST /messages"]
    end

    Input --> LoadStyle
    LoadStyle --> ToPrompt
    ToPrompt --> BuildGuidance

    BuildGuidance --> OutlineGen
    BuildGuidance --> SectionGen

    Input --> OutlineGen
    Input --> SectionGen

    OutlineGen --> Schema
    SectionGen --> Schema
    Schema --> Template

    Template --> System
    BuildGuidance --> UserMsg
    OutlineGen --> UserMsg
    SectionGen --> UserMsg

    System --> Request
    UserMsg --> Request

    Request -->|Claude API| Response["JSON Response<br/>(outline or section)"]

    style Input fill:#e1f5ff
    style StylePrep fill:#f3e5f5
    style PromptGen fill:#fff3e0
    style Template fill:#c5e1a5
    style APICall fill:#ffe0b2
    style Response fill:#e8f5e9
```

### Teaching Style Guidance Integration

```mermaid
graph TB
    Style["Teaching Style"]

    Style --> Tone["Tone: formal/<br/>conversational/<br/>balanced"]
    Style --> Approach["Pedagogical:<br/>active-learning/<br/>lecture-based/<br/>problem-based"]
    Style --> Proof["Proof Style:<br/>intuition-first/<br/>rigorous"]
    Style --> Examples["Example Depth:<br/>minimal/<br/>moderate/<br/>multiple-varied"]

    Tone --> Guidance["buildStyleGuidance()"]
    Approach --> Guidance
    Proof --> Guidance
    Examples --> Guidance

    Guidance --> PromptText["For a formal tone, use:\n- Technical vocabulary\n- Precise definitions\n- Rigorous proofs\n\nFor conversational:\n- Plain language\n- Analogies\n- Intuitive explanations"]

    PromptText --> Prompt["Integrated into<br/>Lecture Prompt"]

    style Style fill:#f3e5f5
    style Guidance fill:#fff3e0
    style PromptText fill:#e1f5ff
    style Prompt fill:#c5e1a5
```

---

## 6. Error Handling and Validation Pipeline

Complete error handling flow for generation and formatting.

```mermaid
graph TD
    Start["Generate Content"]

    Start --> AICall["AI API Call"]

    AICall --> AIErr{AI Error?}
    AIErr -->|Timeout| Retry1["Exponential Backoff<br/>Retry 1/3"]
    AIErr -->|Rate Limit| Retry1
    AIErr -->|Network| Retry1
    AIErr -->|No Retries Left| Fail1["❌ Generation Failed"]

    Retry1 --> Attempt2{Retry<br/>Success?}
    Attempt2 -->|Yes| Parse["Parse JSON Response"]
    Attempt2 -->|No| Retry2["Retry 2/3"]
    Retry2 --> Attempt3{Retry<br/>Success?}
    Attempt3 -->|No| Fail1
    Attempt3 -->|Yes| Parse

    AIErr -->|No Error| Parse

    Parse --> ParseErr{Parse<br/>Error?}
    ParseErr -->|Yes| Fail2["❌ JSON Parse Failed"]
    ParseErr -->|No| Schema["Validate Schema"]

    Schema --> SchemaErr{Schema<br/>Valid?}
    SchemaErr -->|No, Strict| Fail3["❌ Validation Failed"]
    SchemaErr -->|No, Lenient| Warn1["⚠️ Schema Issues"]
    SchemaErr -->|Yes| Format

    Warn1 --> Format["Format Output"]

    Format --> FmtErr{Format<br/>Error?}
    FmtErr -->|Yes| Fail4["❌ Format Failed"]
    FmtErr -->|No| Write["Write File"]

    Write --> WriteErr{Write<br/>Success?}
    WriteErr -->|Yes| Success["✅ Success"]
    WriteErr -->|No| Fail5["❌ Write Failed"]

    Fail1 :::error
    Fail2 :::error
    Fail3 :::error
    Fail4 :::error
    Fail5 :::error
    Success :::success
    Warn1 :::warning

    classDef error fill:#ffcdd2
    classDef success fill:#c8e6c9
    classDef warning fill:#fff9c4
```

### Retry Strategy

```mermaid
graph LR
    Request["API Request"]

    Request --> A1["Attempt 1<br/>(0ms backoff)"]
    A1 --> Fail1{Failed?}
    Fail1 -->|No| Success
    Fail1 -->|Yes| Backoff1["Wait 1^2 = 1s"]

    Backoff1 --> A2["Attempt 2<br/>(+1s backoff)"]
    A2 --> Fail2{Failed?}
    Fail2 -->|No| Success["✅ Success"]
    Fail2 -->|Yes| Backoff2["Wait 2^2 = 4s"]

    Backoff2 --> A3["Attempt 3<br/>(+4s backoff)"]
    A3 --> Fail3{Failed?}
    Fail3 -->|No| Success
    Fail3 -->|Yes| MaxRetries["❌ Max retries<br/>exceeded"]

    style Request fill:#e1f5ff
    style A1 fill:#fff3e0
    style A2 fill:#fff3e0
    style A3 fill:#fff3e0
    style Success fill:#c8e6c9
    style MaxRetries fill:#ffcdd2
```

---

## 7. Architecture Dependencies

High-level dependencies between major components.

```mermaid
graph TB
    User["👤 User<br/>CLI Command"]

    User --> Command["Command Handler<br/>(lecture.js, exam.js, etc.)"]

    Command --> Config["Config Loader<br/>loadTeachConfig()"]
    Command --> Style["Style Loader<br/>loadTeachingStyle()"]
    Command --> Template["Template Loader<br/>loadTemplate()"]

    Config --> File1["🔍 .flow/teach-config.yml"]
    Style --> File2["🔍 .claude/teaching-style.local.md"]
    Template --> File3["🔍 src/teaching/templates/"]

    Command --> Prompt["Prompt Builder<br/>buildLecturePrompt()<br/>buildStyleGuidance()"]

    Prompt --> AI["AI Provider<br/>AIProvider.generate()"]
    AI --> Claude["Claude API<br/>Anthropic"]

    AI --> Validator["Validator Engine<br/>ValidatorEngine"]

    Validator --> Command

    Command --> Formatter["Formatter<br/>getFormatter(format)"]

    Formatter --> FmtMD["MarkdownFormatter"]
    Formatter --> FmtQMD["QuartoFormatter"]
    Formatter --> FmtTex["LaTeXFormatter"]
    Formatter --> FmtCanvas["CanvasFormatter"]

    FmtMD --> Output["📝 Output File"]
    FmtQMD --> Output
    FmtTex --> Output
    FmtCanvas --> Output

    style User fill:#e8f5e9
    style Command fill:#e1f5ff
    style Config fill:#f3e5f5
    style Style fill:#f3e5f5
    style Template fill:#f3e5f5
    style Prompt fill:#fff3e0
    style AI fill:#ffe0b2
    style Claude fill:#ffccbc
    style Validator fill:#c5e1a5
    style Formatter fill:#f3e5f5
    style Output fill:#c8e6c9
```

---

## Key Design Patterns

### 1. **Formatter Strategy Pattern**

All formatters inherit from `BaseFormatter` and implement the same interface (`format()`, `validate()`, `getFileExtension()`). This allows runtime selection of formatting strategy.

### 2. **Configuration Merging**

Deep merging strategy for configuration layers:

- **Defaults first** (foundation)
- **Progressively override** with higher-priority layers
- **Preserve unspecified values** from lower layers

### 3. **Teaching Style Composition**

Teaching styles are composed from multiple independent sources and merged using precedence rules. Each layer can partially override without affecting other properties.

### 4. **Prompt Template System**

Prompts are built from reusable components:

- Course context
- Teaching style guidance
- Content requirements
- Output schema specification

### 5. **AI Generation with Resilience**

- **Exponential backoff retry** on transient failures
- **Rate limiting** between requests
- **Schema validation** on output
- **Graceful degradation** in lenient mode

### 6. **Section-by-Section Generation**

Lecture notes are generated in phases:

1. **Outline** - Overall structure
2. **Sections** - Content generation per section with context passing
3. **Assembly** - Combine sections into final document

This enables coherent, long-form content with manageable API calls.

---

## File Structure Reference

```
src/teaching/
├── generators/              # Content generation logic
│   ├── lecture.js          # Lecture slides
│   ├── lecture-notes.js    # Instructor notes (20-30 pages)
│   ├── exam.js
│   ├── quiz.js
│   ├── assignment.js
│   └── syllabus.js
│
├── formatters/             # Output transformations
│   ├── base.js            # Abstract base class
│   ├── markdown.js
│   ├── quarto.js
│   ├── latex.js
│   └── canvas.js
│
├── config/                 # Configuration management
│   ├── loader.js          # .flow/teach-config.yml
│   └── style-loader.js    # 4-layer teaching style system
│
├── ai/                     # AI provider & prompts
│   ├── provider.js        # Claude API wrapper
│   ├── lecture-prompts.js # Outline & section prompts
│   └── [command]-prompts.js
│
├── validators/            # Schema validation
│   └── engine.js
│
├── templates/             # JSON schema templates
│   └── [command].json
│
└── schemas/               # JSONSchema definitions
    └── v2/
```

---

## Configuration Files Location

| File                              | Purpose                                | Layer   |
| --------------------------------- | -------------------------------------- | ------- |
| `~/.claude/CLAUDE.md`             | Global teaching style                  | Layer 1 |
| `.claude/teaching-style.local.md` | Course teaching style                  | Layer 2 |
| `.flow/teach-config.yml`          | Course config (level, field, defaults) | Config  |
| `content/lesson-plans/weekNN.yml` | Lesson-specific overrides              | Layer 4 |

---

## Next Steps for Enhancement

- Implement caching for frequently generated content
- Add progress indicators for long-running section generation
- Support for custom section types beyond built-in types
- Integration with lesson plan metadata for content continuity
- Analytics on generation performance and API usage

---

## 8. Slide Revision & Validation Pipeline

The v2.8.0 unified `--revise` and `--check` feature for slide content improvement. Includes context-aware revision targeting, multi-layer validation, and automated improvement suggestions.

### 8.1 The --revise Pipeline

Shows how slides are parsed, targeted, and revised with optional user instructions or automated analysis.

```mermaid
graph TD
    Start["Input: .qmd Slide File"]

    Start --> Parser["slide-parser.js<br/>parseSlides()"]
    Parser --> Classify["classifySlideType()"]

    Classify --> Targets["resolveTargets()<br/>--section/--slides/--type"]

    Targets --> ContextQ{Slide Count?}
    ContextQ -->|< 30 slides| FullContext["buildContext()<br/>Full context"]
    ContextQ -->|>= 30 slides| TargetedContext["buildContext()<br/>Targeted + neighbors"]

    FullContext --> ReviseCheck{Revision Mode?}
    TargetedContext --> ReviseCheck

    ReviseCheck -->|--instruction| InstructionPath["buildSlideRevisionPrompt()<br/>with user instruction"]
    ReviseCheck -->|bare --revise| AutoPath["autoAnalyze()<br/>7 dimensions"]

    InstructionPath --> AI1["Claude API<br/>Generate revision"]
    AutoPath --> AutoPrompt["buildAutoRevisePrompt()"]
    AutoPrompt --> AI1

    AI1 --> AIResponse["Revised slide content"]

    AIResponse --> Replace["replaceContent()<br/>Update slide in doc"]

    Replace --> Provenance["Add provenance metadata"]

    Provenance --> Output["Write .qmd with revisions"]

    style Start fill:#e1f5ff
    style Parser fill:#e1f5ff
    style Classify fill:#e1f5ff
    style Targets fill:#e1f5ff
    style FullContext fill:#c5e1a5
    style TargetedContext fill:#c5e1a5
    style ReviseCheck fill:#fff3e0
    style InstructionPath fill:#fff3e0
    style AutoPath fill:#fff3e0
    style AutoPrompt fill:#fff3e0
    style AI1 fill:#ffe0b2
    style AIResponse fill:#ffe0b2
    style Replace fill:#f3e5f5
    style Provenance fill:#f3e5f5
    style Output fill:#e8f5e9
```

#### --revise Flow Summary

1. **Parser Stage** - Reads .qmd file and identifies slide boundaries using `slide-parser.js`
2. **Classification** - Determines slide types (title, content, examples, summary, etc.)
3. **Targeting** - Resolves user options (`--section`, `--slides`, `--type`) to specific slides
4. **Context Building** - Gathers full or targeted context based on slide count (threshold: 30 slides)
5. **Revision Strategy** - Two paths:
   - **With `--instruction`**: Uses user-provided guidance in revision prompt
   - **Bare `--revise`**: Auto-analyzes 7 dimensions (density, practice-distribution, style-compliance, math-depth, worked-examples, content-completeness, r-output-interpretation)
6. **AI Generation** - Calls Claude API with revision prompt and context
7. **Content Replacement** - Updates slides with revised content
8. **Provenance** - Adds metadata tracking the revision source and timestamp
9. **Output** - Writes modified .qmd file back to disk

---

### 8.2 The --check Pipeline

Validates slides against lesson plan, structure, timing, and style rules. Generates a report and optional revision commands.

```mermaid
graph TD
    Start["Input: .qmd File + Lesson Plan"]

    Start --> Parser["slide-parser.js<br/>parseSlides()"]
    Parser --> Classify["classifySlideType()"]

    Classify --> LessonLoad["Load lesson-plan.yml"]
    LessonLoad --> Objectives["Extract learning objectives"]

    Objectives --> Layer1["Layer 1: Coverage Validation<br/>validateSlideCoverage()"]

    Layer1 --> KeywordMatch["Keyword matching:<br/>slides vs objectives"]
    KeywordMatch --> Coverage{Coverage<br/>Sufficient?}
    Coverage -->|No| CoverageIssue["Missing topic coverage"]
    Coverage -->|Yes| Layer2["Layer 2: Structure Validation<br/>validateSlideStructure()"]

    CoverageIssue --> Report1["Add to report"]
    Report1 --> Layer2

    Layer2 --> CountCheck["Slide count vs<br/>duration estimate"]
    CountCheck --> RatioCheck["Title/content/visual<br/>ratio analysis"]
    RatioCheck --> TimingCheck["Estimated pacing<br/>vs time budget"]

    TimingCheck --> Structure{Issues Found?}
    Structure -->|Yes| StructureIssue["Report structural issues"]
    Structure -->|No| Layer3["Layer 3: Style Validation<br/>validateSlideStyle()"]

    StructureIssue --> Report2["Add to report"]
    Report2 --> Layer3

    Layer3 --> Rule1["Consistent formatting"]
    Layer3 --> Rule2["Text density limits"]
    Layer3 --> Rule3["Heading hierarchy"]
    Layer3 --> Rule4["Code block formatting"]
    Layer3 --> Rule5["Math notation consistency"]

    Rule1 --> StyleCheck{Style Compliant?}
    Rule2 --> StyleCheck
    Rule3 --> StyleCheck
    Rule4 --> StyleCheck
    Rule5 --> StyleCheck

    StyleCheck -->|No| StyleIssue["Report style violations"]
    StyleCheck -->|Yes| Format["formatSlideCheckReport()"]

    StyleIssue --> Format

    Format --> Report["Generate check report"]

    Report --> ReviseCmd["generateReviseCommands()<br/>Suggest --revise calls"]

    ReviseCmd --> OutputReport["Output report +<br/>suggested commands"]

    style Start fill:#e1f5ff
    style Parser fill:#e1f5ff
    style Classify fill:#e1f5ff
    style LessonLoad fill:#e1f5ff
    style Objectives fill:#e1f5ff
    style Layer1 fill:#fff3e0
    style KeywordMatch fill:#fff3e0
    style Coverage fill:#ffe0b2
    style CoverageIssue fill:#ffcdd2
    style Report1 fill:#ffcdd2
    style Layer2 fill:#fff3e0
    style CountCheck fill:#fff3e0
    style RatioCheck fill:#fff3e0
    style TimingCheck fill:#fff3e0
    style Structure fill:#ffe0b2
    style StructureIssue fill:#ffcdd2
    style Report2 fill:#ffcdd2
    style Layer3 fill:#fff3e0
    style Rule1 fill:#fff3e0
    style Rule2 fill:#fff3e0
    style Rule3 fill:#fff3e0
    style Rule4 fill:#fff3e0
    style Rule5 fill:#fff3e0
    style StyleCheck fill:#ffe0b2
    style StyleIssue fill:#ffcdd2
    style Format fill:#f3e5f5
    style Report fill:#e8f5e9
    style ReviseCmd fill:#e8f5e9
    style OutputReport fill:#c8e6c9
```

#### --check Flow Summary

1. **Input & Parsing** - Reads .qmd slide file and lesson plan YAML
2. **Classification** - Identifies slide types for context-aware validation
3. **Objectives Extraction** - Loads learning objectives from lesson plan
4. **Layer 1: Coverage** - Validates slides cover all learning objectives via keyword matching
5. **Layer 2: Structure** - Checks slide count vs duration, title/content ratio, and pacing alignment
6. **Layer 3: Style** - Validates 5 style rules (formatting consistency, text density, heading hierarchy, code formatting, math notation)
7. **Report Generation** - Formats findings with severity levels and locations
8. **Revision Commands** - Generates suggested `--revise` commands for detected issues
9. **Output** - Displays report and actionable revision suggestions

---

### 8.3 Module Relationships

Shows how the slide revision/check modules integrate with existing lecture generation and validation systems.

```mermaid
graph TB
    subgraph Input["Input Sources"]
        QmdFile[".qmd Slide File"]
        LessonPlan["lesson-plan.yml"]
        Config["Config/Style"]
    end

    subgraph SlideModules["Slide Processing (v2.8.0)"]
        SlideParser["slide-parser.js<br/>parseSlides()"]
        SlideRefiner["slide-refiner.js<br/>autoAnalyze()<br/>buildSlideRevisionPrompt()"]
        SlideCoverage["slide-coverage.js<br/>validateSlideCoverage()<br/>validateSlideStructure()<br/>validateSlideStyle()"]
    end

    subgraph LectureModules["Existing Lecture Modules"]
        QmdParse["qmd-parser.js<br/>parseStructure()"]
        LectureRefine["lecture-refiner.js<br/>autoAnalyze()"]
        LectureCov["lecture-coverage.js<br/>validateCoverage()"]
    end

    subgraph AICore["AI & Validation Core"]
        AIProvider["ai/provider.js<br/>Claude API wrapper"]
        ConfigLoader["config/loader.js<br/>Config/Style merging"]
    end

    subgraph OutputArtifacts["Output & Artifacts"]
        Report["Check Report"]
        RevisedSlides["Revised .qmd"]
        Commands["Revision Commands"]
    end

    QmdFile --> SlideParser
    LessonPlan --> SlideCoverage
    Config --> ConfigLoader

    SlideParser --> SlideRefiner
    SlideParser --> SlideCoverage

    SlideRefiner --> AIProvider
    SlideCoverage --> AIProvider

    ConfigLoader --> SlideModules
    ConfigLoader --> LectureModules

    AIProvider --> RevisedSlides
    AIProvider --> Report

    SlideCoverage --> Commands

    SlideRefiner -.->|similar patterns| LectureRefine
    SlideCoverage -.->|shared validation logic| LectureCov
    SlideParser -.->|complements| QmdParse

    style Input fill:#e1f5ff
    style SlideModules fill:#fff3e0
    style LectureModules fill:#f3e5f5
    style AICore fill:#ffe0b2
    style OutputArtifacts fill:#e8f5e9
```

#### Module Integration Summary

| Module | Purpose | Integrations |
|--------|---------|--------------|
| **slide-parser.js** | Parse .qmd and identify slide boundaries | Feeds into `slide-refiner.js` and `slide-coverage.js` |
| **slide-refiner.js** | Automated slide analysis (7 dimensions) and revision prompt building | Uses `ai/provider.js` for Claude API calls |
| **slide-coverage.js** | 3-layer validation (coverage, structure, style) | Uses `config/loader.js` for style rules |
| **qmd-parser.js** | Quarto document structure parsing | Provides foundation for slide-parser.js |
| **lecture-refiner.js** | Lecture-level improvements | Parallel implementation to slide-refiner.js |
| **lecture-coverage.js** | Lecture validation pipeline | Shares validation patterns with slide-coverage.js |

---

### 8.4 Data Flow: --revise with --instruction

Walkthrough of a real revision request with user instruction.

```mermaid
sequenceDiagram
    participant User
    participant CLI as CLI Handler
    participant Parser as slide-parser.js
    participant Refiner as slide-refiner.js
    participant AI as Claude API
    participant FS as File I/O

    User ->> CLI: --revise slides.qmd<br/>--slides "3,5,8"<br/>--instruction "Add examples"

    CLI ->> Parser: parseSlides(qmdFile)
    Parser -->> CLI: 12 slides with metadata

    CLI ->> Parser: classifySlideType()
    Parser -->> CLI: Slide types identified

    CLI ->> Refiner: resolveTargets(["3","5","8"])
    Refiner -->> CLI: Target slides + neighbors

    CLI ->> Refiner: buildContext()<br/>slide_count=12 (< 30)
    Refiner -->> CLI: Full context

    CLI ->> Refiner: buildSlideRevisionPrompt()<br/>instruction="Add examples"
    Refiner -->> CLI: Revision prompt

    CLI ->> AI: POST /messages
    AI -->> CLI: Revised slides JSON

    CLI ->> Refiner: replaceContent()
    Refiner -->> CLI: Updated document

    CLI ->> FS: Write .qmd file
    FS -->> User: 3 slides revised
```

---

### 8.5 Design Considerations

#### Slide Count Thresholds
- **< 30 slides**: Full context sent to API (coherent understanding of entire presentation)
- **>= 30 slides**: Targeted context + immediate neighbors (balance context window vs token usage)

#### Seven Auto-Analysis Dimensions
When using bare `--revise` (no instruction), `autoAnalyze()` evaluates:
1. **density** — Flag overcrowded (>20 lines) or sparse (<3 lines) slides
2. **practice-distribution** — Ensure even spread of practice/quiz slides across sections
3. **style-compliance** — Match configured tone and formatting rules
4. **math-depth** — Formulas with explanation and derivation
5. **worked-examples** — Definition slides have nearby example slides
6. **content-completeness** — Sufficient concept explanation per slide
7. **r-output-interpretation** — Code output slides include interpretation

#### Validation Layer Architecture
- **Layer 1 (Coverage)** - Semantic alignment with lesson plan objectives
- **Layer 2 (Structure)** - Quantitative metrics (count, ratio, timing)
- **Layer 3 (Style)** - Qualitative rules from config/teaching-style

#### Provenance Tracking
Each revision includes:
- Timestamp of revision
- Revision source (`--instruction` or `--revise`)
- User instruction text (if applicable)
- Slide IDs affected

---

## 9. Insights-Driven Enhancements (v2.15.0)

### 9.1 R Validation Pipeline Flow

```mermaid
flowchart TD
    CMD[Command: assignment/lecture/slides/solution] -->|--validate flag| VP[validate-pipeline.js]
    VP --> EXT[extractRChunks from r-code.js]
    EXT --> FILTER{Has runnable chunks?}
    FILTER -->|No| SKIP[Return: all skipped]
    FILTER -->|Yes| BUILD[buildValidationScript]
    BUILD --> TEMP[Write temp .R file]
    TEMP --> EXEC[execFileSync Rscript]
    EXEC --> PARSE[parseValidationOutput]
    PARSE --> RESULT{Results}
    RESULT -->|All pass| PASS[Report success]
    RESULT -->|Some fail| FAIL[Report failures]
    FAIL --> FIX{Offer auto-fix?}
    FIX -->|Yes| RERUN[Re-generate + re-validate]
    FIX -->|No| DONE[Done]
```

### 9.2 Preflight Check Architecture

```mermaid
flowchart LR
    PF[/teaching:preflight] --> RC[runAllChecks]
    RC --> VS[checkVersionSync]
    RC --> CM[checkConflictMarkers]
    RC --> TC[checkTestCounts]
    RC --> CC[checkCacheCleanup]
    RC --> CL[checkChangelog]
    RC --> SF[checkStatusFile]
    VS --> AGG[Aggregate Results]
    CM --> AGG
    TC --> AGG
    CC --> AGG
    CL --> AGG
    SF --> AGG
    AGG -->|--fix| FIX[Apply fixable fixes]
    AGG -->|--json| JSON[JSON output]
    AGG -->|default| TABLE[Table output]
```

### 9.3 Email Send Pipeline

```mermaid
sequenceDiagram
    participant CMD as Command
    participant SO as send-output.js
    participant CFG as teach-config.yml
    participant HIM as Himalaya MCP

    CMD->>SO: resolveRecipient(options, config)
    SO->>CFG: Look up ta_email / instructor_email
    SO-->>CMD: recipient email
    CMD->>SO: formatEmail(contentType, content, options)
    SO-->>CMD: { subject, body }
    CMD->>SO: buildSendInstructions(email)
    SO-->>CMD: Preview + send instructions
    CMD->>HIM: compose_email(to, subject, body)
```
