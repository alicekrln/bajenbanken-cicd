import { test, expect } from '@playwright/test'

const password = 'Bajen123'
const API_URL = process.env.API_URL || 'http://localhost:3001'

function uniqueUsername() {
  return `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`
}

async function login(page, username) {
  await page.goto('/login')
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'Logga in' }).click()
  await expect(page).toHaveURL(/\/account$/)
}

async function registerAndLogin(page) {
  const username = uniqueUsername()

  await page.goto('/register')
  await page.getByLabel('username').fill(username)
  await page.getByLabel('password').fill(password)
  await page.getByRole('button', { name: 'Skapa konto' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await login(page, username)
  return username
}

async function goToHistory(page) {
  await page.getByRole('link', { name: 'Se kontohistorik' }).click()
  await expect(page).toHaveURL(/\/transactions$/)
}

async function goToAccount(page) {
  await page.getByRole('link', { name: 'Tillbaka till kontoöversikt' }).click()
  await expect(page).toHaveURL(/\/account$/)
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

  await goToHistory(page)
  await expect(page.getByText('Inga insättningar än.')).toBeHidden()
  await expect(page.locator('#transitAmount')).toHaveText('500')
})

test('Omladdning och utloggning kräver ny inloggning, historiken finns kvar', async ({
  page,
}) => {
  const username = await registerAndLogin(page)

  await page.getByLabel('Belopp (kr)').fill('500')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await page.reload()
  await expect(page).toHaveURL(/\/login$/)

  await login(page, username)
  await expect(page.locator('#yourBalance')).toHaveText('500')

  await goToHistory(page)
  await expect(page.locator('#transitAmount')).toHaveText('500')

  await page.getByRole('button', { name: 'Logga ut' }).click()
  await expect(page).toHaveURL(/\/login$/)

  await page.goto('/account')
  await expect(page).toHaveURL(/\/login$/)

  await login(page, username)
  await expect(page.locator('#yourBalance')).toHaveText('500')
})

test('Ogiltigt belopp ändrar inte saldo eller historik', async ({ page }) => {
  await registerAndLogin(page)

  await page.getByLabel('Belopp (kr)').fill('-500')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('0')

  await goToHistory(page)
  await expect(page.getByText('Inga insättningar än.')).toBeVisible()

  await goToAccount(page)
  await page.getByLabel('Belopp (kr)').fill('femtio')
  await page.getByRole('button', { name: 'Sätt in' }).click()
  await expect(page.locator('#yourBalance')).toHaveText('0')

  await goToHistory(page)
  await expect(page.getByText('Inga insättningar än.')).toBeVisible()
})

test('API: giltig Bearer-token fungerar, saknad eller ändrad token nekas', async ({
  request,
}) => {
  const username = uniqueUsername()

  const registerRes = await request.post(`${API_URL}/users`, {
    data: { username, password },
  })
  expect(registerRes.status()).toBe(201)

  const wrongLogin = await request.post(`${API_URL}/sessions`, {
    data: { username, password: 'fel-losenord' },
  })
  expect(wrongLogin.status()).toBe(401)
  expect(await wrongLogin.json()).not.toHaveProperty('token')

  const loginRes = await request.post(`${API_URL}/sessions`, {
    data: { username, password },
  })
  expect(loginRes.status()).toBe(200)
  const { token } = await loginRes.json()
  expect(token.split('.')).toHaveLength(3)

  const validRes = await request.post(`${API_URL}/me/accounts`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(validRes.status()).toBe(200)
  expect(await validRes.json()).toEqual({ amount: 0 })

  const missingRes = await request.post(`${API_URL}/me/accounts`)
  expect(missingRes.status()).toBe(401)

  const [header, payload, signature] = token.split('.')
  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
  const otherUserId = String(Number(decoded.sub) + 1)
  const tamperedPayload = Buffer.from(
    JSON.stringify({ ...decoded, sub: otherUserId }),
  ).toString('base64url')
  const tamperedToken = `${header}.${tamperedPayload}.${signature}`

  const tamperedRes = await request.post(`${API_URL}/me/accounts`, {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  })
  expect(tamperedRes.status()).toBe(401)

  const bodyTokenRes = await request.post(`${API_URL}/me/accounts`, {
    data: { token },
  })
  expect(bodyTokenRes.status()).toBe(401)
})
