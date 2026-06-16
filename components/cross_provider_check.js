const { expect } = require('@playwright/test');

class CrossProviderChecker {
    /**
     * @param {import('@playwright/test').Browser} browser
     */
    constructor(browser) {
        this.browser = browser;
    }

    /**
     * Checks if a keyword returns results on Booking.com
     */
    async checkBookingCom(keyword) {
        const context = await this.browser.newContext();
        const page = await context.newPage();
        let hasResults = false;

        try {
            const url = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(keyword)}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(1500);

            const resultCards = page.locator('[data-testid="property-card"], [data-testid="title"], [data-testid="search_results_table"] a');
            const count = await resultCards.count();
            hasResults = count > 0;
        } catch (e) {
            console.log(`  [Cross-Check Warning]: Booking.com check failed for "${keyword}" — ${e.message}`);
        } finally {
            await page.close().catch(() => {});
            await context.close().catch(() => {});
        }

        return hasResults;
    }

    /**
     * Checks if a keyword returns results on Groupon
     */
    async checkGroupon(keyword) {
        const context = await this.browser.newContext();
        const page = await context.newPage();
        let hasResults = false;

        try {
            const url = `https://www.groupon.ae/search?query=${encodeURIComponent(keyword)}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(1500);

            const resultCards = page.locator('a[href*="/deals/"]');
            const count = await resultCards.count();
            hasResults = count > 0;
        } catch (e) {
            console.log(`  [Cross-Check Warning]: Groupon check failed for "${keyword}" — ${e.message}`);
        } finally {
            await page.close().catch(() => {});
            await context.close().catch(() => {});
        }

        return hasResults;
    }

    /**
     * Checks if a keyword returns results on Headout
     */
    async checkHeadout(keyword) {
        const context = await this.browser.newContext();
        const page = await context.newPage();
        let hasResults = false;

        try {
            const url = `https://www.headout.com/search/?q=${encodeURIComponent(keyword)}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(1500);

            const resultCards = page.locator('a[href*="/tours/"], a[href*="/activities/"], [class*="card"] a');
            const count = await resultCards.count();
            hasResults = count > 0;
        } catch (e) {
            console.log(`  [Cross-Check Warning]: Headout check failed for "${keyword}" — ${e.message}`);
        } finally {
            await page.close().catch(() => {});
            await context.close().catch(() => {});
        }

        return hasResults;
    }

    /**
     * ✅ Runs all 3 provider checks SEQUENTIALLY (not parallel) to avoid
     * spawning too many concurrent browser contexts and crashing the worker.
     */
    async checkAllProviders(keyword) {
        const booking = await this.checkBookingCom(keyword);
        const groupon = await this.checkGroupon(keyword);
        const headout = await this.checkHeadout(keyword);

        return {
            booking,
            groupon,
            headout,
            anyHasData: booking || groupon || headout,
        };
    }
}

module.exports = { CrossProviderChecker };