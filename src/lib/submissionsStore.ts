import type { PlacementLanguage } from '../data/onboardingData'
import type { ProblemLanguage } from '../data/problemsBank'
import { safeGetJSON, safeSetJSON } from './safeStorage'

const SUBMISSIONS_KEY = 'pebble.submissions.v1'
const MAX_SUBMISSIONS_PER_UNIT = 10
const MAX_UNITS_WITH_SUBMISSIONS = 60
const MAX_CODE_CHARS = 4_000

export type SubmissionStatus = 'accepted' | 'failed'

export type UnitSubmission = {
  id: string
  unitId: string
  status: SubmissionStatus
  language: PlacementLanguage | ProblemLanguage
  timestamp: number
  runtimeMs: number
  passCount: number
  totalCount: number
  exitCode: number | null
  code: string
}

export type SubmissionsByUnit = Record<string, UnitSubmission[]>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function loadSubmissions(): SubmissionsByUnit {
  const parsed = safeGetJSON<unknown>(SUBMISSIONS_KEY, null)
  if (!isRecord(parsed)) {
    return {}
  }

  const normalized: SubmissionsByUnit = {}
  for (const [unitId, maybeRows] of Object.entries(parsed)) {
    if (!Array.isArray(maybeRows)) {
      continue
    }

    const rows: UnitSubmission[] = []
    for (const row of maybeRows.slice(0, MAX_SUBMISSIONS_PER_UNIT)) {
      if (!isRecord(row)) {
        continue
      }

      if (
        typeof row.id !== 'string' ||
        (row.status !== 'accepted' && row.status !== 'failed') ||
        typeof row.language !== 'string' ||
        typeof row.timestamp !== 'number' ||
        typeof row.runtimeMs !== 'number' ||
        typeof row.passCount !== 'number' ||
        typeof row.totalCount !== 'number' ||
        typeof row.code !== 'string'
      ) {
        continue
      }

      rows.push({
        id: row.id,
        unitId,
        status: row.status,
        language: row.language as PlacementLanguage | ProblemLanguage,
        timestamp: row.timestamp,
        runtimeMs: row.runtimeMs,
        passCount: row.passCount,
        totalCount: row.totalCount,
        exitCode: typeof row.exitCode === 'number' || row.exitCode === null ? row.exitCode : null,
        code: row.code.slice(0, MAX_CODE_CHARS),
      })
    }

    if (rows.length > 0) {
      normalized[unitId] = rows
    }
  }

  return normalized
}

export function saveSubmissions(submissions: SubmissionsByUnit) {
  const rows = Object.entries(submissions)
    .sort((left, right) => {
      const leftTs = left[1]?.[0]?.timestamp ?? 0
      const rightTs = right[1]?.[0]?.timestamp ?? 0
      return rightTs - leftTs
    })
    .slice(0, MAX_UNITS_WITH_SUBMISSIONS)
    .map(([unitId, unitRows]) => [
      unitId,
      unitRows.slice(0, MAX_SUBMISSIONS_PER_UNIT).map((item) => ({
        ...item,
        code: item.code.slice(0, MAX_CODE_CHARS),
      })),
    ])

  const compact = Object.fromEntries(rows) as SubmissionsByUnit
  if (!safeSetJSON(SUBMISSIONS_KEY, compact, { maxBytes: 45 * 1024, silent: true })) {
    const compactAccepted = Object.fromEntries(
      Object.entries(compact).map(([unitId, unitRows]) => [
        unitId,
        unitRows.filter((row) => row.status === 'accepted').slice(0, 3),
      ]),
    ) as SubmissionsByUnit
    safeSetJSON(SUBMISSIONS_KEY, compactAccepted, { maxBytes: 20 * 1024, silent: true })
  }
}

export function appendSubmission(
  current: SubmissionsByUnit,
  submission: Omit<UnitSubmission, 'id' | 'timestamp'> & Partial<Pick<UnitSubmission, 'id' | 'timestamp'>>,
) {
  const nextItem: UnitSubmission = {
    ...submission,
    id: submission.id ?? `${submission.unitId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: submission.timestamp ?? Date.now(),
    code: (submission.code ?? '').slice(0, MAX_CODE_CHARS),
  }

  const existing = current[nextItem.unitId] ?? []
  const nextRows = [nextItem, ...existing].slice(0, MAX_SUBMISSIONS_PER_UNIT)

  return {
    ...current,
    [nextItem.unitId]: nextRows,
  } satisfies SubmissionsByUnit
}
