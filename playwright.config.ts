import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

// The HTML report carries the traces, so it is written on CI as well as
// locally. A red run whose uploaded artifact is empty costs a whole round trip
// to reproduce, and this repository is developed where its toolchain does not
// run. `github` stands beside it to put failures on the job page.
const html: ReporterDescription = ['html', { open: 'never' }];
const github: ReporterDescription = ['github'];

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
  /*
   * Six sizes of forty-odd tests is two hundred and seventy runs, and a runner
   * has four cores. Left to Playwright's default of half the cores it uses two
   * of them and a green suite takes ten minutes; a broken one takes half an
   * hour, because every failure is thirty seconds three times over.
   *
   * `maxFailures` is the part that matters. A suite that is broken is broken
   * after ten failures, and grinding through the remaining two hundred proves
   * nothing that the first ten did not — it only decides whether the answer
   * arrives in four minutes or in twenty-five.
   */
  workers: process.env.CI ? 4 : undefined,
  maxFailures: process.env.CI ? 10 : 0,
  // `open: 'never'` because the HTML reporter otherwise starts a server and
  // waits after a failure, which in a Codespace looks exactly like a hung test
  // run. The report is still written; open it yourself with `npx playwright
  // show-report`.
  reporter: process.env.CI ? [github, html] : [html],
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
