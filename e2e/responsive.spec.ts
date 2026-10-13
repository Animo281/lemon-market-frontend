import { test, expect } from '@playwright/test'
import { setUpLobby, startGame, submitSellerOffer, closeSession, waitForSettled } from './helpers'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'join-code-entry', path: '/join' },
  { name: 'join-unknown-code', path: '/join/ZZZZ' },
] as const

for (const viewport of VIEWPORTS) {
  for (const target of PAGES) {
    test(`${target.name} has no horizontal overflow at ${viewport.name} (${viewport.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto(target.path)
      await page.waitForTimeout(300) // let load/animation state settle before measuring

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `document is ${scrollWidth}px wide but viewport is only ${clientWidth}px`).toBeLessThanOrEqual(clientWidth + 1)

      await page.screenshot({ path: `test-results/screenshots/${target.name}-${viewport.name}.png`, fullPage: true })
    })
  }
}

// The admin, buyer and seller views only exist once a session is running, so
// they need a real lobby rather than a bare page.goto(). This checks the
// same "no page-level horizontal scroll" property as above, plus that the
// buyer/seller game scene's own horizontal scroller (not the page) is what
// carries the overflow below its 880px minimum width.
for (const viewport of VIEWPORTS) {
  test(`admin/buyer/seller have no page-level horizontal overflow at ${viewport.name} (${viewport.width}px)`, async ({ browser }) => {
    const session = await setUpLobby(browser)
    const { adminPage, buyerPage, sellerPage } = session

    for (const page of [adminPage, buyerPage, sellerPage]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
    }

    await startGame(session)
    await submitSellerOffer(sellerPage)

    for (const [label, page] of [['admin', adminPage], ['buyer', buyerPage], ['seller', sellerPage]] as const) {
      await waitForSettled(page)
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(scrollWidth, `${label} document is ${scrollWidth}px wide but viewport is only ${clientWidth}px`).toBeLessThanOrEqual(clientWidth + 1)

      await page.screenshot({ path: `test-results/screenshots/${label}-${viewport.name}.png`, fullPage: true })
    }

    await closeSession(session)
  })
}

// Below the game scene's 880px minimum width, the scene itself (not the
// page) must scroll sideways, and the snap-position dots (BuyerView.tsx,
// purely visual indicators driven by scroll position) must track it.
test('buyer game scene scrolls horizontally and snap dots track scroll below 880px', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { buyerPage, sellerPage } = session
  await buyerPage.setViewportSize({ width: 390, height: 844 })

  await startGame(session)
  await submitSellerOffer(sellerPage)
  await waitForSettled(buyerPage)

  const scroller = buyerPage.locator('.scene-scroller').first()
  await expect(scroller).toBeVisible()

  const { scrollWidth, clientWidth } = await scroller.evaluate(el => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }))
  expect(scrollWidth, 'scene scroller should be wider than the viewport below 880px').toBeGreaterThan(clientWidth)

  const dots = buyerPage.locator('.scene-snap-dot')
  await expect(dots.first()).toHaveClass(/active/)

  await scroller.evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth })
  await buyerPage.waitForTimeout(200)
  await expect(dots.last()).toHaveClass(/active/)

  await closeSession(session)
})
