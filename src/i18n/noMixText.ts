import type { LanguageCode } from './languages'

export type PhraseEntry = readonly [source: string, target: string]

type TokenProtection = {
  protectedText: string
  map: string[]
}

const TOKEN_PREFIX = '⟦T'
const TOKEN_SUFFIX = '⟧'

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'join', 'left', 'right', 'inner', 'outer', 'on', 'group', 'order', 'by', 'having',
  'distinct', 'as', 'and', 'or', 'not', 'null', 'case', 'when', 'then', 'else', 'end', 'limit', 'count', 'sum',
  'avg', 'min', 'max', 'into', 'union', 'all', 'over', 'partition', 'dense_rank', 'row_number',
])

const SAFE_LATIN_TOKENS = new Set([
  'sql', 'query', 'stdin', 'stdout', 'testcase', 'testcases', 'input', 'output', 'null', 'true', 'false',
  'person', 'address', 'employee', 'department', 'orders', 'customers', 'personid', 'addressid', 'firstname',
  'lastname', 'city', 'state', 'salary', 'customerid', 'orderid', 'main', 'solve', 'nums', 'target', 'array',
  'string', 'function', 'code', 'runtime', 'cpp', 'java', 'python', 'javascript',
  'integer', 'integers', 'parameter', 'parameters', 'score', 'final', 'row', 'rows', 'table', 'tables',
  'schema', 'format', 'metric', 'complexity', 'edge', 'cases', 'state', 'required', 'process',
  'ascending', 'space', 'anagram', 'lowercase', 'record', 'records', 'report', 'reports', 'write', 'every',
  'identifier', 'identifiers', 'single', 'value', 'values',
  'one', 'index', 'indices', 'target', 'strings', 'line', 'lines', 'matching',
])

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tokenId(index: number) {
  return `${TOKEN_PREFIX}${index}${TOKEN_SUFFIX}`
}

function applyMask(input: string, expression: RegExp, map: string[]) {
  return input.replace(expression, (segment) => {
    const nextIndex = map.length
    map.push(segment)
    return tokenId(nextIndex)
  })
}

function isTokenPlaceholder(word: string) {
  return word.startsWith(TOKEN_PREFIX) && word.endsWith(TOKEN_SUFFIX)
}

function isAllowedLatinWord(word: string): boolean {
  if (word.includes('-')) {
    return word
      .split('-')
      .filter(Boolean)
      .every((part) => isAllowedLatinWord(part))
  }

  const normalized = word.toLowerCase()
  if (SAFE_LATIN_TOKENS.has(normalized) || SQL_KEYWORDS.has(normalized)) {
    return true
  }

  if (/^[A-Z]{2,}$/.test(word)) {
    return true
  }

  if (/^[A-Z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*$/.test(word)) {
    return true
  }

  if (/^[a-z]$/.test(normalized)) {
    return true
  }

  return false
}

function hasNonLatinScript(text: string) {
  return /[^\u0000-\u024f]/.test(text)
}

export function detectLatinWords(text: string) {
  const words = text.match(/\b[A-Za-z][A-Za-z0-9_-]{2,}\b/g) ?? []
  for (const word of words) {
    if (isTokenPlaceholder(word) || isAllowedLatinWord(word)) {
      continue
    }
    return true
  }
  return false
}

export function protectTokens(text: string): TokenProtection {
  const map: string[] = []
  let protectedText = text

  // Preserve code-like regions and identifiers before text replacements.
  const patterns: RegExp[] = [
    /```[\s\S]*?```/g,
    /`[^`\n]+`/g,
    /\bO\([^\)]*\)/g,
    /\b\d+(?:\s*[*/+\-^]\s*\d+)+(?:\s*[A-Za-z]+)?\b/g,
    /\b\d+\s*<=\s*[A-Za-z_][A-Za-z0-9_\[\]]*\s*<=\s*\d+\b/g,
    /\b[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+\b/g,
    /\b[A-Za-z_][A-Za-z0-9_]*\s*\([^\)\n]{0,120}\)/g,
    /\b[A-Z][A-Za-z0-9_]+(?:[A-Z][A-Za-z0-9_]*)+\b/g,
    /\b(?:SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|ORDER|BY|HAVING|DISTINCT|AS|ON|AND|OR|NOT|NULL|CASE|WHEN|THEN|ELSE|END|LIMIT|COUNT|SUM|AVG|MIN|MAX)\b/gi,
    /\b(?:Person|Address|Employee|Department|Orders|Customers|personId|addressId|firstName|lastName|city|state|salary|customerId|orderId|SecondHighestSalary)\b/g,
  ]

  for (const expression of patterns) {
    protectedText = applyMask(protectedText, expression, map)
  }

  return { protectedText, map }
}

export function restoreTokens(protectedText: string, map: string[]) {
  return protectedText.replace(/⟦T(\d+)⟧/g, (_, index) => {
    const position = Number(index)
    return map[position] ?? ''
  })
}

function hasWordBoundary(whole: string, start: number, end: number) {
  const before = whole[start - 1] ?? ''
  const after = whole[end] ?? ''
  return !/[A-Za-z0-9_]/.test(before) && !/[A-Za-z0-9_]/.test(after)
}

export function replaceWithBoundaries(text: string, source: string, target: string) {
  if (!source) {
    return text
  }

  const expression = new RegExp(escapeRegExp(source), 'gi')
  return text.replace(expression, (match, offset: number, whole: string) => {
    const start = offset
    const end = start + match.length
    if (!hasWordBoundary(whole, start, end)) {
      return match
    }
    return target
  })
}

export function applyPhraseDictionary(text: string, dictionary: readonly PhraseEntry[]) {
  let output = text
  for (const [source, target] of dictionary) {
    output = replaceWithBoundaries(output, source, target)
  }
  return output
}

export function shouldKeepEnglishAsFallback(text: string, lang: LanguageCode) {
  if (lang === 'en') {
    return false
  }

  if (!detectLatinWords(text)) {
    return false
  }

  return true
}

export function splitIntoSentences(text: string) {
  if (!text.trim()) {
    return [text]
  }

  const segments: string[] = []
  let buffer = ''

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    buffer += char

    if (char === '\n') {
      segments.push(buffer)
      buffer = ''
      continue
    }

    if (char === '.' || char === '!' || char === '?') {
      const next = text[index + 1] ?? ''
      if (!next || /\s|\n/.test(next)) {
        segments.push(buffer)
        buffer = ''
      }
    }
  }

  if (buffer) {
    segments.push(buffer)
  }

  return segments
}

export function isMixedScriptLeakage(text: string) {
  return hasNonLatinScript(text) && detectLatinWords(text)
}
