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

/**
 * Creates a session as admin (1 round, so the flow reaches game-end fast),
 * joins one seller and one buyer, and starts the game. Leaves all three
 * pages at the lobby, ready for the caller to drive further phases.
 */
export async function setUpLobby(browser: Browser): Promise<GameSession> {
  const consoleErrors: string[] = []

  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  trackConsoleErrors(adminPage, consoleErrors, 'admin')

  await adminPage.goto('/')
  await adminPage.getByRole('button', { name: /Session erstellen/ }).click()

  await adminPage.getByLabel('Anzahl Runden').fill('1')
  await adminPage.getByRole('button', { name: /Übernehmen/ }).click()
  await adminPage.waitForURL(/\/admin\/[A-Z0-9]{4}/)
  const code = adminPage.url().split('/admin/')[1].slice(0, 4)

  const sellerCtx = await browser.newContext()
  const sellerPage = await sellerCtx.newPage()
  trackConsoleErrors(sellerPage, consoleErrors, 'seller')
  await sellerPage.goto(`/join/${code}`)
  await sellerPage.getByLabel('Dein Name').fill('Test-Verkäufer')
  await sellerPage.getByRole('button', { name: /, frei$/ }).first().click()
  await sellerPage.getByRole('button', { name: /^Beitreten/ }).click()
  await sellerPage.waitForURL(/\/play\//)

  const buyerCtx = await browser.newContext()
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
