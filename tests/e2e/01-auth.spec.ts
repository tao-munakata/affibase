import { test, expect } from '@playwright/test'
import { TEST_USER, loginUser, registerUser } from './helpers'

// ─── 正常系 ───────────────────────────────────────────────────────────────────

test('T-001: ルートアクセス → /login にリダイレクト', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
})

test('T-004: 新規登録 → /dashboard に遷移', async ({ page }) => {
  const unique = `test-${Date.now()}@example.com`
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テストユーザー')
  await page.fill('input[type="email"]', unique)
  await page.fill('input[type="password"]', 'password123')

  const consoleErrors: string[] = []
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })

  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  expect(consoleErrors).toHaveLength(0)
})

test('T-002: ログイン成功 → /dashboard に遷移', async ({ page }) => {
  await loginUser(page)
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.locator('h1, h2').first()).toBeVisible()
})

test('T-003: ログイン後に /login アクセス → /dashboard にリダイレクト', async ({ page }) => {
  await loginUser(page)
  await page.goto('/login')
  await expect(page).toHaveURL(/\/dashboard/)
})

test('T-005: ログアウト → /login に遷移', async ({ page }) => {
  await loginUser(page)
  await page.click('button:has-text("ログアウト")')
  await expect(page).toHaveURL(/\/login/)
})

test('T-006: 未ログインで /dashboard → /login にリダイレクト', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})

test('T-007: 未ログインで /sites → /login にリダイレクト', async ({ page }) => {
  await page.goto('/sites')
  await expect(page).toHaveURL(/\/login/)
})

// ─── 異常系 ───────────────────────────────────────────────────────────────────

test('E-001: ログイン — メールアドレス空欄 → バリデーションエラー', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/正しいメールアドレスを入力してください/')
  await expect(error).toBeVisible()
})

test('E-002: ログイン — パスワード7文字 → バリデーションエラー', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', '1234567')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/8文字以上で入力してください/')
  await expect(error).toBeVisible()
})

test('E-003: ログイン — 存在しないメール → エラーメッセージ表示', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', 'notexist@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/ログインに失敗しました/')
  await expect(error).toBeVisible()
})

test('E-004: ログイン — 誤パスワード → エラーメッセージ表示', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', 'wrongpassword')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/ログインに失敗しました/')
  await expect(error).toBeVisible()
})

test('E-005: 新規登録 — 名前空欄 → バリデーションエラー', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[type="email"]', 'test@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/名前を入力してください/')
  await expect(error).toBeVisible()
})

test('E-006: 新規登録 — 不正形式メール → バリデーションエラー', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テスト')
  await page.fill('input[type="email"]', 'invalid-email')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/正しいメールアドレスを入力してください/')
  await expect(error).toBeVisible()
})

test('E-007: 新規登録 — 登録済みメール → エラーメッセージ表示', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テスト')
  await page.fill('input[type="email"]', TEST_USER.email)
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/すでに登録されています|登録に失敗しました/')
  await expect(error).toBeVisible()
})

test('E-008: 新規登録 — パスワード7文字 → バリデーションエラー', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テスト')
  await page.fill('input[type="email"]', 'test2@example.com')
  await page.fill('input[type="password"]', '1234567')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/8文字以上で入力してください/')
  await expect(error).toBeVisible()
})

// ─── 境界値 ───────────────────────────────────────────────────────────────────

test('B-001: パスワード8文字ちょうどで登録成功', async ({ page }) => {
  const unique = `boundary-${Date.now()}@example.com`
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テスト')
  await page.fill('input[type="email"]', unique)
  await page.fill('input[type="password"]', '12345678')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
})

test('B-002: パスワード7文字で登録失敗', async ({ page }) => {
  await page.goto('/register')
  await page.fill('input[type="text"]', 'テスト')
  await page.fill('input[type="email"]', `b7-${Date.now()}@example.com`)
  await page.fill('input[type="password"]', '1234567')
  await page.click('button[type="submit"]')
  const error = page.locator('text=/8文字以上で入力してください/')
  await expect(error).toBeVisible()
})
