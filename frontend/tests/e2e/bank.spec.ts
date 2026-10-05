import test from "@playwright/test";

test('Inloggning krävs för att se kontosida ', async ({ page }) => {
  await page.goto('/account')

})