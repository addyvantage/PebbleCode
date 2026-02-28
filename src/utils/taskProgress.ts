import { storageKeys } from './storageKeys'
import { safeGetItem, safeRemoveItem, safeSetJSON } from '../lib/safeStorage'

export type TaskProgress = {
  completedTaskIds: string[]
  completedAtByTaskId: Record<string, number>
}

const defaultTaskProgress: TaskProgress = {
  completedTaskIds: [],
  completedAtByTaskId: {},
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function normalizeTaskProgress(value: unknown): TaskProgress | null {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const candidate = value as Partial<TaskProgress>
  if (!Array.isArray(candidate.completedTaskIds)) {
    return null
  }

  if (
    typeof candidate.completedAtByTaskId !== 'object' ||
    candidate.completedAtByTaskId === null ||
    Array.isArray(candidate.completedAtByTaskId)
  ) {
    return null
  }

  if (!candidate.completedTaskIds.every((taskId) => typeof taskId === 'string')) {
    return null
  }

  const normalizedCompletedAt: Record<string, number> = {}
  for (const [taskId, completedAt] of Object.entries(candidate.completedAtByTaskId)) {
    if (!isFiniteTimestamp(completedAt)) {
      return null
    }
    normalizedCompletedAt[taskId] = completedAt
  }

  const dedupedTaskIds = Array.from(new Set(candidate.completedTaskIds))
  return {
    completedTaskIds: dedupedTaskIds,
    completedAtByTaskId: normalizedCompletedAt,
  }
}

function persistTaskProgress(progress: TaskProgress) {
  if (typeof window === 'undefined') {
    return
  }

  safeSetJSON(storageKeys.taskProgress, progress, { maxBytes: 16 * 1024, silent: true })
}

export function getTaskProgress(): TaskProgress {
  if (typeof window === 'undefined') {
    return {
      completedTaskIds: [],
      completedAtByTaskId: {},
    }
  }

  const raw = safeGetItem(storageKeys.taskProgress)
  if (!raw) {
    return {
      completedTaskIds: [],
      completedAtByTaskId: {},
    }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeTaskProgress(parsed)
    if (!normalized) {
      persistTaskProgress(defaultTaskProgress)
      return {
        completedTaskIds: [],
        completedAtByTaskId: {},
      }
    }

    const normalizedRaw = JSON.stringify(normalized)
    if (normalizedRaw !== raw) {
      safeSetJSON(storageKeys.taskProgress, normalized, { maxBytes: 16 * 1024, silent: true })
    }

    return normalized
  } catch {
    persistTaskProgress(defaultTaskProgress)
    return {
      completedTaskIds: [],
      completedAtByTaskId: {},
    }
  }
}

export function markTaskCompleted(taskId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedTaskId = taskId.trim()
  if (!normalizedTaskId) {
    return
  }

  const current = getTaskProgress()
  if (current.completedTaskIds.includes(normalizedTaskId)) {
    return
  }

  const next: TaskProgress = {
    completedTaskIds: [...current.completedTaskIds, normalizedTaskId],
    completedAtByTaskId: {
      ...current.completedAtByTaskId,
      [normalizedTaskId]: current.completedAtByTaskId[normalizedTaskId] ?? Date.now(),
    },
  }

  persistTaskProgress(next)
}

export function isTaskCompleted(taskId: string): boolean {
  const normalizedTaskId = taskId.trim()
  if (!normalizedTaskId) {
    return false
  }

  return getTaskProgress().completedTaskIds.includes(normalizedTaskId)
}

export function clearTaskProgress(): void {
  if (typeof window === 'undefined') {
    return
  }

  safeRemoveItem(storageKeys.taskProgress)
}
