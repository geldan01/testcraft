import type { ActivityActionType, Prisma } from '@prisma/client'
import { prisma } from './db'

export async function logActivity(
  userId: string,
  actionType: ActivityActionType,
  objectType: string,
  objectId: string,
  changes?: Record<string, unknown>,
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        actionType,
        objectType,
        objectId,
        changes: changes as Prisma.InputJsonValue | undefined,
      },
    })
  } catch (error) {
    // Activity logging should never break the main operation
    console.error('Failed to log activity:', error)
  }
}
