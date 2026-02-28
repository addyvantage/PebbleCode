import { PROBLEMS_BANK } from '../data/problemsBank'
import { isMixedScriptLeakage } from './noMixText'
import type { LanguageCode } from './languages'
import { getLocalizedProblem } from './problemContent'

declare const process: { exitCode?: number }

const TARGET_LANGS: LanguageCode[] = ['hi', 'bn', 'te', 'mr', 'ta', 'ur', 'gu', 'kn', 'ml', 'or', 'pa', 'as']

type LeakageRow = {
  lang: LanguageCode
  problemId: string
  field: string
  sample: string
}

function trimSample(value: string) {
  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > 140 ? `${normalized.slice(0, 140)}...` : normalized
}

function collectLeakages() {
  const out: LeakageRow[] = []

  for (const lang of TARGET_LANGS) {
    for (const problem of PROBLEMS_BANK) {
      const localized = getLocalizedProblem(problem, lang)

      const fields: Array<[string, string | undefined]> = [
        ['title', localized.title],
        ['statement.summary', localized.statement.summary],
        ['statement.description', localized.statement.description],
        ['statement.input', localized.statement.input],
        ['statement.output', localized.statement.output],
        ['statement.schemaText', localized.statement.schemaText],
      ]

      for (const [fieldName, value] of fields) {
        if (!value || !isMixedScriptLeakage(value)) {
          continue
        }
        out.push({
          lang,
          problemId: localized.id,
          field: fieldName,
          sample: trimSample(value),
        })
      }

      localized.statement.constraints.forEach((constraint, index) => {
        if (!isMixedScriptLeakage(constraint)) {
          return
        }
        out.push({
          lang,
          problemId: localized.id,
          field: `statement.constraints[${index}]`,
          sample: trimSample(constraint),
        })
      })

      localized.statement.examples.forEach((example, index) => {
        if (example.explanation && isMixedScriptLeakage(example.explanation)) {
          out.push({
            lang,
            problemId: localized.id,
            field: `statement.examples[${index}].explanation`,
            sample: trimSample(example.explanation),
          })
        }
      })
    }
  }

  return out
}

function main() {
  const leakages = collectLeakages()

  if (leakages.length === 0) {
    console.log('[no-mix] PASS: no mixed-script leakage detected in localized problem prose.')
    return
  }

  console.log(`[no-mix] FAIL: ${leakages.length} leakage(s) detected.`)

  for (const row of leakages.slice(0, 200)) {
    console.log(`${row.lang} | ${row.problemId} | ${row.field} | ${row.sample}`)
  }

  if (leakages.length > 200) {
    console.log(`... truncated ${leakages.length - 200} additional leakage rows`)
  }

  process.exitCode = 1
}

main()
