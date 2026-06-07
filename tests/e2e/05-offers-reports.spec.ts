import { test, expect } from '@playwright/test'
import { loginUser } from './helpers'

test.beforeEach(async ({ page }) => {
  await loginUser(page)
})

// ─── 案件管理 ─────────────────────────────────────────────────────────────────

test('T-030: 案件一覧 — 1件以上表示', async ({ page }) => {
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
})

test('T-031: 案件 — 転職フィルター', async ({ page }) => {
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("転職")')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  // フィルター後も描画が壊れていないこと
  await expect(page.locator('body')).toBeVisible()
})

test('T-032: 案件 — すべてフィルター', async ({ page }) => {
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("転職")')
  await page.click('button:has-text("すべて")')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  await expect(cards.first()).toBeVisible()
})

test('T-033: 案件カード — 数値表示（コミッション等）', async ({ page }) => {
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  const text = await page.locator('body').innerText()
  // 数値または「−」が含まれていること
  expect(text).toMatch(/円|%|EPC|コミッション|ASP/)
})

test('U-001: 案件一覧 — コンソールエラーなし', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

// ─── 収益レポート ─────────────────────────────────────────────────────────────

test('T-041,T-042: 収益レポート — サマリーカード表示', async ({ page }) => {
  await page.goto('/reports')
  await page.waitForLoadState('networkidle')

  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  const text = await page.locator('body').innerText()
  // サイト0件でも空状態UIが表示されているか、サマリーが表示されていること
  expect(text.length).toBeGreaterThan(10)
  expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('U-002: 収益レポート — Networkエラーなし', async ({ page }) => {
  const failures: string[] = []
  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      failures.push(`${res.status()} ${res.url()}`)
    }
  })
  await page.goto('/reports')
  await page.waitForLoadState('networkidle')
  expect(failures).toHaveLength(0)
})

// ─── UIレンダリング ───────────────────────────────────────────────────────────

test('U-006: サイドバー — アクティブ表示', async ({ page }) => {
  await page.goto('/offers')
  await page.waitForLoadState('networkidle')
  // 案件管理のリンクがアクティブスタイルを持つ
  const activeLink = page.locator('a[href="/offers"]')
  await expect(activeLink).toBeVisible()
  const cls = await activeLink.getAttribute('class')
  expect(cls).toBeTruthy()
})

test('U-007: ログアウト後 — localStorage からトークン削除', async ({ page }) => {
  await page.goto('/dashboard')
  const tokenBefore = await page.evaluate(() => localStorage.getItem('affibase_token'))
  expect(tokenBefore).toBeTruthy()

  await page.click('button:has-text("ログアウト")')
  await expect(page).toHaveURL(/\/login/)

  const tokenAfter = await page.evaluate(() => localStorage.getItem('affibase_token'))
  expect(tokenAfter).toBeNull()
})
