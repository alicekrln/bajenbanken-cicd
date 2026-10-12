import { test, expect } from '@playwright/test'

const password = 'Bajen123'

async function registerAndLogin(page) {
  const username = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  await page.goto('/register')
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'Skapa konto' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'Logga in' }).click()
  await expect(page).toHaveURL(/\/account$/)

  return username
}

test('Inloggning krävs för att nå konto- och transaktionssidan', async ({
  page,
}) => {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/transactions')
  await expect(page).toHaveURL(/\/login$/)
})

test('Ny användare kan sätta in pengar och se nytt saldo', async ({ page }) => {
  await registerAndLogin(page)

  await page.getByLabel('Belopp (kr)').fill('500')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await page.goto('/transactions')
  await expect(page.getByText('Inga insättningar än.')).toBeHidden()
  await expect(page.locator('#transitAmount')).toHaveText('500')
})

test('Historik finns kvar efter omladdning eller ny inloggning', async ({
  page,
}) => {
  const username = await registerAndLogin(page)

  await page.getByLabel('Belopp (kr)').fill('500')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await page.reload()
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await page.goto('/transactions')
  await expect(page.getByText('Inga insättningar än.')).toBeHidden()
  await expect(page.locator('#transitAmount')).toHaveText('500')

  await page.reload()
  await expect(page.getByText('Inga insättningar än.')).toBeHidden()
  await expect(page.locator('#transitAmount')).toHaveText('500')

  await page.getByRole('button', { name: 'Logga ut' }).click()
  await expect(page).toHaveURL(/^https?:\/\/[^\/]+\/$/)

  await page.goto('/login')
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'Logga in' }).click()
  await expect(page).toHaveURL(/\/account$/)
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await page.goto('/transactions')
  await expect(page.getByText('Inga insättningar än.')).toBeHidden()
  await expect(page.locator('#transitAmount')).toHaveText('500')
})

test('Ogiltigt belopp ändrar inte saldo eller historik', async ({ page }) => {
  await registerAndLogin(page)
  await page.getByLabel('Belopp (kr)').fill('-500')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('0')

  await page.goto('/transactions')
  await expect(page.getByText('Inga insättningar än.')).toBeVisible()

  await page.goto('/account')
  await page.getByLabel('Belopp (kr)').fill('femtio')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('0')

  await page.goto('/transactions')
  await expect(page.getByText('Inga insättningar än.')).toBeVisible()
})
