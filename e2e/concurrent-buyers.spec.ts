import { Browser, BrowserContext, Page, expect, test } from '@playwright/test'

// Exercises the group-based market phase end to end: several buyers active
// at once (not strictly one at a time), and a group's turn timer expiring
// auto-skips whoever's left. Uses the backend's minimum turnDurationSeconds
// (10s) to keep the real wall-clock wait bounded. The server-side group/
// timer math itself is covered deterministically (fake timers) in the
// backend's sessionService.test.ts — this only confirms the browser side
// actually reflects it.

interface Ctx { ctx: BrowserContext; page: Page }

async function openTab(browser: Browser): Promise<Ctx> {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  return { ctx, page }
}

/** Scoped to the .eve-note status line — its exact text (with punctuation)
 * disambiguates from the HUD status pill ("Du bist dran · noch Xs") and the
 * sr-only aria-live echo, both of which also contain "Du bist dran". */
function statusNote(page: Page, text: 'Du bist dran!' | 'Warte auf deinen Zug…') {
  return page.locator('.eve-note', { hasText: /^(Du bist dran!|Warte auf deinen Zug…)$/ }).filter({ hasText: text })
}

test('buyers act in concurrent groups, and an expired group timer auto-skips the rest', async ({ browser }) => {
  test.setTimeout(90_000)

  const admin = await openTab(browser)
  const seller = await openTab(browser)
  const buyers = await Promise.all([1, 2, 3, 4].map(() => openTab(browser)))

  try {
    // 1 seller, 4 buyers (default) — with BUYER_GROUP_SIZE=3 that's one
    // full group of 3 plus a 4th buyer in a second group.
    await admin.page.goto('/')
    await admin.page.getByLabel('Verkäufer').fill('1')
    await admin.page.getByRole('button', { name: /Session erstellen/ }).click()

    // Shortest allowed turn timer, so the expiry below doesn't make the test slow.
    await admin.page.getByLabel('Zeit pro Zug (Sek.)').fill('10')
    await admin.page.getByRole('button', { name: /Übernehmen/ }).click()
    await admin.page.waitForURL(/\/admin\/[A-Z0-9]{4}/)
    const code = admin.page.url().split('/admin/')[1].slice(0, 4)

    await seller.page.goto(`/join/${code}`)
    await seller.page.getByLabel('Dein Name').fill('Verkäuferin')
    await seller.page.getByRole('button', { name: /, frei$/ }).first().click()
    await seller.page.getByRole('button', { name: /^Beitreten/ }).click()
    await seller.page.waitForURL(/\/play\//)

    await Promise.all(buyers.map(async (buyer, i) => {
      await buyer.page.goto(`/join/${code}`)
      await buyer.page.getByLabel('Dein Name').fill(`Käufer${i + 1}`)
      await buyer.page.getByRole('button', { name: `K${i + 1}` }).click()
      await buyer.page.getByRole('button', { name: /^Beitreten/ }).click()
      await buyer.page.waitForURL(/\/play\//)
    }))

    await admin.page.getByRole('button', { name: /Spiel starten/ }).click()
    await expect(seller.page.getByRole('button', { name: /Qualität 3/ })).toBeVisible()
    await seller.page.getByRole('button', { name: /Qualität 3/ }).click()
    await seller.page.getByRole('button', { name: 'Kiste nehmen' }).click()
    await seller.page.locator('#sellerPriceInput').fill('15')
    await seller.page.getByRole('button', { name: 'Schild aufhängen' }).click()

    // Exactly 3 of the 4 buyers should be active at once — the market board
    // only renders once a seller has offered, so wait for that first. The
    // button's visible label is always "Kaufen" regardless of whose turn it
    // is (only its aria-label/enabled state differs — see StallSlot.tsx).
    for (const buyer of buyers) {
      await expect(buyer.page.getByRole('button', { name: 'Kaufen' }).first()).toBeVisible({ timeout: 10_000 })
    }
    const isActive = await Promise.all(buyers.map(b => statusNote(b.page, 'Du bist dran!').isVisible()))
    expect(isActive.filter(Boolean)).toHaveLength(3)

    const activeBuyers = buyers.filter((_, i) => isActive[i])
    const waitingBuyer = buyers.find((_, i) => !isActive[i])!
    await expect(statusNote(waitingBuyer.page, 'Warte auf deinen Zug…')).toBeVisible()

    // One active buyer decides normally; the other two are left to time out.
    await activeBuyers[0].page.getByRole('button', { name: /€ kaufen$/ }).first().click()
    await expect(activeBuyers[0].page.getByText(/Gekauft/).first()).toBeVisible()

    // Let the group's shared 10s timer run out — the next poll anywhere
    // against the session picks up the auto-skip for the remaining two
    // members and starts the next group's (the 4th buyer's) timer. This is
    // the one real wall-clock wait in the test.
    await expect(statusNote(waitingBuyer.page, 'Du bist dran!')).toBeVisible({ timeout: 15_000 })

    // Admin's buyer-status grid reflects the same handover.
    await expect(admin.page.getByText('Käufer-Status')).toBeVisible()
  } finally {
    await admin.ctx.close()
    await seller.ctx.close()
    for (const b of buyers) await b.ctx.close()
  }
})
