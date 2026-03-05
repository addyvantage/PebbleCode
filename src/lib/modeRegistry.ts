import type { CurriculumUnit } from '../content/pathLoader'
import type { ProblemDefinition } from '../data/problemsBank'
import { getUnitFunctionMode } from './functionMode'
import { toLegacyCodeLanguageId, type SessionLanguageId } from '../../shared/languageRegistry'

export type UnitExecutionMode = 'function' | 'stdio'
export type UnitOutputType = 'text'

export type UnitModeDescriptor = {
  mode: UnitExecutionMode
  outputType: UnitOutputType
  methodName?: string
  signatureLabel?: string
}

export function getProblemModeDescriptor(problem: ProblemDefinition): UnitModeDescriptor {
  if (problem.kind === 'code' || problem.kind === 'sql') {
    return {
      mode: 'stdio',
      outputType: 'text',
    }
  }

  const neverKind: never = problem.kind
  throw new Error(`Unsupported problem mode kind: ${String(neverKind)}`)
}

export function getCurriculumUnitModeDescriptor(
  unit: CurriculumUnit,
  language: SessionLanguageId,
): UnitModeDescriptor {
  if (language === 'sql') {
    return {
      mode: 'stdio',
      outputType: 'text',
    }
  }

  const functionConfig = getUnitFunctionMode(toLegacyCodeLanguageId(language), unit.id)
  if (functionConfig) {
    return {
      mode: 'function',
      outputType: 'text',
      methodName: functionConfig.methodName,
      signatureLabel: functionConfig.signatureLabel,
    }
  }

  return {
    mode: 'stdio',
    outputType: 'text',
  }
}
