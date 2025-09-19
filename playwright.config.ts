import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['json', { outputFile: 'results.json' }], ['list']],

  /* Global test configuration */
  timeout: 60000, // 1 minute default timeout
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },

  // See https://playwright.dev/docs/api/class-testoptions
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Default viewport - desktop size for consistent testing */
    viewport: { width: 1440, height: 900 },

    /* Navigation timeout */
    navigationTimeout: 30000,

    /* Action timeout */
    actionTimeout: 15000,
    headless: !!process.env.CI,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  /* Save visual comparisons screnshots*/
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',
  // See https://playwright.dev/docs/test-projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'debug',
      use: {
        ...devices['Desktop Chrome'],
        headless: false,
      },
    },
  ],

  // See https://playwright.dev/docs/test-webserver
  webServer: {
    command: 'npm run dev',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },
});
