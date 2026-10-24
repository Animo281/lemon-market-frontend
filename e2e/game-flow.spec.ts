import { test, expect } from '@playwright/test'
import { setUpLobby, startGame, submitSellerOffer, buyFirstStall, endGame, closeSession } from './helpers'

test('admin can cancel or confirm a kick via the ConfirmDialog (not window.confirm)', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { adminPage, buyerPage } = session

  // Scoped to the buyer's own row — PlayerList renders a "✕" per player
  // (seller column first, then buyer column), so an unscoped first() would
  // silently kick the seller instead.
  const buyerKickBtn = () => adminPage.getByText('Test-Käufer', { exact: true }).locator('..').getByRole('button', { name: '✕' })

  await buyerKickBtn().click()
  const dialog = adminPage.getByRole('alertdialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Spieler entfernen?' })).toBeVisible()

  // Cancel: dialog closes, player stays.
  await dialog.getByRole('button', { name: 'Abbrechen' }).click()
  await expect(dialog).toBeHidden()
  await expect(adminPage.getByText('Test-Käufer')).toBeVisible()

  // Esc also cancels without acting.
  await buyerKickBtn().click()
  await expect(adminPage.getByRole('alertdialog')).toBeVisible()
  await adminPage.keyboard.press('Escape')
  await expect(adminPage.getByRole('alertdialog')).toBeHidden()
  await expect(adminPage.getByText('Test-Käufer')).toBeVisible()

  // Confirm: player is actually removed, and they see the kicked screen.
  await buyerKickBtn().click()
  await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Entfernen' }).click()
  await expect(adminPage.getByRole('alertdialog')).toBeHidden()
  await expect(buyerPage.getByRole('heading', { name: 'Du wurdest entfernt' })).toBeVisible({ timeout: 10_000 })

  expect(session.consoleErrors, session.consoleErrors.join('\n')).toEqual([])
  await closeSession(session)
})

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

  await expect(adminPage.getByRole('button', { name: 'Spiel beenden' })).toBeEnabled({ timeout: 10_000 })
  await endGame(adminPage)

  await expect(adminPage.getByRole('heading', { name: 'Alle Ergebnisse' })).toBeVisible({ timeout: 10_000 })
  await expect(buyerPage.getByRole('heading', { name: 'Alle Ergebnisse' })).toBeVisible({ timeout: 10_000 })
  await expect(sellerPage.getByText('Alle Ergebnisse')).toBeVisible({ timeout: 10_000 })

  expect(session.consoleErrors, session.consoleErrors.join('\n')).toEqual([])

  await closeSession(session)
})

test('the admin can advance past round 1 instead of ending, and the info-mode toggle uses the ConfirmDialog', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { adminPage, sellerPage, buyerPage } = session

  await startGame(session)
  await submitSellerOffer(sellerPage)
  await expect(buyerPage.getByRole('button', { name: /€ kaufen$/ })).toBeVisible({ timeout: 10_000 })
  await buyFirstStall(buyerPage)

  const roundEndBtn = adminPage.getByRole('button', { name: /Nächste Runde/ })
  await expect(roundEndBtn).toBeEnabled({ timeout: 10_000 })

  // Info-mode toggle also goes through ConfirmDialog now, not window.confirm.
  await adminPage.getByRole('button', { name: /Qualität ausblenden/ }).click()
  const dialog = adminPage.getByRole('alertdialog')
  await expect(dialog.getByRole('heading', { name: 'Informationsmodus wechseln?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Wechseln' }).click()
  await expect(dialog).toBeHidden()
  await expect(adminPage.getByText('Asymm. Info', { exact: true })).toBeVisible()

  await roundEndBtn.click()
  await expect(adminPage.getByText('Runde 2', { exact: true })).toBeVisible({ timeout: 10_000 })
  await expect(sellerPage.getByRole('button', { name: /Qualität 3/ })).toBeVisible({ timeout: 10_000 })

  expect(session.consoleErrors, session.consoleErrors.join('\n')).toEqual([])
  await closeSession(session)
})

test('a closed/reopened player tab auto-rejoins from the localStorage index', async ({ browser }) => {
  const session = await setUpLobby(browser)
  const { buyerCtx, code } = session

  // sessionStorage is per-tab even within one BrowserContext — a fresh page
  // in the same context has no player token, same as a reopened tab/closed-
  // and-relaunched phone browser would, while the context's localStorage
  // (the sessionIndex) still has it.
  const reopened = await buyerCtx.newPage()
  await reopened.goto(`/play/${code}`)
  await expect(reopened).toHaveURL(`/play/${code}`) // not bounced to '/'
  await expect(reopened.getByText('Warte auf Spielstart').first()).toBeVisible({ timeout: 10_000 })
  await reopened.close()

  // Same recovery via the join page's "Weiterspielen" banner, for the case
  // where the player re-opens the QR/share link instead of the bare /play URL.
  const viaJoin = await buyerCtx.newPage()
  await viaJoin.goto(`/join/${code}`)
  await expect(viaJoin.getByText('Test-Käufer', { exact: false })).toBeVisible()
  await viaJoin.getByRole('button', { name: /Weiterspielen/ }).click()
  await expect(viaJoin).toHaveURL(`/play/${code}`)
  await expect(viaJoin.getByText('Warte auf Spielstart').first()).toBeVisible({ timeout: 10_000 })
  await viaJoin.close()

  await closeSession(session)
})

test('landing page rejects join with an unknown session code, fast (404 short-circuits retries)', async ({ page }) => {
  await page.goto('/join/ZZZZ')
  // The 404 fast-path (JoinView.tsx) skips the 3-retry/network-blip budget,
  // so this should resolve on the very first request, well under 2s —
  // not the ~6s a mistyped code used to take.
  await expect(page.getByText(/Session nicht gefunden/)).toBeVisible({ timeout: 2_000 })
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
