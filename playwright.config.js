const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({

  workers:       1,        // ✅ 1 worker so you can follow one test at a time
  fullyParallel: false,    // ✅ run sequentially — easier to follow visually
  timeout:       90000,
  retries:       0,        // ✅ no retries — see the real failure immediately

  reporter: [['html', { open: 'on-failure' }], ['list']],

  use: {
    baseURL:    'https://www.tourchecknow.com',
    headless:   false,     // ✅ show browser — see every click
    slowMo:     500,       // ✅ 500ms between actions — easy to follow
    screenshot: 'on',      // ✅ screenshot every step
    video:      'on',      // ✅ record full video of every test
    trace:      'on',      // ✅ full trace for inspection

    launchOptions: {
      args: ['--disable-dev-shm-usage', '--no-sandbox'], // ✅ reduce chromium crashes
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],                       // ✅ one browser only when watching visually
});