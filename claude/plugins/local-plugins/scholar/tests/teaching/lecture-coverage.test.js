/**
 * Unit Tests: Lecture Coverage Validator
 *
 * Tests keyword extraction, section matching, formatCoverageReport,
 * and edge cases for the coverage validation system.
 */

import { describe, it, expect } from '@jest/globals';
import {
  extractKeywords,
  findMatchingSections,
  formatCoverageReport
} from '../../src/teaching/validators/lecture-coverage.js';

// ─────────────────────────────────────────────────────────────
// extractKeywords
// ─────────────────────────────────────────────────────────────

describe('extractKeywords()', () => {
  it('should extract content keywords, stripping stop words', () => {
    const kw = extractKeywords('Understand the principles of linear regression');
    expect(kw).toContain('principles');
    expect(kw).toContain('linear');
    expect(kw).toContain('regression');
    expect(kw).not.toContain('the');
    expect(kw).not.toContain('of');
  });

  it('should strip Bloom taxonomy verbs', () => {
    const kw = extractKeywords('Analyze and evaluate the ANOVA assumptions');
    expect(kw).not.toContain('analyze');
    expect(kw).not.toContain('evaluate');
    expect(kw).toContain('anova');
    expect(kw).toContain('assumptions');
  });

  it('should return empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
    expect(extractKeywords(null)).toEqual([]);
    expect(extractKeywords(undefined)).toEqual([]);
  });

  it('should strip special characters', () => {
    const kw = extractKeywords('R² (adjusted) & VIF > 10');
    // After stripping: "r   adjusted    vif    10"
    // "adjusted" > 2 chars and not a stop word
    expect(kw).toContain('adjusted');
    expect(kw).toContain('vif');
  });

  it('should return lowercase keywords', () => {
    const kw = extractKeywords('Multiple Regression Analysis');
    expect(kw).toContain('multiple');
    expect(kw).toContain('regression');
    expect(kw).toContain('analysis');
  });

  it('should filter words with <= 2 characters', () => {
    const kw = extractKeywords('An in or up is it so');
    expect(kw).toEqual([]);
  });

  it('should handle all-stop-word input', () => {
    const kw = extractKeywords('identify and describe using the students');
    expect(kw).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────
// findMatchingSections
// ─────────────────────────────────────────────────────────────

describe('findMatchingSections()', () => {
  const sectionContents = [
    { title: 'Introduction', slug: 'introduction', searchText: 'introduction to linear regression analysis with examples' },
    { title: 'Core Concepts', slug: 'core-concepts', searchText: 'core concepts of multiple regression with vif diagnostics' },
    { title: 'Worked Example', slug: 'worked-example', searchText: 'worked example using anova tables for model comparison' },
    { title: 'Summary', slug: 'summary', searchText: 'summary of key takeaways and review concepts' }
  ];

  it('should match sections containing keywords', () => {
    const matches = findMatchingSections(['regression', 'analysis'], sectionContents);
    expect(matches).toContain('Introduction');
  });

  it('should require at least half of keywords to match', () => {
    // 4 keywords → threshold = 2 (ceil(4/2))
    // "Introduction" has "regression" and "analysis" → 2/4 → matches
    const matches = findMatchingSections(
      ['regression', 'analysis', 'diagnostics', 'multicollinearity'],
      sectionContents
    );
    expect(matches).toContain('Introduction');
  });

  it('should return empty for no matches', () => {
    const matches = findMatchingSections(['bayesian', 'posterior', 'prior'], sectionContents);
    expect(matches).toEqual([]);
  });

  it('should return empty for empty keywords', () => {
    expect(findMatchingSections([], sectionContents)).toEqual([]);
  });

  it('should match single keyword (threshold = 1)', () => {
    const matches = findMatchingSections(['vif'], sectionContents);
    expect(matches).toContain('Core Concepts');
  });

  it('should match across multiple sections', () => {
    const matches = findMatchingSections(['concepts'], sectionContents);
    // "Core Concepts" (title) and "Summary" (searchText has "concepts")
    expect(matches).toContain('Core Concepts');
    expect(matches).toContain('Summary');
  });
});

// ─────────────────────────────────────────────────────────────
// formatCoverageReport
// ─────────────────────────────────────────────────────────────

describe('formatCoverageReport()', () => {
  it('should format a 100% coverage report', () => {
    const report = {
      lectureFile: 'week08.qmd',
      lessonPlan: 'week08.yml',
      coveragePercent: 100,
      objectives: [
        { id: 'LO-8.1', description: 'Understand regression', covered: true, foundInSections: ['Introduction'] }
      ],
      topics: [
        { id: 'Regression', description: 'Regression', covered: true, foundInSections: ['Core Concepts'] }
      ],
      gaps: []
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Coverage: 2/2 (100%)');
    expect(output).toContain('[x] LO-8.1');
    expect(output).not.toContain('gap(s) found');
  });

  it('should format a report with gaps', () => {
    const report = {
      lectureFile: 'week08.qmd',
      lessonPlan: 'week08.yml',
      coveragePercent: 50,
      objectives: [
        { id: 'LO-8.1', description: 'Covered objective', covered: true, foundInSections: ['Intro'] },
        { id: 'LO-8.2', description: 'Missing objective', covered: false, foundInSections: [] }
      ],
      topics: [],
      gaps: ['LO-8.2: Missing objective']
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Coverage: 1/2 (50%)');
    expect(output).toContain('1 gap(s) found');
    expect(output).toContain('[x] LO-8.1');
    expect(output).toContain('[ ] LO-8.2');
    expect(output).toContain('(NOT FOUND)');
  });

  it('should format a 0% coverage report', () => {
    const report = {
      lectureFile: 'empty.qmd',
      lessonPlan: 'week01.yml',
      coveragePercent: 0,
      objectives: [
        { id: 'LO-1.1', description: 'Obj 1', covered: false, foundInSections: [] },
        { id: 'LO-1.2', description: 'Obj 2', covered: false, foundInSections: [] }
      ],
      topics: [],
      gaps: ['LO-1.1: Obj 1', 'LO-1.2: Obj 2']
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Coverage: 0/2 (0%)');
    expect(output).toContain('2 gap(s) found');
  });

  it('should handle report with no objectives', () => {
    const report = {
      lectureFile: 'test.qmd',
      lessonPlan: 'test.yml',
      coveragePercent: 100,
      objectives: [],
      topics: [
        { id: 'Topic', description: 'Topic A', covered: true, foundInSections: ['Section'] }
      ],
      gaps: []
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Coverage: 1/1 (100%)');
    expect(output).toContain('Topics:');
    expect(output).not.toContain('Learning Objectives:');
  });

  it('should handle report with no topics', () => {
    const report = {
      lectureFile: 'test.qmd',
      lessonPlan: 'test.yml',
      coveragePercent: 100,
      objectives: [
        { id: 'LO-1', description: 'Obj', covered: true, foundInSections: ['S1'] }
      ],
      topics: [],
      gaps: []
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Learning Objectives:');
    expect(output).not.toContain('Topics:');
  });

  it('should include separator line', () => {
    const report = {
      lectureFile: 'test.qmd',
      lessonPlan: 'test.yml',
      coveragePercent: 100,
      objectives: [],
      topics: [],
      gaps: []
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('─'.repeat(55));
  });

  it('should show multiple found-in sections', () => {
    const report = {
      lectureFile: 'test.qmd',
      lessonPlan: 'test.yml',
      coveragePercent: 100,
      objectives: [{
        id: 'LO-1',
        description: 'Multi-section obj',
        covered: true,
        foundInSections: ['Intro', 'Concepts', 'Summary']
      }],
      topics: [],
      gaps: []
    };
    const output = formatCoverageReport(report);
    expect(output).toContain('Intro, Concepts, Summary');
  });
});
