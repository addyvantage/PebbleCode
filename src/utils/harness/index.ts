import type { PlacementLanguage } from '../../data/onboardingData'
import type { FunctionHarnessCase } from '../../data/functionModeTemplates'
import { buildPythonHarness } from './pythonHarness'

type BuildRunnableInput = {
  language: PlacementLanguage
  userCode: string
  methodName: string
  cases: FunctionHarnessCase[]
}

export type ParsedHarnessCase = {
  input: string
  expected: string
  actual: string
  stderr: string
  passed: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function buildRunnableCode(input: BuildRunnableInput) {
  if (input.language === 'python') {
    return buildPythonHarness({
      userCode: input.userCode,
      methodName: input.methodName,
      cases: input.cases,
    })
  }

  return null
}

export function parseHarnessCasesFromStdout(stdout: string): ParsedHarnessCase[] | null {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const candidate = lines[index]
    if (!candidate.startsWith('{')) {
      continue
    }

    try {
      const parsed = JSON.parse(candidate) as unknown
      if (!isRecord(parsed) || !Array.isArray(parsed.cases)) {
        continue
      }

      const cases: ParsedHarnessCase[] = []
      for (const item of parsed.cases) {
        if (!isRecord(item)) {
          return null
        }

        cases.push({
          input: typeof item.input === 'string' ? item.input : '',
          expected: typeof item.expected === 'string' ? item.expected : '',
          actual: typeof item.actual === 'string' ? item.actual : String(item.actual ?? ''),
          stderr: typeof item.stderr === 'string' ? item.stderr : '',
          passed: item.passed === true,
        })
      }

      return cases
    } catch {
      continue
    }
  }

  return null
}
