import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'
import { setUpLobby, startGame, closeSession } from './helpers'

const THEMES = ['light', 'dark'] as const

async function setTheme(page: import('@playwright/test').Page, theme: 'light' | 'dark') {
  await page.evaluate(t => {
    localStorage.setItem('mkt-theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }, theme)
}

async function scan(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
}

function formatViolations(violations: Result[]) {
  return violations
    .map(v => `${v.id} (${v.impact}): ${v.help}\n` + v.nodes.map(n => `  - ${n.target.join(' ')}: ${n.failureSummary}`).join('\n'))
    .join('\n\n')
}

for (const theme of THEMES) {
  test(`Landing view has no WCAG AA violations (${theme})`, async ({ page }) => {
    await page.goto('/')
    await setTheme(page, theme)
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
  })

  test(`Join view (code entry) has no WCAG AA violations (${theme})`, async ({ page }) => {
    await page.goto('/join')
    await setTheme(page, theme)
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
  })
}

test('live game views have no WCAG AA violations, light and dark', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { adminPage, sellerPage, buyerPage } = session

  const checkpoints: Array<{ label: string; page: import('@playwright/test').Page }> = [
    { label: 'admin-lobby', page: adminPage },
    { label: 'seller-lobby', page: sellerPage },
    { label: 'buyer-lobby', page: buyerPage },
  ]

  await startGame(session)
  checkpoints.push(
    { label: 'seller-crate-choice', page: sellerPage },
    { label: 'admin-seller-input', page: adminPage },
  )

  const allViolations: string[] = []
  for (const { label, page } of checkpoints) {
    for (const theme of THEMES) {
      await setTheme(page, theme)
      const results = await scan(page)
      if (results.violations.length > 0) {
        allViolations.push(`--- ${label} (${theme}) ---\n${formatViolations(results.violations)}`)
      }
    }
  }

  expect(allViolations, allViolations.join('\n\n')).toEqual([])

  await closeSession(session)
})
