const { test } = require('@playwright/test');
const { SmokePage } = require('../components/smoke_pom');

// 📊 UPDATED LIVE DATA MATRIX: Matches the exact textual layout of your platform
const liveLayoutDataset = [
    { targetFocus: 'Explore Middle East', expectedContent: ['Dubai', 'Abu Dhabi', 'Sharjah'] },
    { targetFocus: 'Browse by Experience', expectedContent: ['Desert Safari', 'Theme Parks', 'Cruises', 'Observation Decks'] }
];

test.describe('TourCheckNow - Homepage Component Content Visual Suite', () => {
    let smokePage;

    test.beforeEach(async ({ page }) => {
        smokePage = new SmokePage(page);
        await smokePage.navigateToHome();
    });

    // =========================================================================
    // 🆔 TC_REG_001: COMPONENT SCROLL AND HOVER INTEGRITY CHECK
    // =========================================================================
    test('[TC_REG_001] Live Component Matrix Loop: Scroll, hover, and verify card section texts', async ({ page }) => {
        test.setTimeout(0); // Protect slowMo visual tracking passes against timeout ceilings

        for (let i = 0; i < liveLayoutDataset.length; i++) {
            const layoutRow = liveLayoutDataset[i];

            await test.step(`TC_REG_001_ITERATION_${i + 1} - Audit Component Section: [ ${layoutRow.targetFocus} ]`, async () => {
                
                // 1. Smoothly scroll viewport tracking directly to the target row component header label
                await smokePage.hoverAndSelectElementManually(layoutRow.targetFocus);
                
                // 2. Loop through and execute manual hover sweeps over cards to verify text markers
                for (const cardText of layoutRow.expectedContent) {
                    await smokePage.hoverAndSelectElementManually(cardText);
                    await smokePage.verifyVisiblePageContent(cardText);
                }

                // 3. ⏳ Manual Observation Hold: Let current row settle for 1.5 seconds before moving to next segment block
                await page.waitForTimeout(1500);
            });
        }
    });
});