---
# STAT 545 Teaching Style - Analysis of Variance & Experimental Design
# Scholar Plugin 4-Layer System - Course Level (Layer 2)
#
# This is a comprehensive example of a course-specific teaching style
# configuration for a graduate-level statistics course with cross-listing.
#
# Usage: Copy to .claude/teaching-style.local.md in your course repository

teaching_style:
  # ============================================================================
  # PEDAGOGICAL APPROACH
  # ============================================================================
  pedagogical_approach:
    primary: "problem-based"
    secondary: "active-learning"
    structure: "problem-method-theory-application"
    # Flow: Real problem → Statistical method → Derive theory → Apply in R

  # ============================================================================
  # EXPLANATION STYLE
  # ============================================================================
  explanation_style:
    formality: "balanced"
    proof_style: "rigorous-with-intuition"
    # Full mathematical derivations with intuitive explanations alongside

    example_depth: "multiple-varied"
    # Hand-calculated + R code examples for each concept

    analogies: "moderate"
    theory_depth: "variable-by-topic"

    derivations:
      style: "full-step-by-step"
      annotations: true
      # Annotate each step with rule used

    ems_derivations:
      approach: "both-rigorous-and-heuristic"
      comparison: true
      # Show expected value algebra AND coefficient rules

  # ============================================================================
  # STUDENT INTERACTION
  # ============================================================================
  student_interaction:
    questioning_style: "think-pair-share"
    group_work: "open-ended"
    scaffolding: "minimal"
    feedback_style: "rubric-based"

  # ============================================================================
  # ASSESSMENT PHILOSOPHY
  # ============================================================================
  assessment_philosophy:
    balance: "balanced"
    exam_format: "mixed-question-types"
    quiz_format: "3-5-deeper-questions"
    hypothesis_testing: "effect-sizes-p-values-ci"
    # Always report all three

  # ============================================================================
  # CONTENT PREFERENCES
  # ============================================================================
  content_preferences:
    computational_tools: "R-integrated"
    code_style: "tidyverse-primary"
    real_world_examples: "frequent"
    datasets: "textbook-datasets"

    visualization:
      package: "ggplot2"
      theme: "consistent"

    assumptions_checking:
      workflow: "full-diagnostic"
      package: "performance::check_model()"

    misconceptions: "warning-callouts-throughout"
    motivation: "practical-only"
    prerequisites: "brief-review-at-start"
    error_handling: "clean-code-only"

    reproducibility:
      seed: "document-start"

  # ============================================================================
  # NOTATION CONVENTIONS
  # ============================================================================
  notation_conventions:
    fixed_effects: "Greek letters (α, β, γ, τ)"
    random_effects: "Latin letters (u, v, w)"
    nesting_notation: "β_j(i)"
    sum_of_squares: "SS_Trt, SS_E, SS_T"
    matrices: "bold uppercase (X, Y, Z)"
    vectors: "bold lowercase (y, β, ε)"

  # ============================================================================
  # R PACKAGES
  # ============================================================================
  r_packages:
    core:
      - emmeans      # Estimated marginal means, contrasts
      - lme4         # Linear mixed-effects models
      - car          # ANOVA Type II/III, diagnostics
      - ggplot2      # Visualization
      - dplyr        # Data manipulation
      - tidyr        # Data reshaping

    tables:
      - modelsummary # Publication-quality tables
      - broom        # Model tidying
      - gtsummary    # Summary tables

    diagnostics:
      - performance  # Model diagnostics (check_model)
      - DHARMa       # Residual diagnostics

    mixed_models:
      - lme4         # Primary
      - nlme         # Comparison

  # ============================================================================
  # STATISTICAL METHODS
  # ============================================================================
  statistical_methods:
    post_hoc:
      approach: "show-multiple-methods"
      methods: ["Tukey", "Bonferroni", "Scheffé", "Dunnett"]

    anova_types:
      approach: "compare-all-three"
      guidance: true

    contrasts:
      types: ["treatment", "Helmert", "orthogonal"]
      show_multiple: true

    effect_sizes:
      types: ["eta-squared", "omega-squared", "Cohen's d"]
      comparison: true

    model_selection:
      criteria: ["AIC", "BIC", "likelihood-ratio"]

  # ============================================================================
  # COMMAND OVERRIDES
  # ============================================================================
  command_overrides:
    lecture:
      length: "20-40 pages"
      structure:
        - "Learning Objectives (Bloom's taxonomy verbs)"
        - "Motivating Problem"
        - "Method Introduction"
        - "Theory & Derivations"
        - "R Implementation"
        - "Worked Examples (hand + code)"
        - "Model Diagnostics"
        - "Practice Problems (with solutions)"
        - "Check Your Understanding"
        - "Topic-Specific Appendix"
      callouts:
        - tip
        - important
        - warning
        - note
        - question
        - "Advanced Topic"
      code_interpretation: "always-after-each-chunk"
      practice_problems: "variable-by-topic"
      solutions: "complete"
      appendix:
        include: true
        content: "full-proofs"
        scope: "topic-specific"

    slides:
      format: "revealjs"
      min_slides: 25
      speaker_notes: false
      transitions: "smooth-fade"
      code_display:
        style: "incremental-reveal"
      tables:
        style: "scrollable-panels"
      quizzes:
        count: "3-5"
        depth: "deeper"

    exam:
      format: "mixed-question-types"
      include_solutions: true

    quiz:
      questions: "3-5"
      style: "deeper"

  # ============================================================================
  # CROSS-LISTING SUPPORT
  # ============================================================================
  cross_listing:
    enabled: true
    undergraduate: "STAT 454"
    graduate: "STAT 545"
    differentiation:
      style: "Advanced Topic callouts"
    graduate_content:
      - "Full derivations"
      - "Additional theoretical depth"
      - "Research paper references"

  # ============================================================================
  # REFERENCES
  # ============================================================================
  references:
    primary:
      - "Dean, Voss & Draguljić (2017) - Design and Analysis of Experiments"
    additional:
      - "Montgomery (2017) - Design and Analysis of Experiments"
      - "Kutner et al. (2005) - Applied Linear Statistical Models"
    citation_style: "pandoc-zotero"

  # ============================================================================
  # FILE CONVENTIONS
  # ============================================================================
  file_conventions:
    lectures: "week-NN_topic.qmd"
    slides: "week-NN_topic-slides.qmd"
    assignments: "assignment-NN_topic.qmd"

  # ============================================================================
  # MATH DISPLAY
  # ============================================================================
  math_display:
    environment: "align"
    numbering: "selective"

  # ============================================================================
  # LATEX CONFIGURATION
  # ============================================================================
  latex_configuration:
    macros:
      tex_file: "tex/macros.tex"
      mathjax_file: "includes/mathjax-macros.html"
      # Canonical locations for course macro files

    pdf_settings:
      pdf_engine: xelatex
      documentclass: scrartcl
      mainfont: "TeX Gyre Pagella"
      mathfont: "TeX Gyre Pagella Math"
      monofont: "Fira Code"
      fontsize: 10pt
      linestretch: 1.25
      include_in_header:
        - "tex/macros.tex"
        - "tex/header-fancy-logo.tex"
        - "tex/title-page.tex"

    key_macros:
      # Statistical operators
      expectation: "\\E{X}"
      variance: "\\Var{X}"
      covariance: "\\Cov{X,Y}"
      correlation: "\\Cor{X,Y}"
      probability: "\\Prob{A}"
      # Regression operators
      standard_error: "\\SE"
      mse: "\\mse"
      sse: "\\sse"
      # Matrix operators
      trace: "\\tr"
      diagonal: "\\diag"
      vector: "\\vect{x}"
      # Distributions
      normal: "\\Normal(\\mu, \\sigma^2)"
      # Independence
      independent: "\\indep"

    html_settings:
      include_in_header:
        - "includes/mathjax-macros.html"
      html_math_method:
        method: mathjax
        url: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"

---

# STAT 545 Teaching Style Guide

This example demonstrates a comprehensive teaching style configuration for a graduate-level ANOVA and Experimental Design course.

## Key Features

### 1. Problem-Based Learning Structure

Every lecture follows: **Problem → Method → Theory → Application**

- Start with a real-world research question
- Introduce the statistical approach
- Derive the mathematical foundations
- Implement in R and interpret results

### 2. Rigorous with Intuition

Mathematical derivations include:

- Full step-by-step algebra
- Annotations explaining each rule used
- Intuitive explanations alongside formal proofs
- Both rigorous and heuristic approaches for EMS

### 3. Cross-Listed Course Support

Content differentiated for:

- **STAT 454 (Undergraduate):** Focus on application and interpretation
- **STAT 545 (Graduate):** Additional theory, proofs, and derivations

Use `{.callout-note title="Advanced Topic"}` for graduate-only content.

### 4. Comprehensive R Integration

Required packages loaded with `pacman::p_load()`:

- **Core:** emmeans, lme4, car, ggplot2, dplyr
- **Tables:** modelsummary, broom, gtsummary
- **Diagnostics:** performance, DHARMa

### 5. Notation Standards

| Element | Convention |
|---------|------------|
| Fixed effects | Greek (α, β, γ, τ) |
| Random effects | Latin (u, v, w) |
| Nesting | β_j(i) subscript |
| Sum of squares | SS_Trt, SS_E |

### 6. LaTeX Macros

Standardized macros ensure consistent notation across PDF and HTML outputs:

| Category | Macros |
|----------|--------|
| Statistical operators | `\E{X}`, `\Var{X}`, `\Cov{X,Y}`, `\Prob{A}` |
| Regression | `\SE`, `\mse`, `\sse`, `\Bias` |
| Vectors/matrices | `\vect{y}`, `\tr`, `\diag`, `\rank` |
| Distributions | `\Normal`, `\Binom`, `\Poiss` |
| Independence | `\indep`, `\nindep` |

Example usage in derivations:

```latex
\E{MS_{Trt}} = \sigma^2 + \frac{n\sum\tau_i^2}{a-1}
```

## Usage

1. Copy this file to `.claude/teaching-style.local.md` in your course repository
2. Modify settings to match your course requirements
3. Use `/teaching:lecture` and `/teaching:slides` commands
4. The Scholar plugin will use these settings for all generated content

## Related Examples

- See `stat440-regression.md` for regression analysis course
- See `intro-stats.md` for introductory statistics course
- See `bayesian-methods.md` for Bayesian statistics course
