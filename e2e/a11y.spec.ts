import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { Result } from 'axe-core'
import { setUpLobby, startGame, submitSellerOffer, buyFirstStall, waitForSettled, closeSession } from './helpers'

const THEMES = ['light', 'dark'] as const

async function scan(page: Page) {
  await waitForSettled(page)
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
  test(`Landing view has no WCAG AA violations (${theme})`, async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(t => localStorage.setItem('mkt-theme', t), theme)
    const page = await ctx.newPage()
    await page.goto('/')
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
    await ctx.close()
  })

  test(`Landing config modal has no WCAG AA violations (${theme})`, async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(t => localStorage.setItem('mkt-theme', t), theme)
    const page = await ctx.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: /Session erstellen/ }).click()
    await expect(page.getByRole('button', { name: /Übernehmen/ })).toBeVisible()
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
    await ctx.close()
  })

  test(`Join view (code entry) has no WCAG AA violations (${theme})`, async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(t => localStorage.setItem('mkt-theme', t), theme)
    const page = await ctx.newPage()
    await page.goto('/join')
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
    await ctx.close()
  })

  test(`Join view (unknown code error) has no WCAG AA violations (${theme})`, async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addInitScript(t => localStorage.setItem('mkt-theme', t), theme)
    const page = await ctx.newPage()
    await page.goto('/join/ZZZZ')
    await expect(page.getByText(/Session nicht gefunden/)).toBeVisible({ timeout: 8_000 })
    const results = await scan(page)
    expect(results.violations, formatViolations(results.violations)).toEqual([])
    await ctx.close()
  })

  test(`Full game flow has no WCAG AA violations across every phase (${theme})`, async ({ browser }) => {
    const session = await setUpLobby(browser, theme)
    const { adminPage, sellerPage, buyerPage } = session

    const checkpoints: Array<{ label: string; page: Page }> = [
      { label: 'admin-lobby', page: adminPage },
      { label: 'seller-lobby', page: sellerPage },
      { label: 'buyer-lobby', page: buyerPage },
    ]

    await startGame(session)
    checkpoints.push(
      { label: 'seller-crate-choice', page: sellerPage },
      { label: 'admin-seller-input', page: adminPage },
    )

    await sellerPage.getByRole('button', { name: /Qualität 3/ }).click()
    await sellerPage.getByRole('button', { name: 'Kiste nehmen' }).click()
    checkpoints.push({ label: 'seller-counter', page: sellerPage })

    await sellerPage.locator('#sellerPriceInput').fill('15')
    await sellerPage.getByRole('button', { name: 'Schild aufhängen' }).click()
    await expect(buyerPage.getByRole('button', { name: /€ kaufen$/ })).toBeVisible({ timeout: 10_000 })
    checkpoints.push(
      { label: 'admin-market', page: adminPage },
      { label: 'seller-market', page: sellerPage },
      { label: 'buyer-market', page: buyerPage },
    )

    await buyFirstStall(buyerPage)
    await expect(adminPage.getByRole('button', { name: /Ergebnisse anzeigen|Nächste Runde/ })).toBeEnabled({ timeout: 10_000 })
    checkpoints.push(
      { label: 'admin-round-end', page: adminPage },
      { label: 'seller-round-end', page: sellerPage },
      { label: 'buyer-round-end', page: buyerPage },
    )

    await adminPage.getByRole('button', { name: /Ergebnisse anzeigen|Nächste Runde/ }).click()
    await expect(adminPage.getByRole('heading', { name: 'Alle Ergebnisse' })).toBeVisible({ timeout: 10_000 })
    await expect(buyerPage.getByText('Alle Ergebnisse')).toBeVisible({ timeout: 10_000 })
    await expect(sellerPage.getByText('Alle Ergebnisse')).toBeVisible({ timeout: 10_000 })
    checkpoints.push(
      { label: 'admin-game-end', page: adminPage },
      { label: 'seller-game-end', page: sellerPage },
      { label: 'buyer-game-end', page: buyerPage },
    )

    const allViolations: string[] = []
    for (const { label, page } of checkpoints) {
      const results = await scan(page)
      if (results.violations.length > 0) {
        allViolations.push(`--- ${label} (${theme}) ---\n${formatViolations(results.violations)}`)
      }
    }

    expect(allViolations, allViolations.join('\n\n')).toEqual([])

    await closeSession(session)
  })
}
