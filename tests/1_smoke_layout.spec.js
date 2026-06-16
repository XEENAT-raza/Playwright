const { test, expect } = require('@playwright/test');
const { SmokePage } = require('../components/smoke_pom');

const headerMenus = ['Destinations', 'Deals', 'Categories', 'Blog'];

test.describe('TourCheckNow - Human Simulation Smoke Suite', () => {
    let smokePage;

    test.beforeEach(async ({ page }) => {
        smokePage = new SmokePage(page);
        await smokePage.navigateToHome();
    });

    // =========================================================================
    // 🆔 TC_SMK_001: HEADER LINK CLICK AND VISUAL CONFIRMATION LOOP
    // =========================================================================
    test('[TC_SMK_001] Visual Header Loop: Click and observe every single top header link', async ({ page }) => {
        test.setTimeout(0); // Protect slowMo presentations against limits

        for (let i = 0; i < headerMenus.length; i++) {
            const menuLabel = headerMenus[i];

            await test.step(`TC_SMK_001_ITERATION_${i + 1} - Click and Observe Navigation Target: [ ${menuLabel} ]`, async () => {
                
                // 1. Hover and physically click the header navigation option link on your screen
                await smokePage.clickHeaderLinkManually(menuLabel);

                // 2. Safety verification check to make sure the app didn't throw a crash title
                await expect(page).not.toHaveTitle(/Runtime Error|500|Crash/i);
                console.log(`[QA Observation URL]: Currently witnessing page location path: ${page.url()}`);

                // 3. ⏳ Manual Observation Pause: Hold frame for 2 seconds so human eyes can review the page paint
                await page.waitForTimeout(2000);

                // 4. Reset path coordinates back to homepage base so the loop can hit the next menu item cleanly
                await smokePage.navigateToHome();
            });
        }
    });
});