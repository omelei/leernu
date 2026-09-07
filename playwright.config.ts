import { defineConfig, devices } from '@playwright/test';

// The five sizes of the app design, because §D gives each of them a different
// navigation model and the difference between them is where layout breaks.
//
// 1366 is the Chromebook of spec section 8 and the size that must fit a whole
// round inside 768 of height. 1024 and 768 are the same iPad turned over, and
// they are not one case: landscape puts the vraagbalk beside the canvas and
// portrait puts it above. 393 is iOS and 412 is the Android delta, which is not
// a rounding difference — it is edge-to-edge under the system bars, a 48px
// navigation bar, and no back button of our own.
//
// WebKit for the iPad on purpose: an iPad in a classroom is Safari, and the
// layout problems only WebKit shows are the ones a school hits first.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // `open: 'never'` because the HTML reporter otherwise starts a server and
  // waits after a failure, which in a Codespace looks exactly like a hung test
  // run. The report is still written; open it yourself with `npx playwright
  // show-report`.
  reporter: process.env.CI ? 'github' : [['html', { open: 'never' }]],
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
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'ipad-landscape',
      use: { ...devices['iPad (gen 7) landscape'] },
    },
    {
      name: 'ipad-portrait',
      use: { ...devices['iPad (gen 7)'] },
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 14 Pro'] },
    },
    {
      name: 'android',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
