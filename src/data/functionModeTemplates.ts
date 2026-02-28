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

type UnitFunctionDefinition = {
  unitId: string
  parseTestCase: (test: CurriculumTestCase) => FunctionHarnessCase | null
  methodNameByLanguage: Record<PlacementLanguage, string>
  signatureByLanguage: Record<PlacementLanguage, string>
  starterStubByLanguage: Record<PlacementLanguage, string>
}

const FUNCTION_LANGUAGES: PlacementLanguage[] = ['python', 'javascript', 'cpp', 'java']

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
    expectedText: test.expected.trim(),
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

const UNIT_FUNCTION_DEFINITIONS: UnitFunctionDefinition[] = [
  {
    unitId: 'hello-world',
    parseTestCase: parseHelloWorldCase,
    methodNameByLanguage: {
      python: 'solve',
      javascript: 'solve',
      cpp: 'solve',
      java: 'solve',
    },
    signatureByLanguage: {
      python: 'Solution.solve() -> str',
      javascript: 'Solution.solve() => string',
      cpp: 'Solution::solve() -> string',
      java: 'Solution.solve() -> String',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def solve(self) -> str:\n        # write your code here\n        return ""\n`,
      javascript: `class Solution {\n  solve() {\n    // write your code here\n    return ''\n  }\n}\n`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  string solve() {\n    // write your code here\n    return \"\";\n  }\n};\n`,
      java: `class Solution {\n  public String solve() {\n    // write your code here\n    return \"\";\n  }\n}\n`,
    },
  },
  {
    unitId: 'variables-sum',
    parseTestCase: parseVariablesSumCase,
    methodNameByLanguage: {
      python: 'solve',
      javascript: 'solve',
      cpp: 'solve',
      java: 'solve',
    },
    signatureByLanguage: {
      python: 'Solution.solve(a: int, b: int) -> int',
      javascript: 'Solution.solve(a, b) => number',
      cpp: 'Solution::solve(int a, int b) -> int',
      java: 'Solution.solve(int a, int b) -> int',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def solve(self, a: int, b: int) -> int:\n        # write your code here\n        return 0\n`,
      javascript: `class Solution {\n  solve(a, b) {\n    // write your code here\n    return 0\n  }\n}\n`,
      cpp: `class Solution {\npublic:\n  int solve(int a, int b) {\n    // write your code here\n    return 0;\n  }\n};\n`,
      java: `class Solution {\n  public int solve(int a, int b) {\n    // write your code here\n    return 0;\n  }\n}\n`,
    },
  },
  {
    unitId: 'loops-sum-n',
    parseTestCase: parseSumToNCase,
    methodNameByLanguage: {
      python: 'sumToN',
      javascript: 'sumToN',
      cpp: 'sumToN',
      java: 'sumToN',
    },
    signatureByLanguage: {
      python: 'Solution.sumToN(n: int) -> int',
      javascript: 'Solution.sumToN(n) => number',
      cpp: 'Solution::sumToN(int n) -> int',
      java: 'Solution.sumToN(int n) -> int',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def sumToN(self, n: int) -> int:\n        # write your code here\n        return 0\n`,
      javascript: `class Solution {\n  sumToN(n) {\n    // write your code here\n    return 0\n  }\n}\n`,
      cpp: `class Solution {\npublic:\n  int sumToN(int n) {\n    // write your code here\n    return 0;\n  }\n};\n`,
      java: `class Solution {\n  public int sumToN(int n) {\n    // write your code here\n    return 0;\n  }\n}\n`,
    },
  },
  {
    unitId: 'functions-even',
    parseTestCase: parseIsEvenCase,
    methodNameByLanguage: {
      python: 'isEven',
      javascript: 'isEven',
      cpp: 'isEven',
      java: 'isEven',
    },
    signatureByLanguage: {
      python: 'Solution.isEven(x: int) -> bool',
      javascript: 'Solution.isEven(x) => boolean',
      cpp: 'Solution::isEven(int x) -> bool',
      java: 'Solution.isEven(int x) -> boolean',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def isEven(self, x: int) -> bool:\n        # write your code here\n        return False\n`,
      javascript: `class Solution {\n  isEven(x) {\n    // write your code here\n    return false\n  }\n}\n`,
      cpp: `class Solution {\npublic:\n  bool isEven(int x) {\n    // write your code here\n    return false;\n  }\n};\n`,
      java: `class Solution {\n  public boolean isEven(int x) {\n    // write your code here\n    return false;\n  }\n}\n`,
    },
  },
  {
    unitId: 'arrays-max',
    parseTestCase: parseArraysMaxCase,
    methodNameByLanguage: {
      python: 'maxValue',
      javascript: 'maxValue',
      cpp: 'maxValue',
      java: 'maxValue',
    },
    signatureByLanguage: {
      python: 'Solution.maxValue(nums: List[int]) -> int',
      javascript: 'Solution.maxValue(nums) => number',
      cpp: 'Solution::maxValue(const vector<int>& nums) -> int',
      java: 'Solution.maxValue(int[] nums) -> int',
    },
    starterStubByLanguage: {
      python: `from typing import List\n\nclass Solution:\n    def maxValue(self, nums: List[int]) -> int:\n        # write your code here\n        return 0\n`,
      javascript: `class Solution {\n  maxValue(nums) {\n    // write your code here\n    return 0\n  }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  int maxValue(const vector<int>& nums) {\n    // write your code here\n    return 0;\n  }\n};\n`,
      java: `class Solution {\n  public int maxValue(int[] nums) {\n    // write your code here\n    return 0;\n  }\n}\n`,
    },
  },
  {
    unitId: 'strings-reverse',
    parseTestCase: parseReverseStringCase,
    methodNameByLanguage: {
      python: 'reverseText',
      javascript: 'reverseText',
      cpp: 'reverseText',
      java: 'reverseText',
    },
    signatureByLanguage: {
      python: 'Solution.reverseText(text: str) -> str',
      javascript: 'Solution.reverseText(text) => string',
      cpp: 'Solution::reverseText(const string& text) -> string',
      java: 'Solution.reverseText(String text) -> String',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def reverseText(self, text: str) -> str:\n        # write your code here\n        return \"\"\n`,
      javascript: `class Solution {\n  reverseText(text) {\n    // write your code here\n    return ''\n  }\n}\n`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  string reverseText(const string& text) {\n    // write your code here\n    return \"\";\n  }\n};\n`,
      java: `class Solution {\n  public String reverseText(String text) {\n    // write your code here\n    return \"\";\n  }\n}\n`,
    },
  },
  {
    unitId: 'dsa-two-sum',
    parseTestCase: parseTwoSumCase,
    methodNameByLanguage: {
      python: 'twoSum',
      javascript: 'twoSum',
      cpp: 'twoSum',
      java: 'twoSum',
    },
    signatureByLanguage: {
      python: 'Solution.twoSum(nums: List[int], target: int) -> List[int]',
      javascript: 'Solution.twoSum(nums, target) => number[]',
      cpp: 'Solution::twoSum(const vector<int>& nums, int target) -> vector<int>',
      java: 'Solution.twoSum(int[] nums, int target) -> int[]',
    },
    starterStubByLanguage: {
      python: `from typing import List\n\nclass Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # write your code here\n        return []\n`,
      javascript: `class Solution {\n  twoSum(nums, target) {\n    // write your code here\n    return []\n  }\n}\n`,
      cpp: `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n  vector<int> twoSum(const vector<int>& nums, int target) {\n    // write your code here\n    return {};\n  }\n};\n`,
      java: `class Solution {\n  public int[] twoSum(int[] nums, int target) {\n    // write your code here\n    return new int[0];\n  }\n}\n`,
    },
  },
  {
    unitId: 'dsa-palindrome',
    parseTestCase: parsePalindromeCase,
    methodNameByLanguage: {
      python: 'isPalindrome',
      javascript: 'isPalindrome',
      cpp: 'isPalindrome',
      java: 'isPalindrome',
    },
    signatureByLanguage: {
      python: 'Solution.isPalindrome(text: str) -> bool',
      javascript: 'Solution.isPalindrome(text) => boolean',
      cpp: 'Solution::isPalindrome(const string& text) -> bool',
      java: 'Solution.isPalindrome(String text) -> boolean',
    },
    starterStubByLanguage: {
      python: `class Solution:\n    def isPalindrome(self, text: str) -> bool:\n        # write your code here\n        return False\n`,
      javascript: `class Solution {\n  isPalindrome(text) {\n    // write your code here\n    return false\n  }\n}\n`,
      cpp: `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  bool isPalindrome(const string& text) {\n    // write your code here\n    return false;\n  }\n};\n`,
      java: `class Solution {\n  public boolean isPalindrome(String text) {\n    // write your code here\n    return false;\n  }\n}\n`,
    },
  },
]

const FUNCTION_MODE_TEMPLATES: FunctionModeTemplate[] = UNIT_FUNCTION_DEFINITIONS.flatMap((definition) =>
  FUNCTION_LANGUAGES.map((language) => ({
    unitId: definition.unitId,
    language,
    evalMode: 'function' as const,
    signatureLabel: definition.signatureByLanguage[language],
    methodName: definition.methodNameByLanguage[language],
    starterStub: definition.starterStubByLanguage[language],
    parseTestCase: definition.parseTestCase,
  })),
)

export function getFunctionModeTemplate(language: PlacementLanguage, unitId: string) {
  return FUNCTION_MODE_TEMPLATES.find(
    (config) => config.language === language && config.unitId === unitId,
  ) ?? null
}
