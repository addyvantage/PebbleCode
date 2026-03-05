import test, { type TestContext } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFunctionModeRunnable,
  buildSingleCaseFunctionModeRunnable,
  getUnitFunctionMode,
  parseHarnessCasesFromStdout,
  validateFunctionSignature,
} from '../src/lib/functionMode'
import { runCodeLocally } from '../server/runnerLocal'

const helloCase = {
  input: '',
  expectedText: 'Hello, Pebble!',
  args: [],
  expectedValue: 'Hello, Pebble!',
}

const emptyCase = {
  input: '',
  expectedText: '',
  args: [],
  expectedValue: '',
}

test('python signature: accepts class Solution + solve(self) -> str', () => {
  const userCode = `class Solution:\n    def solve(self) -> str:\n        return "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.deepEqual(result, { ok: true })
})

test('python signature: accepts -> string with extra spaces', () => {
  const userCode = `class Solution:\n    def solve ( self ) -> string :\n        return "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.deepEqual(result, { ok: true })
})

test('python signature: accepts tabs + no return type hint', () => {
  const userCode = `class Solution:\n\tdef solve(self):\n\t\treturn "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.deepEqual(result, { ok: true })
})

test('python signature: accepts multiline solve signature', () => {
  const userCode = `class Solution:\n    def solve(\n        self,\n    ) -> str:\n        return "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.deepEqual(result, { ok: true })
})

test('python signature: fails with missing Solution class', () => {
  const userCode = `def solve(self) -> str:\n    return "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.reason, 'missing_class')
  }
})

test('python signature: ignores top-level solve when class method is missing', () => {
  const userCode = `class Solution:\n    def helper(self) -> str:\n        return "x"\n\ndef solve() -> str:\n    return "Hello, Pebble!"\n`
  const result = validateFunctionSignature({
    language: 'python',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> str',
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.reason, 'missing_method')
  }
})

test('python function-mode execution: executes Solution().solve() for -> string', async (t: TestContext) => {
  const userCode = `class Solution:\n    def solve(self) -> string:\n        return "Hello, Pebble!"\n`
  const runnable = buildFunctionModeRunnable({
    language: 'python',
    userCode,
    methodName: 'solve',
    cases: [helloCase],
  })

  assert.ok(runnable)
  const run = await runCodeLocally({
    language: 'python3',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`python3 unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  const parsed = parseHarnessCasesFromStdout(run.stdout)
  assert.ok(parsed)
  assert.equal(parsed![0]?.actual, 'Hello, Pebble!')
  assert.equal(parsed![0]?.passed, true)
})

test('python function-mode execution: treats None return as empty string', async (t: TestContext) => {
  const userCode = `class Solution:\n    def solve(self):\n        return None\n`
  const runnable = buildFunctionModeRunnable({
    language: 'python',
    userCode,
    methodName: 'solve',
    cases: [emptyCase],
  })

  assert.ok(runnable)
  const run = await runCodeLocally({
    language: 'python3',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`python3 unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  const parsed = parseHarnessCasesFromStdout(run.stdout)
  assert.ok(parsed)
  assert.equal(parsed![0]?.actual, '')
  assert.equal(parsed![0]?.passed, true)
})

test('function-mode contract: C template exists for hello-world', () => {
  const config = getUnitFunctionMode('c', 'hello-world')
  assert.ok(config)
  assert.equal(config?.signatureLabel, 'char* solve()')
})

test('javascript signature: accepts CRLF + comments + multiline params', () => {
  const userCode = `class Solution {\r\n  // standard signature\r\n  solve(\r\n  ) {\r\n    return "Hello, Pebble!"\r\n  }\r\n}\r\n`
  const result = validateFunctionSignature({
    language: 'javascript',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() => string',
  })

  assert.deepEqual(result, { ok: true })
})

test('cpp signature: accepts const/noexcept modifiers', () => {
  const userCode = `#include <string>\nclass Solution {\npublic:\n  std::string solve() const noexcept {\n    return "Hello, Pebble!";\n  }\n};\n`
  const result = validateFunctionSignature({
    language: 'cpp',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution::solve() -> string',
  })

  assert.deepEqual(result, { ok: true })
})

test('java signature: accepts throws clause', () => {
  const userCode = `class Solution {\n  public String solve() throws Exception {\n    return "Hello, Pebble!";\n  }\n}\n`
  const result = validateFunctionSignature({
    language: 'java',
    userCode,
    methodName: 'solve',
    signatureLabel: 'Solution.solve() -> String',
  })

  assert.deepEqual(result, { ok: true })
})

test('c signature: accepts const char* solve(void)', () => {
  const userCode = `const char* solve(void) {\n  return "Hello, Pebble!";\n}\n`
  const result = validateFunctionSignature({
    language: 'c',
    userCode,
    methodName: 'solve',
    signatureLabel: 'char* solve()',
  })

  assert.deepEqual(result, { ok: true })
})

test('c signature: accepts char *solve() variant', () => {
  const userCode = `char *solve(){\n  return "Hello, Pebble!";\n}\n`
  const result = validateFunctionSignature({
    language: 'c',
    userCode,
    methodName: 'solve',
    signatureLabel: 'char* solve()',
  })

  assert.deepEqual(result, { ok: true })
})

test('c signature: fails when solve is missing', () => {
  const userCode = `const char* helper(void) {\n  return "Hello, Pebble!";\n}\n`
  const result = validateFunctionSignature({
    language: 'c',
    userCode,
    methodName: 'solve',
    signatureLabel: 'char* solve()',
  })

  assert.equal(result.ok, false)
  if (!result.ok) {
    assert.equal(result.reason, 'missing_method')
  }
})

test('javascript function-mode execution: executes Solution.solve()', async (t: TestContext) => {
  const userCode = `class Solution {\n  solve() {\n    return "Hello, Pebble!"\n  }\n}\n`
  const runnable = buildSingleCaseFunctionModeRunnable({
    language: 'javascript',
    userCode,
    methodName: 'solve',
    args: [],
  })
  assert.ok(runnable)

  const run = await runCodeLocally({
    language: 'javascript',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`node unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  assert.equal(run.stdout.trim(), 'Hello, Pebble!')
})

test('cpp function-mode execution: executes Solution::solve()', async (t: TestContext) => {
  const userCode = `#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  string solve() {\n    return "Hello, Pebble!";\n  }\n};\n`
  const runnable = buildSingleCaseFunctionModeRunnable({
    language: 'cpp',
    userCode,
    methodName: 'solve',
    args: [],
  })
  assert.ok(runnable)

  const run = await runCodeLocally({
    language: 'cpp17',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`g++ unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  assert.equal(run.stdout.trim(), 'Hello, Pebble!')
})

test('c function-mode execution: executes solve() via generated harness main.c', async (t: TestContext) => {
  const userCode = `#include <stdlib.h>\n#include <string.h>\n\nchar* solve() {\n  const char* s = "Hello, Pebble!";\n  char* out = (char*)malloc(strlen(s) + 1);\n  strcpy(out, s);\n  return out;\n}\n`
  const runnable = buildSingleCaseFunctionModeRunnable({
    language: 'c',
    userCode,
    methodName: 'solve',
    args: [],
  })
  assert.ok(runnable)

  const run = await runCodeLocally({
    language: 'c',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`gcc unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  assert.equal(run.stdout.trim(), 'Hello, Pebble!')
})

test('c function-mode execution: supports input signature wrappers for non-hello units', async (t: TestContext) => {
  const config = getUnitFunctionMode('c', 'variables-sum')
  assert.ok(config)
  const userCode = `#include <stdlib.h>\n#include <string.h>\n\nchar* solve(const char* input) {\n  (void)input;\n  const char* s = "7";\n  char* out = (char*)malloc(strlen(s) + 1);\n  strcpy(out, s);\n  return out;\n}\n`
  const runnable = buildSingleCaseFunctionModeRunnable({
    language: 'c',
    userCode,
    methodName: config!.methodName,
    args: [3, 4],
    inputText: '3 4\n',
    signatureLabel: config!.signatureLabel,
  })
  assert.ok(runnable)

  const run = await runCodeLocally({
    language: 'c',
    code: runnable!.code,
    stdin: '',
    timeoutMs: 4000,
  })

  if (run.status === 'toolchain_unavailable') {
    t.skip(`gcc unavailable: ${run.stderr}`)
    return
  }

  assert.equal(run.status, 'ok')
  assert.equal(run.stdout.trim(), '7')
})
