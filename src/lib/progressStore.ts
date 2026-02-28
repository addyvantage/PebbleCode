const UNIT_PROGRESS_KEY = 'pebble.unitProgress.v1'

export type UnitProgressEntry = {
  completed: boolean
  lastPassedAt: number
  bestRuntimeMs?: number
}

export type UnitProgressMap = Record<string, UnitProgressEntry>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function loadUnitProgress(): UnitProgressMap {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(UNIT_PROGRESS_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as unknown
    if (!isRecord(parsed)) {
      return {}
    }

    const normalized: UnitProgressMap = {}
    for (const [unitId, item] of Object.entries(parsed)) {
      if (!isRecord(item) || item.completed !== true || typeof item.lastPassedAt !== 'number') {
        continue
      }

      normalized[unitId] = {
        completed: true,
        lastPassedAt: item.lastPassedAt,
        bestRuntimeMs:
          typeof item.bestRuntimeMs === 'number' && Number.isFinite(item.bestRuntimeMs)
            ? item.bestRuntimeMs
            : undefined,
      }
    }

    return normalized
  } catch {
    return {}
  }
}

export function saveUnitProgress(progress: UnitProgressMap) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(UNIT_PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Ignore quota and serialization issues in local demo mode.
  }
}

export function markUnitCompleted(
  current: UnitProgressMap,
  unitId: string,
  runtimeMs?: number,
) {
  const previous = current[unitId]
  const nextBestRuntime =
    typeof runtimeMs === 'number' && runtimeMs >= 0
      ? typeof previous?.bestRuntimeMs === 'number'
        ? Math.min(previous.bestRuntimeMs, runtimeMs)
        : runtimeMs
      : previous?.bestRuntimeMs

  return {
    ...current,
    [unitId]: {
      completed: true,
      lastPassedAt: Date.now(),
      bestRuntimeMs: nextBestRuntime,
    },
  } satisfies UnitProgressMap
}

