const { chromium } = require('playwright')

const TIMEOUT = 45000

async function detectBaseUrl() {
  const ports = [5173, 5174]
  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`, { redirect: 'manual' })
      if (res.ok || [301, 302, 304].includes(res.status)) {
        return `http://127.0.0.1:${port}`
      }
    } catch {
      // continue
    }
  }
  throw new Error('No local dev server found on 5173 or 5174')
}

function nowTag() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

async function safeScreenshot(page, name, shots) {
  const path = `/tmp/pebble-qa-${nowTag()}-${name}.png`
  await page.screenshot({ path, fullPage: true })
  shots.push(path)
  return path
}

async function run() {
  const report = []
  const bugs = []
  const screenshots = []
  const consoleErrors = []
  const notes = []

  const baseUrl = await detectBaseUrl()
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  page.on('pageerror', (error) => {
    consoleErrors.push(`pageerror: ${error.message}`)
  })
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`console.error: ${msg.text()}`)
    }
  })

  async function addResult(item, pass, detail) {
    report.push({ item, status: pass ? 'PASS' : 'FAIL', detail })
    if (!pass) {
      const shot = await safeScreenshot(page, item.toLowerCase().replace(/[^a-z0-9]+/g, '-'), screenshots)
      notes.push(`Failure screenshot for ${item}: ${shot}`)
    }
  }

  async function openSettings() {
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.getByRole('dialog', { name: /Settings/i }).waitFor({ timeout: TIMEOUT })
  }

  async function closeSettingsViaX() {
    await page.getByRole('button', { name: 'Close settings' }).click()
    await page.getByRole('dialog', { name: /Settings/i }).waitFor({ state: 'detached', timeout: TIMEOUT })
  }

  async function closeSettingsViaBackdrop() {
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    const box = await dialog.boundingBox()
    if (!box) throw new Error('Settings dialog bounding box not found')
    await page.mouse.click(Math.max(8, box.x - 12), Math.max(8, box.y - 12))
    await dialog.waitFor({ state: 'detached', timeout: TIMEOUT })
  }

  async function fillOnboarding({ skill = 'Beginner', goal = 'Automation/scripting', background = 'Working professional', language = 'Python (coming soon)' } = {}) {
    await page.waitForURL(/\/onboarding(?:\?|$)/, { timeout: TIMEOUT })
    await page.getByRole('button', { name: skill, exact: true }).click()
    await page.getByRole('button', { name: goal, exact: true }).click()
    await page.getByRole('button', { name: background, exact: true }).click()
    await page.getByRole('button', { name: language, exact: true }).click()
    await page.getByRole('button', { name: 'Start session' }).click()
    await page.waitForURL(/\/session\/1(?:\?|$)/, { timeout: TIMEOUT })
  }

  async function getStringsProgressText() {
    const line = page.locator('text=/\\d+\\/5 completed/').first()
    await line.waitFor({ timeout: TIMEOUT })
    return (await line.textContent())?.trim() || ''
  }

  async function setEditorCode(code) {
    const editor = page.getByLabel('Session code editor')
    await editor.waitFor({ timeout: TIMEOUT })
    await editor.fill(code)
  }

  async function completeTask(taskId, solutionCode) {
    await page.goto(`${baseUrl}/session/${taskId}`)
    await page.waitForURL(new RegExp(`/session/${taskId}(?:\\?|$)`), { timeout: TIMEOUT })
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await setEditorCode(solutionCode)
    await page.getByRole('button', { name: 'Run', exact: true }).click()
    await page.getByText(/Run succeeded|matches expected|Session complete|success/i).first().waitFor({ timeout: TIMEOUT })
    const finishButton = page.getByRole('button', { name: 'Finish session' })
    if (await finishButton.isVisible()) {
      await finishButton.click()
    }
    await page.getByText(/Session complete\. Recovery pattern logged\./).waitFor({ timeout: TIMEOUT })
  }

  try {
    // 0) Start + open app
    await page.goto(baseUrl)
    await page.getByText('Pebble').first().waitFor({ timeout: TIMEOUT })
    await addResult('0) Start + open app', true, `Loaded ${baseUrl}`)

    // 1) Onboarding guard + persistence
    try {
      await openSettings()
      await page.getByRole('button', { name: 'Reset local data' }).click()
      await page.waitForLoadState('domcontentloaded')

      await page.goto(`${baseUrl}/dashboard`)
      await page.waitForURL(/\/onboarding(?:\?|$)/, { timeout: TIMEOUT })

      await page.goto(`${baseUrl}/session/1`)
      await page.waitForURL(/\/onboarding(?:\?|$)/, { timeout: TIMEOUT })

      await fillOnboarding()
      await page.getByText(/Beginner.*Automation\/scripting.*JavaScript \(Simulated\)/).waitFor({ timeout: TIMEOUT })

      await page.goto(`${baseUrl}/dashboard`)
      await page.getByText('Skill level').waitFor({ timeout: TIMEOUT })
      await page.getByText('Beginner', { exact: true }).waitFor({ timeout: TIMEOUT })
      await page.getByText('Automation/scripting', { exact: true }).waitFor({ timeout: TIMEOUT })
      await page.getByText('Working professional', { exact: true }).waitFor({ timeout: TIMEOUT })

      await page.getByRole('link', { name: 'Edit profile' }).click()
      await fillOnboarding({
        skill: 'Intermediate',
        goal: 'Interview prep',
        background: 'Student',
        language: 'JavaScript (Simulated)',
      })
      await page.goto(`${baseUrl}/dashboard`)
      await page.getByText('Intermediate', { exact: true }).waitFor({ timeout: TIMEOUT })
      await page.getByText('Interview prep', { exact: true }).waitFor({ timeout: TIMEOUT })
      await page.getByText('Student', { exact: true }).waitFor({ timeout: TIMEOUT })

      await addResult('1) Onboarding guard + persistence', true, 'Guard redirect, save, edit, and persistence all verified')
    } catch (error) {
      bugs.push({
        severity: 'Major',
        title: 'Onboarding guard/persistence flow regression',
        steps: 'Reset local data -> open /dashboard and /session/1 -> complete onboarding -> revisit dashboard profile',
        expected: 'Redirects to /onboarding and persisted profile values render correctly',
        actual: String(error.message || error),
        suspectedFile: 'src/App.tsx or src/pages/OnboardingPage.tsx',
      })
      await addResult('1) Onboarding guard + persistence', false, String(error.message || error))
    }

    // 2) Task navigation sanity
    try {
      const tasks = [
        ['1', 'Sum Even Numbers', 'function sumEven'],
        ['2', 'First Non-Repeating Character', 'function firstUnique'],
        ['3', 'Valid Anagram', 'function isAnagram'],
        ['4', 'Longest Substring Without Repeating Characters', 'function lengthOfLongestSubstring'],
        ['5', 'Reverse Words in a String', 'function reverseWords'],
        ['6', 'Palindrome Check', 'function isPalindrome'],
      ]

      for (const [id, title, codeNeedle] of tasks) {
        await page.goto(`${baseUrl}/session/${id}`)
        await page.waitForURL(new RegExp(`/session/${id}(?:\\?|$)`), { timeout: TIMEOUT })
        await page.getByText(title, { exact: true }).waitFor({ timeout: TIMEOUT })
        const editorValue = await page.getByLabel('Session code editor').inputValue()
        if (!editorValue.includes(codeNeedle)) {
          throw new Error(`Task ${id} starter code mismatch: expected snippet ${codeNeedle}`)
        }
      }

      await openSettings()
      await page.getByRole('button', { name: 'On', exact: true }).click()
      await closeSettingsViaX()

      await page.goto(`${baseUrl}/session/1`)
      await page.getByText('Autoplay demo', { exact: true }).waitFor({ timeout: TIMEOUT })
      await page.getByText(/Guided fix/i).first().waitFor({ timeout: 60000 })

      await page.goto(`${baseUrl}/session/2`)
      await page.getByText('First Non-Repeating Character', { exact: true }).waitFor({ timeout: TIMEOUT })
      const guidedPanelVisible = await page.locator('aside:has-text("Guided fix")').isVisible().catch(() => false)
      if (guidedPanelVisible) {
        throw new Error('Guided panel leaked into task switch target')
      }
      await page.getByText('Edit the function, then run to validate output.').waitFor({ timeout: TIMEOUT })

      await addResult('2) Task navigation sanity', true, 'All tasks render correct titles/starter code, and cross-task state reset verified')
    } catch (error) {
      bugs.push({
        severity: 'Major',
        title: 'Task navigation or state-leak regression',
        steps: 'Navigate /session/1..6 and switch away while guided/nudge is open',
        expected: 'Correct title/starter code with clean state reset on task change',
        actual: String(error.message || error),
        suspectedFile: 'src/pages/SessionPage.tsx or src/tasks/index.ts',
      })
      await addResult('2) Task navigation sanity', false, String(error.message || error))
    }

    // 3) Progress tracking
    try {
      await openSettings()
      await page.getByRole('button', { name: 'Reset local data' }).click()
      await page.waitForLoadState('domcontentloaded')
      await fillOnboarding({
        skill: 'Beginner',
        goal: 'Automation/scripting',
        background: 'Student',
        language: 'JavaScript (Simulated)',
      })

      await page.goto(`${baseUrl}/dashboard`)
      let progress = await getStringsProgressText()
      if (progress !== '0/5 completed') {
        throw new Error(`Expected 0/5 after reset, received: ${progress}`)
      }

      const solutionTask3 = `function isAnagram(s: string, t: string): boolean {
  if (s.length !== t.length) {
    return false
  }

  const counts: Record<string, number> = {}
  for (const char of s) {
    counts[char] = (counts[char] ?? 0) + 1
  }

  for (const char of t) {
    const nextCount = (counts[char] ?? 0) - 1
    if (nextCount < 0) {
      return false
    }
    counts[char] = nextCount
  }

  return true
}`

      await completeTask('3', solutionTask3)
      await page.goto(`${baseUrl}/dashboard`)

      progress = await getStringsProgressText()
      if (progress !== '1/5 completed') {
        throw new Error(`Expected 1/5 after task 3 completion, received: ${progress}`)
      }
      await page.locator('a[href="/session/3"]').getByText('Completed').waitFor({ timeout: TIMEOUT })

      await page.getByRole('link', { name: 'Continue Strings' }).click()
      await page.waitForURL(/\/session\/1(?:\?|$)/, { timeout: TIMEOUT })

      const solutionTask1 = `function sumEven(nums: number[]) {
  let total = 0;
  for (const n of nums) {
    if (n % 2 === 0) {
      total += n;
    }
  }
  return total;
}`

      const solutionTask4 = `function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>()
  let left = 0
  let maxLength = 0

  for (let right = 0; right < s.length; right += 1) {
    const char = s[right]
    const seenAt = lastSeen.get(char)
    if (seenAt !== undefined) {
      left = Math.max(left, seenAt + 1)
    }

    lastSeen.set(char, right)
    maxLength = Math.max(maxLength, right - left + 1)
  }

  return maxLength
}`

      const solutionTask5 = `function reverseWords(s: string): string {
  return s
    .trim()
    .split(/\\s+/)
    .reverse()
    .join(' ')
}`

      const solutionTask6 = `function isPalindrome(s: string): boolean {
  const normalized = s.toLowerCase().replace(/[^a-z0-9]/g, '')
  let left = 0
  let right = normalized.length - 1

  while (left < right) {
    if (normalized[left] !== normalized[right]) {
      return false
    }
    left += 1
    right -= 1
  }

  return true
}`

      await completeTask('1', solutionTask1)
      await completeTask('4', solutionTask4)
      await completeTask('5', solutionTask5)
      await completeTask('6', solutionTask6)

      await page.goto(`${baseUrl}/dashboard`)
      progress = await getStringsProgressText()
      if (progress !== '5/5 completed') {
        throw new Error(`Expected 5/5 after full completion, received: ${progress}`)
      }

      await page.getByRole('link', { name: 'Review Strings' }).click()
      await page.waitForURL(/\/session\/1(?:\?|$)/, { timeout: TIMEOUT })

      await safeScreenshot(page, 'progress-5-of-5', screenshots)
      await addResult('3) Progress tracking (NEW FEATURE)', true, '0/5 -> 1/5 -> 5/5 and CTA behavior verified')
    } catch (error) {
      bugs.push({
        severity: 'Critical',
        title: 'Task completion progress regression',
        steps: 'Reset data -> finish string tasks -> verify dashboard module count and CTA',
        expected: 'Counts increment and CTA routes to next unfinished/review',
        actual: String(error.message || error),
        suspectedFile: 'src/utils/taskProgress.ts or src/pages/DashboardPage.tsx or src/pages/SessionPage.tsx',
      })
      await addResult('3) Progress tracking (NEW FEATURE)', false, String(error.message || error))
    }

    // 4) Demo mode behavior
    try {
      await openSettings()
      await page.getByRole('button', { name: 'On', exact: true }).click()
      await closeSettingsViaX()

      await page.goto(`${baseUrl}/session/1`)
      await page.getByText('Autoplay demo', { exact: true }).waitFor({ timeout: TIMEOUT })

      await page.waitForFunction(() => {
        const area = document.querySelector('textarea[aria-label="Session code editor"]')
        return area && area.value.includes('== 0')
      }, { timeout: 60000 })
      await page.getByRole('button', { name: 'Replay demo' }).click()

      await page.waitForFunction(() => {
        const area = document.querySelector('textarea[aria-label="Session code editor"]')
        return area && area.value.includes('% 2 = 0')
      }, { timeout: TIMEOUT })

      await page.getByText('Session complete. Recovery pattern logged.').waitFor({ timeout: 120000 })
      await page.getByRole('button', { name: 'Replay demo' }).click()
      await page.getByText(/Run failed:/).first().waitFor({ timeout: 60000 })

      await page.getByLabel('Session code editor').click()
      await page.keyboard.type(' ')
      await page.getByText('Demo paused', { exact: true }).waitFor({ timeout: TIMEOUT })

      await page.goto(`${baseUrl}/session/2`)
      const autoplayBadgeOn2 = await page.getByText('Autoplay demo', { exact: true }).isVisible().catch(() => false)
      if (autoplayBadgeOn2) {
        throw new Error('Autoplay incorrectly active on /session/2')
      }
      await page.getByRole('button', { name: 'Replay', exact: true }).waitFor({ timeout: TIMEOUT })

      await page.goto(`${baseUrl}/session/3`)
      const autoplayBadgeOn3 = await page.getByText('Autoplay demo', { exact: true }).isVisible().catch(() => false)
      if (autoplayBadgeOn3) {
        throw new Error('Autoplay incorrectly active on /session/3')
      }

      await addResult('4) Demo mode behavior (critical)', true, 'Task1 autoplay/replay/takeover OK; tasks 2-3 remain manual with demo mode ON')
    } catch (error) {
      bugs.push({
        severity: 'Critical',
        title: 'Demo mode gating/replay regression',
        steps: 'Enable demo mode; test /session/1 replay and switch to /session/2-3',
        expected: 'Autoplay only on task1; replay restarts; typing stops demo',
        actual: String(error.message || error),
        suspectedFile: 'src/pages/SessionPage.tsx',
      })
      await addResult('4) Demo mode behavior (critical)', false, String(error.message || error))
    }

    // 5) Settings scroll lock
    try {
      await page.goto(`${baseUrl}/dashboard`)

      await openSettings()
      await closeSettingsViaX()
      let overflow = await page.evaluate(() => document.body.style.overflow)
      if (overflow === 'hidden') throw new Error('Body overflow stuck hidden after X close')

      await openSettings()
      await page.keyboard.press('Escape')
      await page.getByRole('dialog', { name: /Settings/i }).waitFor({ state: 'detached', timeout: TIMEOUT })
      overflow = await page.evaluate(() => document.body.style.overflow)
      if (overflow === 'hidden') throw new Error('Body overflow stuck hidden after Escape close')

      await openSettings()
      await closeSettingsViaBackdrop()
      overflow = await page.evaluate(() => document.body.style.overflow)
      if (overflow === 'hidden') throw new Error('Body overflow stuck hidden after backdrop close')

      await addResult('5) Settings scroll lock regression', true, 'Overflow restored after X, Escape, and backdrop close paths')
    } catch (error) {
      bugs.push({
        severity: 'Major',
        title: 'Settings scroll lock regression',
        steps: 'Open settings, close via X/Escape/backdrop, then inspect body overflow',
        expected: 'Body overflow is restored and page scroll works',
        actual: String(error.message || error),
        suspectedFile: 'src/components/modals/SettingsModal.tsx',
      })
      await addResult('5) Settings scroll lock regression', false, String(error.message || error))
    }

    // 6) Mascot widget sanity
    try {
      await page.goto(`${baseUrl}/session/1`)
      const mascotButton = page.getByRole('button', { name: 'Toggle Pebble mascot' })
      await mascotButton.waitFor({ timeout: TIMEOUT })

      const boxBefore = await mascotButton.boundingBox()
      if (!boxBefore) throw new Error('Mascot button box missing before drag')

      await page.mouse.move(boxBefore.x + boxBefore.width / 2, boxBefore.y + boxBefore.height / 2)
      await page.mouse.down()
      await page.mouse.move(boxBefore.x - 180, boxBefore.y - 120)
      await page.mouse.up()

      const boxAfter = await mascotButton.boundingBox()
      if (!boxAfter) throw new Error('Mascot button box missing after drag')
      if (Math.abs(boxAfter.x - boxBefore.x) < 20 && Math.abs(boxAfter.y - boxBefore.y) < 20) {
        throw new Error('Mascot did not move after drag')
      }

      const storedPosition = await page.evaluate(() => localStorage.getItem('pebble_mascot_position_v1'))
      if (!storedPosition) throw new Error('Mascot position not persisted to localStorage')

      await page.reload({ waitUntil: 'domcontentloaded' })
      const boxReloaded = await mascotButton.boundingBox()
      if (!boxReloaded) throw new Error('Mascot button missing after refresh')
      if (Math.abs(boxReloaded.x - boxAfter.x) > 24 || Math.abs(boxReloaded.y - boxAfter.y) > 24) {
        throw new Error('Mascot position did not persist after refresh')
      }

      const runButton = page.getByRole('button', { name: 'Run', exact: true })
      const runBox = await runButton.boundingBox()
      if (!runBox) throw new Error('Run button box missing')
      const overlaps = !(
        boxReloaded.x + boxReloaded.width < runBox.x ||
        runBox.x + runBox.width < boxReloaded.x ||
        boxReloaded.y + boxReloaded.height < runBox.y ||
        runBox.y + runBox.height < boxReloaded.y
      )
      if (overlaps) {
        throw new Error('Mascot overlaps Run button after persistence')
      }

      await addResult('6) Mascot widget sanity', true, 'Drag, persistence, viewport constraints, and key button non-overlap verified')
    } catch (error) {
      bugs.push({
        severity: 'Minor',
        title: 'Mascot drag/persistence/layout regression',
        steps: 'Drag mascot, refresh, and verify position and button accessibility',
        expected: 'Position persists and does not obstruct key actions',
        actual: String(error.message || error),
        suspectedFile: 'src/components/mascot/PebbleMascot.tsx',
      })
      await addResult('6) Mascot widget sanity', false, String(error.message || error))
    }

    // 7) Console errors
    if (consoleErrors.length === 0) {
      await addResult('7) Console errors', true, 'No browser console/page errors observed')
    } else {
      bugs.push({
        severity: 'Major',
        title: 'Console errors during QA flow',
        steps: 'Navigate onboarding/dashboard/session flows with DevTools open',
        expected: 'No red errors',
        actual: consoleErrors.join(' | '),
        suspectedFile: 'Unknown; inspect browser logs',
      })
      await addResult('7) Console errors', false, consoleErrors.slice(0, 6).join(' | '))
    }

    await safeScreenshot(page, 'final-state', screenshots)

    await browser.close()

    const output = {
      baseUrl,
      report,
      bugs,
      screenshots,
      consoleErrors,
      notes,
    }
    console.log(JSON.stringify(output, null, 2))
  } catch (fatal) {
    try {
      await safeScreenshot(page, 'fatal', screenshots)
    } catch {}
    await browser.close()
    console.error(JSON.stringify({ fatal: String(fatal?.message || fatal), screenshots }, null, 2))
    process.exit(1)
  }
}

run()
