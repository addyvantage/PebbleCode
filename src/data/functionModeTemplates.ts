import type { PlacementLanguage } from './onboardingData'
import type { CurriculumTestCase } from '../content/pathLoader'

export type FunctionHarnessCase = {
  input: string
  expectedText: string
  args: unknown[]
  expectedValue: unknown
}

export type FunctionModeTemplate = {
  unitId: string
  language: PlacementLanguage
  evalMode: 'function'
  signatureLabel: string
  methodName: string
  starterStub: string
  parseTestCase: (test: CurriculumTestCase) => FunctionHarnessCase | null
}

function tokensToInts(input: string) {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isFinite(value))
}

function parseHelloWorldCase(test: CurriculumTestCase): FunctionHarnessCase {
  return {
    input: test.input,
    expectedText: test.expected.trim(),
    args: [],
    expectedValue: test.expected.trim(),
  }
}

function parseVariablesSumCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const values = tokensToInts(test.input)
  if (values.length < 2) {
    return null
  }

  const expectedValue = Number.parseInt(test.expected.trim(), 10)
  if (!Number.isFinite(expectedValue)) {
    return null
  }

  return {
    input: test.input,
    expectedText: String(expectedValue),
    args: [values[0], values[1]],
    expectedValue,
  }
}

function parseSumToNCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const values = tokensToInts(test.input)
  if (values.length < 1) {
    return null
  }

  const expectedValue = Number.parseInt(test.expected.trim(), 10)
  if (!Number.isFinite(expectedValue)) {
    return null
  }

  return {
    input: test.input,
    expectedText: String(expectedValue),
    args: [values[0]],
    expectedValue,
  }
}

function parseIsEvenCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const values = tokensToInts(test.input)
  if (values.length < 1) {
    return null
  }

  const normalizedExpected = test.expected.trim().toLowerCase()
  if (normalizedExpected !== 'true' && normalizedExpected !== 'false') {
    return null
  }

  return {
    input: test.input,
    expectedText: normalizedExpected,
    args: [values[0]],
    expectedValue: normalizedExpected === 'true',
  }
}

function parseArraysMaxCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const nums = tokensToInts(test.input)
  const expectedValue = Number.parseInt(test.expected.trim(), 10)
  if (!Number.isFinite(expectedValue)) {
    return null
  }

  return {
    input: test.input,
    expectedText: String(expectedValue),
    args: [nums],
    expectedValue,
  }
}

function parseReverseStringCase(test: CurriculumTestCase): FunctionHarnessCase {
  const text = test.input.replace(/\r?\n$/, '')
  return {
    input: test.input,
    expectedText: test.expected.trim(),
    args: [text],
    expectedValue: test.expected.trim(),
  }
}

function parseTwoSumCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const lines = test.input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    return null
  }

  const nums = lines[0]
    .split(/\s+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isFinite(value))

  const target = Number.parseInt(lines[1], 10)
  if (!Number.isFinite(target)) {
    return null
  }

  const expectedValue = test.expected
    .trim()
    .split(/\s+/)
    .map((token) => Number.parseInt(token, 10))
    .filter((value) => Number.isFinite(value))

  return {
    input: test.input,
    expectedText: `[${expectedValue.join(', ')}]`,
    args: [nums, target],
    expectedValue,
  }
}

function parsePalindromeCase(test: CurriculumTestCase): FunctionHarnessCase | null {
  const normalizedExpected = test.expected.trim().toLowerCase()
  if (normalizedExpected !== 'true' && normalizedExpected !== 'false') {
    return null
  }

  const text = test.input.replace(/\r?\n$/, '')
  return {
    input: test.input,
    expectedText: normalizedExpected,
    args: [text],
    expectedValue: normalizedExpected === 'true',
  }
}

const FUNCTION_MODE_TEMPLATES: FunctionModeTemplate[] = [
  {
    unitId: 'hello-world',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.solve() -> str',
    methodName: 'solve',
    starterStub: `class Solution:
    def solve(self) -> str:
        # write your code here
        return ""
`,
    parseTestCase: parseHelloWorldCase,
  },
  {
    unitId: 'variables-sum',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.solve(a: int, b: int) -> int',
    methodName: 'solve',
    starterStub: `class Solution:
    def solve(self, a: int, b: int) -> int:
        # write your code here
        return 0
`,
    parseTestCase: parseVariablesSumCase,
  },
  {
    unitId: 'loops-sum-n',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.sumToN(n: int) -> int',
    methodName: 'sumToN',
    starterStub: `class Solution:
    def sumToN(self, n: int) -> int:
        # write your code here
        return 0
`,
    parseTestCase: parseSumToNCase,
  },
  {
    unitId: 'functions-even',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.isEven(x: int) -> bool',
    methodName: 'isEven',
    starterStub: `class Solution:
    def isEven(self, x: int) -> bool:
        # write your code here
        return False
`,
    parseTestCase: parseIsEvenCase,
  },
  {
    unitId: 'arrays-max',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.maxValue(nums: List[int]) -> int',
    methodName: 'maxValue',
    starterStub: `from typing import List

class Solution:
    def maxValue(self, nums: List[int]) -> int:
        # write your code here
        return 0
`,
    parseTestCase: parseArraysMaxCase,
  },
  {
    unitId: 'strings-reverse',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.reverseText(text: str) -> str',
    methodName: 'reverseText',
    starterStub: `class Solution:
    def reverseText(self, text: str) -> str:
        # write your code here
        return ""
`,
    parseTestCase: parseReverseStringCase,
  },
  {
    unitId: 'dsa-two-sum',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.twoSum(nums: List[int], target: int) -> List[int]',
    methodName: 'twoSum',
    starterStub: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # write your code here
        return []
`,
    parseTestCase: parseTwoSumCase,
  },
  {
    unitId: 'dsa-palindrome',
    language: 'python',
    evalMode: 'function',
    signatureLabel: 'Solution.isPalindrome(text: str) -> bool',
    methodName: 'isPalindrome',
    starterStub: `class Solution:
    def isPalindrome(self, text: str) -> bool:
        # write your code here
        return False
`,
    parseTestCase: parsePalindromeCase,
  },
]

export function getFunctionModeTemplate(language: PlacementLanguage, unitId: string) {
  return FUNCTION_MODE_TEMPLATES.find(
    (config) => config.language === language && config.unitId === unitId,
  ) ?? null
}
