import type { ProblemDefinition, ProblemExample } from '../data/problemsBank'
import type { LanguageCode } from './languages'

type LocalizedProblemText = {
  title?: string
  topics?: string[]
  keySkills?: string[]
  statement?: {
    summary?: string
    description?: string
    input?: string
    output?: string
    constraints?: string[]
    examples?: Array<Partial<ProblemExample>>
  }
}

const LOCALIZED_PROBLEM_COPY: Partial<Record<LanguageCode, Record<string, LocalizedProblemText>>> = {
  hi: {
    'p-two-sum': {
      title: 'टू सम',
      topics: ['ऐरे', 'हैश टेबल'],
      keySkills: ['इंडेक्स मैप', 'सिंगल पास'],
      statement: {
        summary: 'ऐसे दो इंडेक्स ढूँढें जिनके मानों का योग target हो।',
        description: 'nums और target दिए हैं। ऐसे दो इंडेक्स लौटाएँ जिनके मानों का योग target के बराबर हो।',
      },
    },
    'p-valid-anagram': {
      title: 'वैध एनाग्राम',
      topics: ['स्ट्रिंग', 'हैश टेबल', 'सॉर्टिंग'],
      keySkills: ['फ्रीक्वेंसी मैप'],
      statement: {
        summary: 'जाँचें कि दो स्ट्रिंग्स एनाग्राम हैं या नहीं।',
      },
    },
    'sql-combine-two-tables': {
      title: 'दो टेबल्स को जोड़ें',
      topics: ['SQL', 'जॉइन'],
      keySkills: ['लेफ्ट जॉइन', 'कॉलम चयन'],
      statement: {
        summary: 'हर व्यक्ति के लिए firstName, lastName, city और state रिपोर्ट करें।',
      },
    },
  },
  ur: {
    'p-two-sum': {
      title: 'ٹو سم',
      topics: ['ارے', 'ہیش ٹیبل'],
      keySkills: ['انڈیکس میپ', 'سنگل پاس'],
      statement: {
        summary: 'ایسے دو انڈیکس تلاش کریں جن کی قدروں کا مجموعہ target ہو۔',
      },
    },
    'p-valid-anagram': {
      title: 'ویلڈ ایناگرام',
      topics: ['سٹرنگ', 'ہیش ٹیبل', 'سورٹنگ'],
      keySkills: ['فریکوئنسی میپ'],
      statement: {
        summary: 'یہ طے کریں کہ دو سٹرنگز ایناگرام ہیں یا نہیں۔',
      },
    },
    'sql-combine-two-tables': {
      title: 'دو ٹیبلز کو ملا کر رپورٹ',
      topics: ['SQL', 'جوائن'],
      keySkills: ['لیفٹ جوائن', 'کالم سلیکشن'],
      statement: {
        summary: 'ہر شخص کے لیے firstName, lastName, city اور state دکھائیں۔',
      },
    },
  },
}

function localizeExamples(
  fallbackExamples: ProblemExample[],
  localizedExamples?: Array<Partial<ProblemExample>>,
): ProblemExample[] {
  if (!localizedExamples || localizedExamples.length === 0) {
    return fallbackExamples
  }

  return fallbackExamples.map((example, index) => {
    const localized = localizedExamples[index]
    if (!localized) {
      return example
    }
    return {
      input: localized.input ?? example.input,
      output: localized.output ?? example.output,
      explanation: localized.explanation ?? example.explanation,
    }
  })
}

export function getLocalizedProblem(problem: ProblemDefinition, lang: LanguageCode): ProblemDefinition {
  const localized = LOCALIZED_PROBLEM_COPY[lang]?.[problem.id]
  if (!localized) {
    return problem
  }

  const localizedStatement = localized.statement
  return {
    ...problem,
    title: localized.title ?? problem.title,
    topics: localized.topics ?? problem.topics,
    keySkills: localized.keySkills ?? problem.keySkills,
    statement: {
      ...problem.statement,
      summary: localizedStatement?.summary ?? problem.statement.summary,
      description: localizedStatement?.description ?? problem.statement.description,
      input: localizedStatement?.input ?? problem.statement.input,
      output: localizedStatement?.output ?? problem.statement.output,
      constraints: localizedStatement?.constraints ?? problem.statement.constraints,
      examples: localizeExamples(problem.statement.examples, localizedStatement?.examples),
    },
  }
}
