/**
 * Unit tests for the StepBuilder component logic.
 *
 * Tests the core functions: addStep, removeStep, moveStep (up/down),
 * updateStep, and step renumbering after mutations.
 *
 * Since rendering Vue components in a Nuxt context requires heavy setup,
 * these tests extract and validate the pure logic used by StepBuilder.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { TestStep } from '~/types'
import { createMockStep, resetFixtureCounter } from '~/tests/factories'

// ---------------------------------------------------------------------------
// Extracted logic from StepBuilder.vue
// ---------------------------------------------------------------------------

function addStep(steps: TestStep[]): TestStep[] {
  const newStep: TestStep = {
    stepNumber: steps.length + 1,
    action: '',
    data: '',
    expectedResult: '',
  }
  return [...steps, newStep]
}

function removeStep(steps: TestStep[], index: number): TestStep[] {
  const updated = steps.filter((_, i) => i !== index)
  return updated.map((step, i) => ({
    ...step,
    stepNumber: i + 1,
  }))
}

function moveStep(steps: TestStep[], index: number, direction: 'up' | 'down'): TestStep[] {
  const newSteps = [...steps]
  const targetIndex = direction === 'up' ? index - 1 : index + 1

  if (targetIndex < 0 || targetIndex >= newSteps.length) return newSteps

  const temp = newSteps[targetIndex]
  newSteps[targetIndex] = newSteps[index]
  newSteps[index] = temp

  return newSteps.map((step, i) => ({
    ...step,
    stepNumber: i + 1,
  }))
}

function updateStep(steps: TestStep[], index: number, field: keyof TestStep, value: string): TestStep[] {
  const updated = [...steps]
  updated[index] = { ...updated[index], [field]: value }
  return updated
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StepBuilder Logic', () => {
  beforeEach(() => {
    resetFixtureCounter()
  })

  describe('addStep', () => {
    it('adds a new empty step to an empty list', () => {
      const result = addStep([])
      expect(result).toHaveLength(1)
      expect(result[0].stepNumber).toBe(1)
      expect(result[0].action).toBe('')
      expect(result[0].data).toBe('')
      expect(result[0].expectedResult).toBe('')
    })

    it('assigns correct stepNumber when adding to existing steps', () => {
      const existing = [
        createMockStep({ stepNumber: 1, action: 'Step one' }),
      ]
      const result = addStep(existing)
      expect(result).toHaveLength(2)
      expect(result[1].stepNumber).toBe(2)
    })

    it('adds step with sequential numbering after multiple adds', () => {
      let steps: TestStep[] = []
      steps = addStep(steps)
      steps = addStep(steps)
      steps = addStep(steps)

      expect(steps).toHaveLength(3)
      expect(steps[0].stepNumber).toBe(1)
      expect(steps[1].stepNumber).toBe(2)
      expect(steps[2].stepNumber).toBe(3)
    })

    it('does not mutate the original array', () => {
      const original: TestStep[] = [
        createMockStep({ stepNumber: 1 }),
      ]
      const result = addStep(original)
      expect(original).toHaveLength(1)
      expect(result).toHaveLength(2)
    })
  })

  describe('removeStep', () => {
    it('removes step at the given index', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'First' }),
        createMockStep({ stepNumber: 2, action: 'Second' }),
        createMockStep({ stepNumber: 3, action: 'Third' }),
      ]
      const result = removeStep(steps, 1)
      expect(result).toHaveLength(2)
      expect(result[0].action).toBe('First')
      expect(result[1].action).toBe('Third')
    })

    it('renumbers remaining steps after removal', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'First' }),
        createMockStep({ stepNumber: 2, action: 'Second' }),
        createMockStep({ stepNumber: 3, action: 'Third' }),
      ]
      const result = removeStep(steps, 0)
      expect(result[0].stepNumber).toBe(1)
      expect(result[0].action).toBe('Second')
      expect(result[1].stepNumber).toBe(2)
      expect(result[1].action).toBe('Third')
    })

    it('handles removing the last step', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'First' }),
        createMockStep({ stepNumber: 2, action: 'Second' }),
      ]
      const result = removeStep(steps, 1)
      expect(result).toHaveLength(1)
      expect(result[0].stepNumber).toBe(1)
      expect(result[0].action).toBe('First')
    })

    it('returns empty array when removing the only step', () => {
      const steps = [createMockStep({ stepNumber: 1 })]
      const result = removeStep(steps, 0)
      expect(result).toHaveLength(0)
    })

    it('does not mutate the original array', () => {
      const original = [
        createMockStep({ stepNumber: 1 }),
        createMockStep({ stepNumber: 2 }),
      ]
      const result = removeStep(original, 0)
      expect(original).toHaveLength(2)
      expect(result).toHaveLength(1)
    })
  })

  describe('moveStep', () => {
    const threeSteps = (): TestStep[] => [
      createMockStep({ stepNumber: 1, action: 'First' }),
      createMockStep({ stepNumber: 2, action: 'Second' }),
      createMockStep({ stepNumber: 3, action: 'Third' }),
    ]

    it('moves a step up by swapping with the previous step', () => {
      const result = moveStep(threeSteps(), 1, 'up')
      expect(result[0].action).toBe('Second')
      expect(result[1].action).toBe('First')
      expect(result[2].action).toBe('Third')
    })

    it('moves a step down by swapping with the next step', () => {
      const result = moveStep(threeSteps(), 0, 'down')
      expect(result[0].action).toBe('Second')
      expect(result[1].action).toBe('First')
      expect(result[2].action).toBe('Third')
    })

    it('renumbers steps after moving up', () => {
      const result = moveStep(threeSteps(), 2, 'up')
      expect(result[0].stepNumber).toBe(1)
      expect(result[1].stepNumber).toBe(2)
      expect(result[2].stepNumber).toBe(3)
    })

    it('renumbers steps after moving down', () => {
      const result = moveStep(threeSteps(), 0, 'down')
      expect(result[0].stepNumber).toBe(1)
      expect(result[1].stepNumber).toBe(2)
      expect(result[2].stepNumber).toBe(3)
    })

    it('does nothing when moving the first step up', () => {
      const steps = threeSteps()
      const result = moveStep(steps, 0, 'up')
      expect(result[0].action).toBe('First')
      expect(result[1].action).toBe('Second')
      expect(result[2].action).toBe('Third')
    })

    it('does nothing when moving the last step down', () => {
      const steps = threeSteps()
      const result = moveStep(steps, 2, 'down')
      expect(result[0].action).toBe('First')
      expect(result[1].action).toBe('Second')
      expect(result[2].action).toBe('Third')
    })

    it('handles moving in a two-step list', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'First' }),
        createMockStep({ stepNumber: 2, action: 'Second' }),
      ]
      const result = moveStep(steps, 0, 'down')
      expect(result[0].action).toBe('Second')
      expect(result[0].stepNumber).toBe(1)
      expect(result[1].action).toBe('First')
      expect(result[1].stepNumber).toBe(2)
    })

    it('does not mutate the original array', () => {
      const original = threeSteps()
      const result = moveStep(original, 1, 'up')
      expect(original[0].action).toBe('First')
      expect(result[0].action).toBe('Second')
    })
  })

  describe('updateStep', () => {
    it('updates the action field of a step', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'Original action' }),
      ]
      const result = updateStep(steps, 0, 'action', 'Updated action')
      expect(result[0].action).toBe('Updated action')
    })

    it('updates the data field of a step', () => {
      const steps = [
        createMockStep({ stepNumber: 1, data: 'original' }),
      ]
      const result = updateStep(steps, 0, 'data', 'new data')
      expect(result[0].data).toBe('new data')
    })

    it('updates the expectedResult field of a step', () => {
      const steps = [
        createMockStep({ stepNumber: 1, expectedResult: 'old result' }),
      ]
      const result = updateStep(steps, 0, 'expectedResult', 'new result')
      expect(result[0].expectedResult).toBe('new result')
    })

    it('only updates the targeted step, leaving others unchanged', () => {
      const steps = [
        createMockStep({ stepNumber: 1, action: 'Step 1' }),
        createMockStep({ stepNumber: 2, action: 'Step 2' }),
        createMockStep({ stepNumber: 3, action: 'Step 3' }),
      ]
      const result = updateStep(steps, 1, 'action', 'Updated Step 2')
      expect(result[0].action).toBe('Step 1')
      expect(result[1].action).toBe('Updated Step 2')
      expect(result[2].action).toBe('Step 3')
    })

    it('does not mutate the original array', () => {
      const original = [createMockStep({ stepNumber: 1, action: 'original' })]
      const result = updateStep(original, 0, 'action', 'updated')
      expect(original[0].action).toBe('original')
      expect(result[0].action).toBe('updated')
    })
  })

  describe('Combined operations', () => {
    it('add, update, then remove maintains correct numbering', () => {
      let steps: TestStep[] = []

      // Add 3 steps
      steps = addStep(steps)
      steps = addStep(steps)
      steps = addStep(steps)

      // Update step 2
      steps = updateStep(steps, 1, 'action', 'Important step')

      // Remove step 1
      steps = removeStep(steps, 0)

      expect(steps).toHaveLength(2)
      expect(steps[0].stepNumber).toBe(1)
      expect(steps[0].action).toBe('Important step')
      expect(steps[1].stepNumber).toBe(2)
    })

    it('move then remove preserves data integrity', () => {
      let steps: TestStep[] = [
        createMockStep({ stepNumber: 1, action: 'A' }),
        createMockStep({ stepNumber: 2, action: 'B' }),
        createMockStep({ stepNumber: 3, action: 'C' }),
      ]

      // Move C up to position 2
      steps = moveStep(steps, 2, 'up')
      expect(steps[1].action).toBe('C')

      // Remove original B (now at position 3)
      steps = removeStep(steps, 2)
      expect(steps).toHaveLength(2)
      expect(steps[0].action).toBe('A')
      expect(steps[1].action).toBe('C')
      expect(steps[0].stepNumber).toBe(1)
      expect(steps[1].stepNumber).toBe(2)
    })
  })
})
