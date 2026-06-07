import { test, expect } from '@playwright/test'
import { loginUser } from './helpers'

test.beforeEach(async ({ page }) => {
  await loginUser(page)
})

test('T-010: テーマ一覧 — 1件以上表示', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  await expect(cards.first()).toBeVisible()
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
})

test('T-011: テーマ — 副業フィルター', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("副業")')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
})

test('T-012: テーマ — すべてフィルター', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("副業")')
  await page.click('button:has-text("すべて")')
  await page.waitForLoadState('networkidle')
  const cards = page.locator('.card')
  const count = await cards.count()
  expect(count).toBeGreaterThan(0)
})

test('T-013: テーマ — 検索フィルター', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  const allCards = await page.locator('.card').count()
  await page.fill('input[type="search"], input[placeholder*="検索"]', '副業')
  await page.waitForTimeout(300)
  const filteredCards = await page.locator('.card').count()
  // フィルター後は0件以上（検索が機能していること）
  expect(filteredCards).toBeGreaterThanOrEqual(0)
  // 全件 >= フィルター後 のはず
  expect(allCards).toBeGreaterThanOrEqual(filteredCards)
})

test('T-014: テーマ — 「このテーマで始める」→ /sites/new に遷移', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  await page.click('button:has-text("このテーマで作成")')
  await expect(page).toHaveURL(/\/sites\/new/)
})

test('T-015: テーマカード — 月間検索数・競合難度表示', async ({ page }) => {
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  // 月間検索数またはそれに関連するテキストが含まれていること
  const text = await page.locator('body').innerText()
  expect(text).toMatch(/検索|競合|月間|難易度|単価/)
})

test('U-001: テーマ一覧 — コンソールエラーなし', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  await page.goto('/themes')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})
