import { defineConfig } from '@playwright/test'

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://51.21.196.203:3000',
    browserName: 'chromium',
  },
})
