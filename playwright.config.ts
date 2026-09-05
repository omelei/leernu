import { defineConfig, devices } from '@playwright/test';

// The two devices that matter in a Dutch classroom. The Chromebook viewport is
// the one from spec section 8; testing at a generic desktop size would hide the
// layout problems that actually occur on school hardware.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    locale: 'nl-NL',
  },
  projects: [
    {
      name: 'chromebook',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'ipad',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
