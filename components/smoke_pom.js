const { expect } = require('@playwright/test');

class SmokePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.navigationHeader = page.locator('header, nav, ul').first();
        this.experienceSection = page.locator('text=Browse by Experience').first();
    }

    async navigateToHome() {
        await this.page.goto('https://www.tourchecknow.com', { 
            waitUntil: 'domcontentloaded', 
            timeout: 25000 
        });
    }

    /**
     * Simulates a human QA tester finding, hovering over, and clicking a top nav button
     */
    async clickHeaderLinkManually(linkText) {
        console.log(`[Manual Action]: Locating header menu link: "${linkText}"`);
        
        const targetLink = this.navigationHeader.locator('a').getByText(linkText, { exact: true }).first();
        await targetLink.waitFor({ state: 'visible', timeout: 10000 });
        
        await targetLink.hover();
        await this.page.waitForTimeout(500); 
        
        await targetLink.click();
        await this.page.waitForLoadState('domcontentloaded');
    }

    /**
     * Scrolls smoothly down to any targeted text asset element on screen layout
     */
    async hoverAndSelectElementManually(elementText) {
        console.log(`[Manual Action]: Scrolling viewport to locate asset element text: "${elementText}"`);
        
        // Target text match element dynamically anywhere on current view canvas
        const targetElement = this.page.locator(`text="${elementText}"`).first();
        
        // Scroll view safely to focus coordinate lines
        await targetElement.scrollIntoViewIfNeeded({ timeout: 8000 });
        await targetElement.waitFor({ state: 'visible', timeout: 5000 });
        
        // Highlight element border using QA marker style before mouse hover actions
        await targetElement.evaluate(el => {
            el.style.outline = '2px dashed #2ed573';
        });
        
        await targetElement.hover();
        await this.page.waitForTimeout(1000); // Allow human to witness the mouse positioning
    }

    /**
     * Manual tester verification sweep to confirm expected text strings appear on the UI canvas
     */
    async verifyVisiblePageContent(expectedContentText) {
        console.log(`[Validation Engine]: Sweeping viewport layers for text string referencing: "${expectedContentText}"`);
        
        const explicitMatchLocator = this.page.locator(`text=${expectedContentText}`).locator('visible=true');
        
        try {
            await explicitMatchLocator.first().waitFor({ state: 'visible', timeout: 10000 });
            const count = await explicitMatchLocator.count();
            console.log(`[Success]: Verified visual existence displaying: "${expectedContentText}".`);
            expect(count).toBeGreaterThan(0);
            
        } catch (error) {
            console.log(`[Analysis Deficit]: Target string "${expectedContentText}" not visibly found. Taking manual QA snapshot...`);
            const errorSnapshotPath = `failure-smoke-${expectedContentText.replace(/\s+/g, '-')}.png`;
            await this.page.screenshot({ path: errorSnapshotPath });
            
            expect(false).toBe(true);
        }
    }
}

module.exports = { SmokePage };