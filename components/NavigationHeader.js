const { expect, test } = require('@playwright/test');

class NavigationHeader {
    constructor(page) {
        this.page = page;
        this.brandLogo = page.getByRole('heading', { name: /TourChecknow/i });
        this.currencyDropdown = page.locator('button:has-text("USD"), button:has-text("AED"), .currency-selector').first();
    }

    async manualStep({ action, expected }, actionFn) {
        return await test.step(`▶ ACTION: ${action}\n  ↳ EXPECTED: ${expected}`, actionFn);
    }

    async navigateToHome() {
        return this.manualStep({
            action: 'Launch the TourCheckNow application portal link.',
            expected: 'The web app homepage initializes successfully and structural components load.'
        }, async () => {
            await this.page.goto('/', { waitUntil: 'domcontentloaded' });
        });
    }

    async switchCurrency(currencyCode) {
        return this.manualStep({
            action: `Click the currency configuration dropdown and select [ ${currencyCode} ].`,
            expected: `The system updates local session records and toggles active pricing contexts globally.`
        }, async () => {
            await this.currencyDropdown.waitFor({ state: 'visible' });
            await this.currencyDropdown.click();
            const targetOption = this.page.locator(`text=${currencyCode}, [data-value="${currencyCode}"]`).first();
            await targetOption.click();
            await this.page.waitForTimeout(1000); // Allow dynamic values to sync
        });
    }
}

module.exports = { NavigationHeader };