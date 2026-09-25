import { Browser, BrowserContext, Page, expect } from '@playwright/test'

export interface GameSession {
  code: string
  adminPage: Page
  sellerPage: Page
  buyerPage: Page
  adminCtx: BrowserContext
  sellerCtx: BrowserContext
  buyerCtx: BrowserContext
  consoleErrors: string[]
}

function trackConsoleErrors(page: Page, sink: string[], label: string) {
  page.on('console', msg => {
    if (msg.type() === 'error') sink.push(`[${label}] ${msg.text()}`)
  })
  page.on('pageerror', err => sink.push(`[${label}] pageerror: ${err.message}`))
}

/** Sets the theme before the app's first paint, so no CSS transition is ever mid-flight. */
async function withTheme(ctx: BrowserContext, theme: 'light' | 'dark') {
  await ctx.addInitScript(t => {
    localStorage.setItem('mkt-theme', t)
  }, theme)
}

/**
 * Waits out every finite (non-looping) CSS/Web Animation on the page — the
 * fade-up/scale-in entrance animations — without waiting forever on the
 * intentionally infinite ones (dot-ping, animate-pulse). Call before an axe
 * scan or a screenshot so colors/opacity are settled, not mid-transition.
 */
export async function waitForSettled(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations()
        .filter(a => {
          const timing = a.effect?.getTiming()
          return timing?.iterations !== Infinity
        })
        .map(a => a.finished.catch(() => {})),
    ),
  )
}

/**
 * Creates a session as admin (1 round, so the flow reaches game-end fast),
 * joins one seller and one buyer, and starts the game. Leaves all three
 * pages at the lobby, ready for the caller to drive further phases.
 */
export async function setUpLobby(browser: Browser, theme: 'light' | 'dark' = 'dark', rounds = 1): Promise<GameSession> {
  const consoleErrors: string[] = []

  const adminCtx = await browser.newContext()
  await withTheme(adminCtx, theme)
  const adminPage = await adminCtx.newPage()
  trackConsoleErrors(adminPage, consoleErrors, 'admin')

  await adminPage.goto('/')
  await adminPage.getByRole('button', { name: /Session erstellen/ }).click()

  await adminPage.getByLabel('Anzahl Runden').fill(String(rounds))
  await adminPage.getByRole('button', { name: /Übernehmen/ }).click()
  await adminPage.waitForURL(/\/admin\/[A-Z0-9]{4}/)
  const code = adminPage.url().split('/admin/')[1].slice(0, 4)

  const sellerCtx = await browser.newContext()
  await withTheme(sellerCtx, theme)
  const sellerPage = await sellerCtx.newPage()
  trackConsoleErrors(sellerPage, consoleErrors, 'seller')
  await sellerPage.goto(`/join/${code}`)
  await sellerPage.getByLabel('Dein Name').fill('Test-Verkäufer')
  await sellerPage.getByRole('button', { name: /, frei$/ }).first().click()
  await sellerPage.getByRole('button', { name: /^Beitreten/ }).click()
  await sellerPage.waitForURL(/\/play\//)

  const buyerCtx = await browser.newContext()
  await withTheme(buyerCtx, theme)
  const buyerPage = await buyerCtx.newPage()
  trackConsoleErrors(buyerPage, consoleErrors, 'buyer')
  await buyerPage.goto(`/join/${code}`)
  await buyerPage.getByLabel('Dein Name').fill('Test-Käufer')
  await buyerPage.getByRole('button', { name: 'K1' }).click()
  await buyerPage.getByRole('button', { name: /^Beitreten/ }).click()
  await buyerPage.waitForURL(/\/play\//)

  return { code, adminPage, sellerPage, buyerPage, adminCtx, sellerCtx, buyerCtx, consoleErrors }
}

export async function startGame(session: GameSession) {
  const startBtn = session.adminPage.getByRole('button', { name: /Spiel starten/ })
  await expect(startBtn).toBeEnabled()
  await startBtn.click()
}

/** Drives the seller through crate choice + price and hangs the sign. */
export async function submitSellerOffer(sellerPage: Page, priceEuro = '15') {
  await sellerPage.getByRole('button', { name: /Qualität 3/ }).click()
  await sellerPage.getByRole('button', { name: 'Kiste nehmen' }).click()
  await sellerPage.locator('#sellerPriceInput').fill(priceEuro)
  await sellerPage.getByRole('button', { name: 'Schild aufhängen' }).click()
}

/** Buys from the first (only) open stall as the buyer, once it's their turn. */
export async function buyFirstStall(buyerPage: Page) {
  await buyerPage.getByRole('button', { name: /€ kaufen$/ }).first().click()
}

export async function closeSession(session: GameSession) {
  await session.adminCtx.close()
  await session.sellerCtx.close()
  await session.buyerCtx.close()
}
