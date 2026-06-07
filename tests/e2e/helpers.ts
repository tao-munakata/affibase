import { Page } from '@playwright/test'

export const TEST_USER = {
  email: 'playwright-test@example.com',
  password: 'password123',
  name: 'Playwrightテスト',
}

export async function registerUser(page: Page, user = TEST_USER) {
  await page.goto('/register')
  await page.fill('input[type="text"]', user.name)
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
}

export async function loginUser(page: Page, user = TEST_USER) {
  await page.goto('/login')
  await page.fill('input[type="email"]', user.email)
  await page.fill('input[type="password"]', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')
}

export async function ensureLoggedIn(page: Page, user = TEST_USER) {
  try {
    await loginUser(page, user)
  } catch {
    await registerUser(page, user)
  }
}
