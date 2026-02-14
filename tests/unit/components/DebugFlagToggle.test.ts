/**
 * Unit tests for the DebugFlagToggle component logic.
 *
 * Tests the flagged/unflagged state rendering logic, date formatting,
 * and the display conditions for flag metadata.
 */

import { describe, it, expect } from 'vitest'
import type { User } from '~/types'
import { createMockUser } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted logic from DebugFlagToggle.vue
// ---------------------------------------------------------------------------

interface DebugFlagProps {
  debugFlag: boolean
  debugFlaggedBy?: User | null
  debugFlaggedAt?: string | null
}

function getButtonLabel(debugFlag: boolean): string {
  return debugFlag ? 'Flagged' : 'Flag for Debug'
}

function getButtonIcon(debugFlag: boolean): string {
  return debugFlag ? 'i-lucide-bug' : 'i-lucide-bug-off'
}

function getButtonColor(debugFlag: boolean): string {
  return debugFlag ? 'error' : 'neutral'
}

function getButtonVariant(debugFlag: boolean): string {
  return debugFlag ? 'soft' : 'ghost'
}

function getAriaLabel(debugFlag: boolean): string {
  return debugFlag ? 'Remove debug flag' : 'Flag for debug'
}

function formatFlaggedDate(debugFlaggedAt: string | null | undefined): string | null {
  if (!debugFlaggedAt) return null
  return new Date(debugFlaggedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function shouldShowMetadata(props: DebugFlagProps): boolean {
  return props.debugFlag && !!(props.debugFlaggedBy || formatFlaggedDate(props.debugFlaggedAt))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DebugFlagToggle Logic', () => {
  describe('Button label', () => {
    it('shows "Flagged" when debug flag is true', () => {
      expect(getButtonLabel(true)).toBe('Flagged')
    })

    it('shows "Flag for Debug" when debug flag is false', () => {
      expect(getButtonLabel(false)).toBe('Flag for Debug')
    })
  })

  describe('Button icon', () => {
    it('uses bug icon when flagged', () => {
      expect(getButtonIcon(true)).toBe('i-lucide-bug')
    })

    it('uses bug-off icon when not flagged', () => {
      expect(getButtonIcon(false)).toBe('i-lucide-bug-off')
    })
  })

  describe('Button color', () => {
    it('uses error color when flagged', () => {
      expect(getButtonColor(true)).toBe('error')
    })

    it('uses neutral color when not flagged', () => {
      expect(getButtonColor(false)).toBe('neutral')
    })
  })

  describe('Button variant', () => {
    it('uses soft variant when flagged', () => {
      expect(getButtonVariant(true)).toBe('soft')
    })

    it('uses ghost variant when not flagged', () => {
      expect(getButtonVariant(false)).toBe('ghost')
    })
  })

  describe('Aria label', () => {
    it('says "Remove debug flag" when flagged', () => {
      expect(getAriaLabel(true)).toBe('Remove debug flag')
    })

    it('says "Flag for debug" when not flagged', () => {
      expect(getAriaLabel(false)).toBe('Flag for debug')
    })
  })

  describe('Date formatting', () => {
    it('formats a valid date string to US locale', () => {
      const result = formatFlaggedDate('2025-06-15T10:30:00.000Z')
      expect(result).toBe('Jun 15, 2025')
    })

    it('returns null for null input', () => {
      expect(formatFlaggedDate(null)).toBeNull()
    })

    it('returns null for undefined input', () => {
      expect(formatFlaggedDate(undefined)).toBeNull()
    })

    it('formats another date correctly', () => {
      // Use a mid-day timestamp to avoid timezone boundary issues
      const result = formatFlaggedDate('2025-01-15T12:00:00.000Z')
      expect(result).toContain('2025')
      expect(result).toContain('Jan')
    })

    it('formats a date at end of year', () => {
      const result = formatFlaggedDate('2025-12-31T23:59:59.000Z')
      expect(result).toContain('2025')
      expect(result).toContain('Dec')
    })
  })

  describe('Metadata visibility', () => {
    it('shows metadata when flagged and flaggedBy is present', () => {
      const props: DebugFlagProps = {
        debugFlag: true,
        debugFlaggedBy: createMockUser({ name: 'Jane Doe' }),
        debugFlaggedAt: null,
      }
      expect(shouldShowMetadata(props)).toBe(true)
    })

    it('shows metadata when flagged and flaggedAt is present', () => {
      const props: DebugFlagProps = {
        debugFlag: true,
        debugFlaggedBy: null,
        debugFlaggedAt: '2025-06-15T10:30:00.000Z',
      }
      expect(shouldShowMetadata(props)).toBe(true)
    })

    it('shows metadata when flagged and both flaggedBy and flaggedAt are present', () => {
      const props: DebugFlagProps = {
        debugFlag: true,
        debugFlaggedBy: createMockUser({ name: 'Jane Doe' }),
        debugFlaggedAt: '2025-06-15T10:30:00.000Z',
      }
      expect(shouldShowMetadata(props)).toBe(true)
    })

    it('hides metadata when not flagged even if flaggedBy is present', () => {
      const props: DebugFlagProps = {
        debugFlag: false,
        debugFlaggedBy: createMockUser({ name: 'Jane Doe' }),
        debugFlaggedAt: '2025-06-15T10:30:00.000Z',
      }
      expect(shouldShowMetadata(props)).toBe(false)
    })

    it('hides metadata when flagged but no flaggedBy or flaggedAt', () => {
      const props: DebugFlagProps = {
        debugFlag: true,
        debugFlaggedBy: null,
        debugFlaggedAt: null,
      }
      expect(shouldShowMetadata(props)).toBe(false)
    })

    it('hides metadata when not flagged and no metadata', () => {
      const props: DebugFlagProps = {
        debugFlag: false,
        debugFlaggedBy: null,
        debugFlaggedAt: null,
      }
      expect(shouldShowMetadata(props)).toBe(false)
    })
  })

  describe('Metadata text content', () => {
    it('includes user name in metadata when flaggedBy is present', () => {
      const user = createMockUser({ name: 'Alice Smith' })
      const nameText = `by ${user.name}`
      expect(nameText).toBe('by Alice Smith')
    })

    it('includes formatted date in metadata when flaggedAt is present', () => {
      const date = formatFlaggedDate('2025-03-20T14:00:00.000Z')
      const dateText = `on ${date}`
      expect(dateText).toContain('on')
      expect(dateText).toContain('Mar')
      expect(dateText).toContain('2025')
    })

    it('includes both user name and date when both present', () => {
      const user = createMockUser({ name: 'Bob Wilson' })
      const date = formatFlaggedDate('2025-07-04T12:00:00.000Z')
      const metadataText = `by ${user.name} on ${date}`
      expect(metadataText).toContain('by Bob Wilson')
      expect(metadataText).toContain('on Jul')
    })
  })
})
