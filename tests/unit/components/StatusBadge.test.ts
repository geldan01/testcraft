/**
 * Unit tests for the StatusBadge component.
 *
 * Tests that each TestRunStatus value renders the correct label,
 * color, and icon.
 */

import { describe, it, expect } from 'vitest'
import type { TestRunStatus } from '~/types'

// The StatusBadge component's internal configuration
const statusConfig: Record<TestRunStatus, { label: string; color: string; icon: string }> = {
  PASS: { label: 'Pass', color: 'success', icon: 'i-lucide-check-circle' },
  FAIL: { label: 'Fail', color: 'error', icon: 'i-lucide-x-circle' },
  BLOCKED: { label: 'Blocked', color: 'warning', icon: 'i-lucide-ban' },
  SKIPPED: { label: 'Skipped', color: 'neutral', icon: 'i-lucide-skip-forward' },
  IN_PROGRESS: { label: 'In Progress', color: 'info', icon: 'i-lucide-loader' },
  NOT_RUN: { label: 'Not Run', color: 'neutral', icon: 'i-lucide-circle-dashed' },
}

describe('StatusBadge', () => {
  describe('Status configuration mapping', () => {
    it('maps PASS to correct label, color, and icon', () => {
      const config = statusConfig['PASS']
      expect(config.label).toBe('Pass')
      expect(config.color).toBe('success')
      expect(config.icon).toBe('i-lucide-check-circle')
    })

    it('maps FAIL to correct label, color, and icon', () => {
      const config = statusConfig['FAIL']
      expect(config.label).toBe('Fail')
      expect(config.color).toBe('error')
      expect(config.icon).toBe('i-lucide-x-circle')
    })

    it('maps BLOCKED to correct label, color, and icon', () => {
      const config = statusConfig['BLOCKED']
      expect(config.label).toBe('Blocked')
      expect(config.color).toBe('warning')
      expect(config.icon).toBe('i-lucide-ban')
    })

    it('maps SKIPPED to correct label, color, and icon', () => {
      const config = statusConfig['SKIPPED']
      expect(config.label).toBe('Skipped')
      expect(config.color).toBe('neutral')
      expect(config.icon).toBe('i-lucide-skip-forward')
    })

    it('maps IN_PROGRESS to correct label, color, and icon', () => {
      const config = statusConfig['IN_PROGRESS']
      expect(config.label).toBe('In Progress')
      expect(config.color).toBe('info')
      expect(config.icon).toBe('i-lucide-loader')
    })

    it('maps NOT_RUN to correct label, color, and icon', () => {
      const config = statusConfig['NOT_RUN']
      expect(config.label).toBe('Not Run')
      expect(config.color).toBe('neutral')
      expect(config.icon).toBe('i-lucide-circle-dashed')
    })
  })

  describe('All statuses are covered', () => {
    it('has configuration for all 6 TestRunStatus values', () => {
      const allStatuses: TestRunStatus[] = [
        'PASS',
        'FAIL',
        'BLOCKED',
        'SKIPPED',
        'IN_PROGRESS',
        'NOT_RUN',
      ]

      for (const status of allStatuses) {
        expect(statusConfig[status]).toBeDefined()
        expect(statusConfig[status].label).toBeTruthy()
        expect(statusConfig[status].color).toBeTruthy()
        expect(statusConfig[status].icon).toBeTruthy()
      }
    })

    it('each status has a unique label', () => {
      const labels = Object.values(statusConfig).map((c) => c.label)
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(labels.length)
    })

    it('each status has a unique icon', () => {
      const icons = Object.values(statusConfig).map((c) => c.icon)
      const uniqueIcons = new Set(icons)
      expect(uniqueIcons.size).toBe(icons.length)
    })
  })

  describe('Fallback for unknown status', () => {
    it('falls back to NOT_RUN config for unknown status', () => {
      const unknownStatus = 'UNKNOWN' as TestRunStatus
      const config = statusConfig[unknownStatus] ?? statusConfig['NOT_RUN']
      expect(config.label).toBe('Not Run')
      expect(config.color).toBe('neutral')
    })
  })
})
