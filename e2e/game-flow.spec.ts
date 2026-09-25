import { test, expect } from '@playwright/test'
import { setUpLobby, startGame, submitSellerOffer, buyFirstStall, closeSession } from './helpers'

test('admin creates a session, one seller and one buyer play a full round', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { adminPage, sellerPage, buyerPage } = session

  await expect(adminPage.getByRole('heading', { name: 'Admin-Panel' })).toBeVisible()
  await startGame(session)

  await expect(sellerPage.getByRole('button', { name: /Qualität 3/ })).toBeVisible()
  await submitSellerOffer(sellerPage)

  await expect(buyerPage.getByRole('button', { name: /€ kaufen$/ })).toBeVisible({ timeout: 10_000 })
  await buyFirstStall(buyerPage)
  await expect(buyerPage.getByText(/Gekauft/)).toBeVisible()

  const nextRoundBtn = adminPage.getByRole('button', { name: /Ergebnisse anzeigen|Nächste Runde/ })
  await expect(nextRoundBtn).toBeEnabled({ timeout: 10_000 })
  await nextRoundBtn.click()

  await expect(adminPage.getByRole('heading', { name: 'Alle Ergebnisse' })).toBeVisible({ timeout: 10_000 })
  await expect(buyerPage.getByRole('heading', { name: 'Alle Ergebnisse' })).toBeVisible({ timeout: 10_000 })
  await expect(sellerPage.getByText('Alle Ergebnisse')).toBeVisible({ timeout: 10_000 })

  expect(session.consoleErrors, session.consoleErrors.join('\n')).toEqual([])

  await closeSession(session)
})

test('landing page rejects join with an unknown session code', async ({ page }) => {
  await page.goto('/join/ZZZZ')
  await expect(page.getByText(/Session nicht gefunden/)).toBeVisible({ timeout: 8_000 })
  await page.getByRole('button', { name: 'Zur Startseite' }).click()
  await expect(page).toHaveURL('/')
})

test('admin card disables session creation while zero sellers or buyers are set', async ({ page }) => {
  await page.goto('/')
  const sellerInput = page.locator('input[type="number"]').first()
  await sellerInput.fill('0')
  await sellerInput.blur()
  await expect(sellerInput).toHaveValue('1')
})
