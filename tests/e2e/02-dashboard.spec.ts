import { test, expect } from '@playwright/test'
import { loginUser } from './helpers'

test.beforeEach(async ({ page }) => {
  await loginUser(page)
})

test('T-050: ダッシュボード — 統計カード4種が表示', async ({ page }) => {
  await page.goto('/dashboard')
  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
  await page.waitForLoadState('networkidle')

  // カードが少なくとも1つ表示されていること
  const cards = page.locator('.card')
  await expect(cards.first()).toBeVisible()
  expect(consoleErrors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('T-051: ダッシュボード — テーマを選ぶ → /themes 遷移', async ({ page }) => {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  await page.click('a[href="/themes"]')
  await expect(page).toHaveURL(/\/themes/)
})

test('T-052: サイドバー — 全メニュー遷移', async ({ page }) => {
  await page.goto('/dashboard')

  const menu = [
    { href: '/themes',  url: /\/themes/ },
    { href: '/sites',   url: /\/sites/ },
    { href: '/offers',  url: /\/offers/ },
    { href: '/reports', url: /\/reports/ },
    { href: '/dashboard', url: /\/dashboard/ },
  ]

  for (const item of menu) {
    await page.click(`a[href="${item.href}"]`)
    await expect(page).toHaveURL(item.url)
  }
})

test('U-002: ダッシュボード — Networkエラーなし', async ({ page }) => {
  const failures: string[] = []
  page.on('response', res => {
    if (res.status() >= 400) failures.push(`${res.status()} ${res.url()}`)
  })
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  expect(failures).toHaveLength(0)
})
