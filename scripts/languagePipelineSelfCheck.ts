import { promises as fs } from 'node:fs'
import path from 'node:path'
import { runCodeLocally } from '../server/runnerLocal.ts'
import { PROBLEMS_BANK, getProblemById, getProblemStarterCode } from '../src/data/problemsBank.ts'
import {
  buildFunctionModeRunnable,
  buildSingleCaseFunctionModeRunnable,
  getUnitFunctionMode,
  parseHarnessCasesFromStdout,
} from '../src/lib/functionMode.ts'
import {
  LANGUAGE_IDS,
  fromLegacyCodeLanguageId,
  toLegacyCodeLanguageId,
  type LanguageId,
  type LegacyCodeLanguageId,
} from '../shared/languageRegistry.ts'

type Failure = {
  scope: string
  detail: string
}

const failures: Failure[] = []
const skipped: string[] = []

function fail(scope: string, detail: string) {
  failures.push({ scope, detail })
  console.error(`[fail] ${scope}: ${detail}`)
}

function pass(scope: string, detail: string) {
  console.log(`[pass] ${scope}: ${detail}`)
}

function skip(scope: string, detail: string) {
  skipped.push(scope)
  console.log(`[skip] ${scope}: ${detail}`)
}

function isRunnerCrash(status: string) {
  return status === 'internal_error' || status === 'validation_error'
}

async function checkProblemTemplates() {
  const codeProblems = PROBLEMS_BANK.filter((problem) => problem.kind === 'code')
  for (const problem of codeProblems) {
    for (const languageId of LANGUAGE_IDS) {
      const legacyLanguage = toLegacyCodeLanguageId(languageId)
      if (!problem.languageSupport.includes(legacyLanguage)) {
        fail(
          `stdio-template-${problem.id}-${languageId}`,
          'Language is missing from problem.languageSupport registry.',
        )
        continue
      }

      const template = getProblemStarterCode(problem, legacyLanguage).trim()
      if (!template) {
        fail(`stdio-template-${problem.id}-${languageId}`, 'Starter template is empty.')
        continue
      }

      const result = await runCodeLocally({
        language: languageId,
        code: template,
        stdin: problem.tests[0]?.input ?? '',
        timeoutMs: 2500,
      })

      if (result.status === 'toolchain_unavailable') {
        skip(`stdio-template-${problem.id}-${languageId}`, result.stderr)
        continue
      }

      if (isRunnerCrash(result.status)) {
        fail(`stdio-template-${problem.id}-${languageId}`, `${result.status}: ${result.stderr}`)
        continue
      }

      if (result.status === 'compile_error') {
        fail(`stdio-template-${problem.id}-${languageId}`, `Template does not compile: ${result.stderr}`)
        continue
      }
    }
  }

  pass('stdio-template-scan', `Checked ${codeProblems.length} code problems across ${LANGUAGE_IDS.length} languages.`)
}

async function checkFunctionTemplates() {
  const curriculumJsonPath = path.resolve(process.cwd(), 'src/content/paths/python.json')
  const payloadRaw = await fs.readFile(curriculumJsonPath, 'utf8')
  const payload = JSON.parse(payloadRaw) as { units?: Array<{ id?: string; tests?: Array<{ input?: string; expected?: string }> }> }
  const units = Array.isArray(payload.units)
    ? payload.units
        .map((unit) => {
          const id = typeof unit.id === 'string' ? unit.id : null
          const tests = Array.isArray(unit.tests)
            ? unit.tests
                .filter((test): test is { input: string; expected: string } =>
                  typeof test?.input === 'string' && typeof test?.expected === 'string')
            : []
          return id ? { id, tests } : null
        })
        .filter((unit): unit is { id: string; tests: Array<{ input: string; expected: string }> } => unit !== null)
    : []

  for (const unit of units) {
    for (const languageId of LANGUAGE_IDS) {
      const legacyLanguage = toLegacyCodeLanguageId(languageId)
      const fnConfig = getUnitFunctionMode(legacyLanguage, unit.id)
      if (!fnConfig) {
        fail(`function-template-${unit.id}-${languageId}`, 'Missing function-mode template in registry.')
        continue
      }

      const sampleCase = unit.tests
        .map((test) => fnConfig.parseTestCase(test))
        .find((testCase): testCase is NonNullable<typeof testCase> => testCase !== null)
      if (!sampleCase) {
        fail(`function-template-${unit.id}-${languageId}`, 'Unable to parse sample testcase for harness.')
        continue
      }

      const runnable = legacyLanguage === 'python'
        ? buildFunctionModeRunnable({
          language: legacyLanguage,
          userCode: fnConfig.starterStub,
          methodName: fnConfig.methodName,
          cases: [sampleCase],
        })
        : buildSingleCaseFunctionModeRunnable({
          language: legacyLanguage,
          userCode: fnConfig.starterStub,
          methodName: fnConfig.methodName,
          args: sampleCase.args,
          inputText: sampleCase.input,
          signatureLabel: fnConfig.signatureLabel,
        })

      if (!runnable) {
        fail(`function-template-${unit.id}-${languageId}`, 'Failed to build runnable harness from template.')
        continue
      }

      const result = await runCodeLocally({
        language: languageId,
        code: runnable.code,
        stdin: '',
        timeoutMs: 2500,
      })

      if (result.status === 'toolchain_unavailable') {
        skip(`function-template-${unit.id}-${languageId}`, result.stderr)
        continue
      }

      if (isRunnerCrash(result.status)) {
        fail(`function-template-${unit.id}-${languageId}`, `${result.status}: ${result.stderr}`)
        continue
      }

      if (result.status === 'compile_error') {
        fail(`function-template-${unit.id}-${languageId}`, `Template does not compile: ${result.stderr}`)
        continue
      }
    }
  }

  pass('function-template-scan', `Checked ${units.length} function units across ${LANGUAGE_IDS.length} languages.`)
}

const HELLO_CORRECT: Record<LegacyCodeLanguageId, string> = {
  python: 'class Solution:\n    def solve(self) -> str:\n        return "Hello, Pebble!"\n',
  javascript: 'class Solution {\n  solve() {\n    return "Hello, Pebble!"\n  }\n}\n',
  cpp: '#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  string solve() {\n    return "Hello, Pebble!";\n  }\n};\n',
  java: 'class Solution {\n  public String solve() {\n    return "Hello, Pebble!";\n  }\n}\n',
  c: '#include <stdlib.h>\n#include <string.h>\n\nchar* solve() {\n  const char* s = "Hello, Pebble!";\n  char* out = (char*)malloc(strlen(s) + 1);\n  strcpy(out, s);\n  return out;\n}\n',
}

const HELLO_WRONG: Record<LegacyCodeLanguageId, string> = {
  python: 'class Solution:\n    def solve(self) -> str:\n        return "Nope"\n',
  javascript: 'class Solution {\n  solve() {\n    return "Nope"\n  }\n}\n',
  cpp: '#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n  string solve() {\n    return "Nope";\n  }\n};\n',
  java: 'class Solution {\n  public String solve() {\n    return "Nope";\n  }\n}\n',
  c: '#include <stdlib.h>\n#include <string.h>\n\nchar* solve() {\n  const char* s = "Nope";\n  char* out = (char*)malloc(strlen(s) + 1);\n  strcpy(out, s);\n  return out;\n}\n',
}

const TWO_SUM_CORRECT: Record<LanguageId, string> = {
  python3: `import sys\n\ndef solve():\n    data = sys.stdin.read().strip().split()\n    if not data:\n      return\n    n = int(data[0])\n    nums = list(map(int, data[1:1+n]))\n    target = int(data[1+n])\n    seen = {}\n    for i, x in enumerate(nums):\n      need = target - x\n      if need in seen:\n        print(seen[need], i)\n        return\n      seen[x] = i\n    print(-1, -1)\n\nif __name__ == "__main__":\n    solve()\n`,
  javascript: `const fs = require('fs');\nconst parts = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\nconst n = parts[0] ?? 0;\nconst nums = parts.slice(1, 1 + n);\nconst target = parts[1 + n] ?? 0;\nconst seen = new Map();\nfor (let i = 0; i < nums.length; i += 1) {\n  const need = target - nums[i];\n  if (seen.has(need)) {\n    process.stdout.write(String(seen.get(need)) + ' ' + String(i));\n    process.exit(0);\n  }\n  seen.set(nums[i], i);\n}\nprocess.stdout.write('-1 -1');\n`,
  cpp17: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\nint main(){int n; if(!(cin>>n)) return 0; vector<int> a(n); for(int i=0;i<n;i++) cin>>a[i]; int t; cin>>t; unordered_map<int,int> m; for(int i=0;i<n;i++){int need=t-a[i]; if(m.count(need)){cout<<m[need]<<" "<<i; return 0;} m[a[i]]=i;} cout<<"-1 -1"; return 0;}\n`,
  java17: `import java.io.*;import java.util.*;public class Main{public static void main(String[]args)throws Exception{BufferedReader br=new BufferedReader(new InputStreamReader(System.in));List<Integer> v=new ArrayList<>();String l;while((l=br.readLine())!=null){l=l.trim();if(l.isEmpty())continue;for(String s:l.split("\\\\s+"))v.add(Integer.parseInt(s));}if(v.isEmpty())return;int i=0,n=v.get(i++);int[] a=new int[n];for(int k=0;k<n;k++)a[k]=v.get(i++);int t=v.get(i);Map<Integer,Integer> m=new HashMap<>();for(int k=0;k<n;k++){int need=t-a[k];if(m.containsKey(need)){System.out.print(m.get(need)+\" \"+k);return;}m.put(a[k],k);}System.out.print(\"-1 -1\");}}\n`,
  c: `#include <stdio.h>\nint main(void){int n; if(scanf(\"%d\",&n)!=1) return 0; int a[10000]; for(int i=0;i<n;i++) if(scanf(\"%d\",&a[i])!=1) return 0; int t; if(scanf(\"%d\",&t)!=1) return 0; for(int i=0;i<n;i++) for(int j=i+1;j<n;j++) if(a[i]+a[j]==t){printf(\"%d %d\",i,j); return 0;} printf(\"-1 -1\"); return 0;}\n`,
}

const TWO_SUM_WRONG: Record<LanguageId, string> = {
  python3: 'print("-1 -1")\n',
  javascript: 'process.stdout.write("-1 -1")\n',
  cpp17: '#include <iostream>\nint main(){std::cout<<"-1 -1";return 0;}\n',
  java17: 'class Main{public static void main(String[]args){System.out.print("-1 -1");}}\n',
  c: '#include <stdio.h>\nint main(void){printf("-1 -1"); return 0;}\n',
}

async function runSubsetE2E() {
  const helloConfigByLegacy = Object.fromEntries(
    (['python', 'javascript', 'cpp', 'java', 'c'] as const).map((legacyLanguage) => [
      legacyLanguage,
      getUnitFunctionMode(legacyLanguage, 'hello-world'),
    ]),
  ) as Record<LegacyCodeLanguageId, ReturnType<typeof getUnitFunctionMode>>

  for (const legacyLanguage of ['python', 'javascript', 'cpp', 'java', 'c'] as const) {
    const config = helloConfigByLegacy[legacyLanguage]
    if (!config) {
      fail(`subset-function-${legacyLanguage}`, 'Missing hello-world config.')
      continue
    }

    const canonicalLanguage = fromLegacyCodeLanguageId(legacyLanguage)
    const expected = 'Hello, Pebble!'

    for (const variant of ['correct', 'wrong'] as const) {
      const runnable = legacyLanguage === 'python'
        ? buildFunctionModeRunnable({
          language: legacyLanguage,
          userCode: variant === 'correct' ? HELLO_CORRECT[legacyLanguage] : HELLO_WRONG[legacyLanguage],
          methodName: config.methodName,
          cases: [{ input: '', expectedText: expected, args: [], expectedValue: expected }],
        })
        : buildSingleCaseFunctionModeRunnable({
          language: legacyLanguage,
          userCode: variant === 'correct' ? HELLO_CORRECT[legacyLanguage] : HELLO_WRONG[legacyLanguage],
          methodName: config.methodName,
          args: [],
          inputText: '',
          signatureLabel: config.signatureLabel,
        })

      if (!runnable) {
        fail(`subset-function-${legacyLanguage}-${variant}`, 'Failed to build runnable.')
        continue
      }

      const run = await runCodeLocally({
        language: canonicalLanguage,
        code: runnable.code,
        stdin: '',
        timeoutMs: 4000,
      })
      if (run.status === 'toolchain_unavailable') {
        skip(`subset-function-${legacyLanguage}-${variant}`, run.stderr)
        continue
      }

      const actual = legacyLanguage === 'python'
        ? (parseHarnessCasesFromStdout(run.stdout)?.[0]?.actual ?? '')
        : run.stdout.trim()
      const matched = run.ok && actual === expected
      if (variant === 'correct' && matched) {
        pass(`subset-function-${legacyLanguage}-${variant}`, actual)
      } else if (variant === 'wrong' && !matched) {
        pass(`subset-function-${legacyLanguage}-${variant}`, 'Wrong solution failed as expected.')
      } else {
        fail(`subset-function-${legacyLanguage}-${variant}`, `Unexpected verdict: status=${run.status} stdout=${run.stdout}`)
      }
    }
  }

  const twoSum = getProblemById('p-two-sum')
  if (!twoSum) {
    fail('subset-stdio', 'Missing p-two-sum problem.')
    return
  }
  const stdin = twoSum.tests[0]?.input ?? ''
  const expected = twoSum.tests[0]?.expected.trim() ?? ''

  for (const languageId of LANGUAGE_IDS) {
    for (const variant of ['correct', 'wrong'] as const) {
      const run = await runCodeLocally({
        language: languageId,
        code: variant === 'correct' ? TWO_SUM_CORRECT[languageId] : TWO_SUM_WRONG[languageId],
        stdin,
        timeoutMs: 4000,
      })
      if (run.status === 'toolchain_unavailable') {
        skip(`subset-stdio-${languageId}-${variant}`, run.stderr)
        continue
      }
      const matched = run.ok && run.stdout.trim() === expected
      if (variant === 'correct' && matched) {
        pass(`subset-stdio-${languageId}-${variant}`, run.stdout.trim())
      } else if (variant === 'wrong' && !matched) {
        pass(`subset-stdio-${languageId}-${variant}`, 'Wrong solution failed as expected.')
      } else {
        fail(`subset-stdio-${languageId}-${variant}`, `Unexpected verdict: status=${run.status} stdout=${run.stdout}`)
      }
    }
  }
}

async function main() {
  await checkProblemTemplates()
  await checkFunctionTemplates()
  await runSubsetE2E()

  console.log(`\nSelf-check summary: ${failures.length} failures, ${skipped.length} skipped.`)
  if (failures.length > 0) {
    for (const entry of failures) {
      console.error(`- ${entry.scope}: ${entry.detail}`)
    }
    process.exitCode = 1
    return
  }
  console.log('Language pipeline self-check passed.')
}

void main()
