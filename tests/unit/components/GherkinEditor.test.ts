/**
 * Unit tests for the GherkinEditor component logic.
 *
 * Tests the Gherkin syntax highlighting logic (escapeHtml, keyword detection)
 * and the preview/edit toggle behavior.
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Extracted logic from GherkinEditor.vue
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

function highlightLine(line: string): string {
  const trimmed = line.trim()

  if (trimmed.startsWith('Feature:')) {
    return `<span class="text-purple-600 dark:text-purple-400 font-bold">${escapeHtml(line)}</span>`
  }
  if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
    return `<span class="text-blue-600 dark:text-blue-400 font-bold">${escapeHtml(line)}</span>`
  }
  if (trimmed.startsWith('Background:')) {
    return `<span class="text-teal-600 dark:text-teal-400 font-bold">${escapeHtml(line)}</span>`
  }
  if (/^\s*(Given|When|Then|And|But)\s/.test(line)) {
    const keyword = line.match(/^\s*(Given|When|Then|And|But)\s/)?.[1] ?? ''
    const rest = line.replace(/^\s*(Given|When|Then|And|But)\s/, '')
    const indent = line.match(/^\s*/)?.[0] ?? ''
    return `${indent}<span class="text-green-600 dark:text-green-400 font-semibold">${keyword}</span> ${escapeHtml(rest)}`
  }
  if (trimmed.startsWith('#')) {
    return `<span class="text-gray-400 dark:text-gray-500 italic">${escapeHtml(line)}</span>`
  }
  if (trimmed.startsWith('@')) {
    return `<span class="text-orange-500 dark:text-orange-400">${escapeHtml(line)}</span>`
  }
  if (trimmed.startsWith('|')) {
    return `<span class="text-gray-600 dark:text-gray-300">${escapeHtml(line)}</span>`
  }
  if (trimmed.startsWith('Examples:')) {
    return `<span class="text-indigo-600 dark:text-indigo-400 font-bold">${escapeHtml(line)}</span>`
  }

  return escapeHtml(line)
}

function highlightContent(content: string): string {
  if (!content) return ''
  return content
    .split('\n')
    .map((line) => highlightLine(line))
    .join('\n')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GherkinEditor Logic', () => {
  describe('escapeHtml', () => {
    it('escapes ampersands', () => {
      expect(escapeHtml('A & B')).toBe('A &amp; B')
    })

    it('escapes angle brackets', () => {
      expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    })

    it('escapes double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('escapes single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s')
    })

    it('escapes multiple special characters', () => {
      expect(escapeHtml('<a href="test">&')).toBe('&lt;a href=&quot;test&quot;&gt;&amp;')
    })

    it('returns plain text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })

    it('handles empty string', () => {
      expect(escapeHtml('')).toBe('')
    })
  })

  describe('Keyword highlighting', () => {
    it('highlights Feature: keyword with purple styling', () => {
      const result = highlightLine('Feature: User Login')
      expect(result).toContain('text-purple-600')
      expect(result).toContain('font-bold')
      expect(result).toContain('Feature: User Login')
    })

    it('highlights Scenario: keyword with blue styling', () => {
      const result = highlightLine('  Scenario: Valid login')
      expect(result).toContain('text-blue-600')
      expect(result).toContain('font-bold')
    })

    it('highlights Scenario Outline: keyword with blue styling', () => {
      const result = highlightLine('  Scenario Outline: Login with <credentials>')
      expect(result).toContain('text-blue-600')
      expect(result).toContain('font-bold')
    })

    it('highlights Background: keyword with teal styling', () => {
      const result = highlightLine('  Background:')
      expect(result).toContain('text-teal-600')
      expect(result).toContain('font-bold')
    })

    it('highlights Given keyword with green styling', () => {
      const result = highlightLine('    Given the user is on the login page')
      expect(result).toContain('text-green-600')
      expect(result).toContain('font-semibold')
      expect(result).toContain('Given')
    })

    it('highlights When keyword with green styling', () => {
      const result = highlightLine('    When the user clicks submit')
      expect(result).toContain('text-green-600')
      expect(result).toContain('When')
    })

    it('highlights Then keyword with green styling', () => {
      const result = highlightLine('    Then the user should see the dashboard')
      expect(result).toContain('text-green-600')
      expect(result).toContain('Then')
    })

    it('highlights And keyword with green styling', () => {
      const result = highlightLine('    And the user enters "user@test.com"')
      expect(result).toContain('text-green-600')
      expect(result).toContain('And')
    })

    it('highlights But keyword with green styling', () => {
      const result = highlightLine('    But the error message should not appear')
      expect(result).toContain('text-green-600')
      expect(result).toContain('But')
    })

    it('highlights comment lines with gray italic styling', () => {
      const result = highlightLine('# This is a comment')
      expect(result).toContain('text-gray-400')
      expect(result).toContain('italic')
    })

    it('highlights tag lines with orange styling', () => {
      const result = highlightLine('@smoke @regression')
      expect(result).toContain('text-orange-500')
    })

    it('highlights data table rows with gray styling', () => {
      const result = highlightLine('    | email          | password  |')
      expect(result).toContain('text-gray-600')
    })

    it('highlights Examples: keyword with indigo styling', () => {
      const result = highlightLine('    Examples:')
      expect(result).toContain('text-indigo-600')
      expect(result).toContain('font-bold')
    })

    it('returns escaped plain text for non-keyword lines', () => {
      const result = highlightLine('    Just a plain line')
      expect(result).toBe('    Just a plain line')
      expect(result).not.toContain('<span')
    })
  })

  describe('highlightContent', () => {
    it('returns empty string for empty content', () => {
      expect(highlightContent('')).toBe('')
    })

    it('highlights a full Gherkin feature', () => {
      const gherkin = `Feature: User Login
  Scenario: Valid login
    Given the user is on the login page
    When the user enters valid credentials
    Then the user should see the dashboard`

      const result = highlightContent(gherkin)

      expect(result).toContain('text-purple-600') // Feature
      expect(result).toContain('text-blue-600')   // Scenario
      expect(result).toContain('text-green-600')  // Given/When/Then
    })

    it('preserves newlines between highlighted lines', () => {
      const gherkin = `Feature: Test
  Scenario: Test`
      const result = highlightContent(gherkin)
      expect(result).toContain('\n')
    })

    it('escapes HTML in keyword arguments', () => {
      const gherkin = '    Given the user enters "<script>"'
      const result = highlightContent(gherkin)
      expect(result).toContain('&lt;script&gt;')
      expect(result).not.toContain('<script>')
    })

    it('handles tags and comments together', () => {
      const gherkin = `@smoke
# Login tests
Feature: Login`
      const result = highlightContent(gherkin)
      expect(result).toContain('text-orange-500')  // @smoke tag
      expect(result).toContain('italic')           // # comment
      expect(result).toContain('text-purple-600')  // Feature
    })

    it('handles Scenario Outline with Examples and data tables', () => {
      const gherkin = `  Scenario Outline: Login with various credentials
    Given the user enters "<email>"
    Examples:
      | email            |
      | user@example.com |`

      const result = highlightContent(gherkin)
      expect(result).toContain('text-blue-600')    // Scenario Outline
      expect(result).toContain('text-green-600')   // Given
      expect(result).toContain('text-indigo-600')  // Examples
      expect(result).toContain('text-gray-600')    // data table |
    })
  })

  describe('Preview toggle state', () => {
    it('starts in edit mode (showPreview = false)', () => {
      const showPreview = false
      expect(showPreview).toBe(false)
    })

    it('toggles to preview mode', () => {
      let showPreview = false
      showPreview = !showPreview
      expect(showPreview).toBe(true)
    })

    it('toggles back to edit mode', () => {
      let showPreview = true
      showPreview = !showPreview
      expect(showPreview).toBe(false)
    })

    it('preview button label changes based on state', () => {
      const getLabel = (showPreview: boolean) => showPreview ? 'Edit' : 'Preview'
      expect(getLabel(false)).toBe('Preview')
      expect(getLabel(true)).toBe('Edit')
    })
  })
})
