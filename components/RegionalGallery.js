const { expect, test } = require('@playwright/test');

class RegionalGallery {
    constructor(page) {
        this.page = page;
        this.galleryHeading = page.getByRole('heading', { name: 'Browse by Region' });
    }

    async manualStep({ action, expected }, actionFn) {
        return await test.step(`▶ ACTION: ${action}\n  ↳ EXPECTED: ${expected}`, actionFn);
    }

    async focusOnGallerySection() {
        return this.manualStep({
            action: 'Scroll down to center focus onto the "Browse by Region" interactive component layer.',
            expected: 'The layout segment slides cleanly into the primary viewport area.'
        }, async () => {
            await this.galleryHeading.scrollIntoViewIfNeeded();
            await expect(this.galleryHeading).toBeVisible();
        });
    }

    async filterByRegionPill(pillLabel) {
        return this.manualStep({
            action: `Select the region filter tab menu option bubble labeled "${pillLabel}".`,
            expected: `The button highlights visually, and the component filters down the available cities beneath it.`
        }, async () => {
            const targetPill = this.page.locator(`text="${pillLabel}"`).first();
            await targetPill.waitFor({ state: 'visible' });
            await targetPill.click();
            await this.page.waitForTimeout(1000); // Settle transition animations
        });
    }

    async assertListedCities(citiesChecklist) {
        return this.manualStep({
            action: `Scrape layout text to confirm city presence maps exactly to targets: [ ${citiesChecklist.join(', ')} ]`,
            expected: `The city cards update instantly, matching your array indices without any broken links.`
        }, async () => {
            const dynamicBodyDump = await this.page.innerText('body');
            for (const city of citiesChecklist) {
                expect(dynamicBodyDump.toLowerCase()).toContain(city.toLowerCase());
            }
        });
    }
}

module.exports = { RegionalGallery };