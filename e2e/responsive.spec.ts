import { test, expect } from '@playwright/test'

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
