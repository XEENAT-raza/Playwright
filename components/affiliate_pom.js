const { test, expect } = require('@playwright/test');

class AffiliatePage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // 🎯 CURRENCY SELECTOR BUTTON (confirmed via DOM inspection)
        this.currencySelectorBtn = page.getByTestId('home-travel-shared-components-button-3').first();

        // 📱 MOBILE HAMBURGER BACKUP: Targets hamburger dropdown if desktop element goes responsive hidden
        this.mobileMenuBtn = page.locator('button[class*="hamburger"], button[aria-label*="menu"], .menu-toggle').first();

        // Target affiliate cards
        this.productDealCards = page.locator('a[href*="/activity/"], a:has-text("via"), [class*="activity-card"] a').locator('visible=true');
    }

    async navigateToHome() {
        await this.page.goto('https://www.tourchecknow.com', {
            waitUntil: 'domcontentloaded',
            timeout: 25000
        });
        await this.page.waitForTimeout(500);
    }

    /**
     * Smart selector execution: Handles both desktop layout or mobile menus seamlessly
     */
    async changeCurrencyManually(currencyCode) {
        await test.step(`Open currency selector dropdown`, async () => {
            console.log(`[Manual Action]: Checking platform display layout to interact with currency options...`);

            const isDesktopVisible = await this.currencySelectorBtn.isVisible();

            if (!isDesktopVisible && await this.mobileMenuBtn.isVisible()) {
                console.log(`[Responsive Alert]: Operating in Mobile View. Activating hamburger menu wrapper first...`);
                await this.mobileMenuBtn.hover();
                await this.mobileMenuBtn.click();
                await this.page.waitForTimeout(500);
            }

            const targetTrigger = isDesktopVisible ? this.currencySelectorBtn : this.page.getByText(/USD|AED/i).first();
            await targetTrigger.waitFor({ state: 'visible', timeout: 10000 });
            await targetTrigger.hover();
            await targetTrigger.click();
            await this.page.waitForTimeout(500);
        });

        await test.step(`Click "${currencyCode}" option in dropdown`, async () => {
            const optionItem = this.page.locator('div, li, button, span')
                .filter({ hasText: new RegExp(`\\b${currencyCode}\\b`) })
                .last();

            await optionItem.waitFor({ state: 'visible', timeout: 8000 });

            await optionItem.evaluate(el => {
                el.style.border = '2px solid #2e86de';
                el.style.backgroundColor = 'rgba(46, 134, 222, 0.2)';
            });
            await this.page.waitForTimeout(400);
            await optionItem.click();
            await this.page.waitForTimeout(1500); // allow currency conversion to finish rendering
        });
    }

    /**
     * Scrapes active view grids to confirm total body text value updates
     */
    async verifyVisiblePriceFormat(expectedSymbol) {
        console.log(`[Validation Engine]: Checking active page view for price notation pattern: "${expectedSymbol}"`);

        const bodyContent = this.page.locator('body');
        const visibleTextDump = await bodyContent.innerText();

        const sampleDealTag = this.productDealCards.first();
        if (await sampleDealTag.isVisible()) {
            await sampleDealTag.evaluate(el => el.style.outline = '3px solid #ff9f43');
        }

        console.log(`[QA Observation]: Scanning web layout text for target symbol presence...`);
        expect(visibleTextDump.toLowerCase()).toContain(expectedSymbol.toLowerCase());
        await this.page.waitForTimeout(500);
    }

    /**
     * ✅ NEW: Visually scrolls through the page after a currency change,
     * highlighting every price tag that matches the expected currency
     * so a manual QA watching the browser can SEE the conversion applied
     * across cards, not just confirm it via assertion.
     */
    async visuallyVerifyCurrencyAcrossPage(currencyCode) {
        const expectedSymbols = AffiliatePage.getExpectedSymbols(currencyCode);

        // Build a regex that matches any of the expected symbols (escaped for regex)
        const escaped = expectedSymbols.map(s => s.replace(/[.*+?^${}()|[\]\\$]/g, '\\$&'));
        const pattern = new RegExp(`(${escaped.join('|')})`);

        await test.step(`Scroll page and visually highlight all "${currencyCode}" price tags`, async () => {
            console.log(`[Visual QA]: Scrolling through page to highlight prices shown in "${currencyCode}"...`);

            // Get total scroll height
            const scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);
            const viewportHeight = await this.page.evaluate(() => window.innerHeight);
            const steps = Math.ceil(scrollHeight / viewportHeight);

            let highlightedCount = 0;

            for (let i = 0; i <= steps; i++) {
                // Scroll down step by step so QA can visually track progress
                await this.page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), i * viewportHeight);
                await this.page.waitForTimeout(700); // pause so scroll + highlight is visible

                // Highlight every element in the current viewport whose text matches the expected currency
                const countThisStep = await this.page.evaluate((patternSrc) => {
                    const re = new RegExp(patternSrc);
                    const candidates = document.querySelectorAll('span, div, p, h1, h2, h3, h4, a, li');
                    let count = 0;

                    candidates.forEach(el => {
                        // Only check leaf-ish elements (avoid highlighting giant wrapper divs)
                        if (el.children.length > 2) return;

                        const text = el.textContent || '';
                        if (re.test(text) && text.trim().length < 40) {
                            const rect = el.getBoundingClientRect();
                            const inViewport = rect.top >= 0 && rect.top <= window.innerHeight && rect.width > 0;

                            if (inViewport) {
                                el.style.outline = '2px solid #27ae60';
                                el.style.backgroundColor = 'rgba(39, 174, 96, 0.15)';
                                el.style.transition = 'all 0.3s ease';
                                count++;
                            }
                        }
                    });

                    return count;
                }, pattern.source);

                highlightedCount += countThisStep;
                console.log(`  [Visual QA] Step ${i + 1}/${steps + 1}: highlighted ${countThisStep} "${currencyCode}" price tag(s) in current view`);

                await this.page.waitForTimeout(600); // let QA see the highlights before next scroll
            }

            console.log(`[Visual QA Summary]: Total "${currencyCode}" price tags highlighted across page: ${highlightedCount}`);

            // Scroll back to top for next steps/tests
            await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
            await this.page.waitForTimeout(500);

            expect(
                highlightedCount,
                `No price tags matching "${currencyCode}" (${expectedSymbols.join(', ')}) were found anywhere on the page`
            ).toBeGreaterThan(0);
        });
    }

    /**
     * Product card pop-up tab redirection check
     */
    async testExternalAffiliateRedirect() {
        console.log('[Manual Action]: Positioning cursor onto first product deal link...');

        const targetDealItem = this.productDealCards.first();
        await targetDealItem.waitFor({ state: 'visible', timeout: 10000 });
        await targetDealItem.scrollIntoViewIfNeeded();

        // ✅ Hydration gate: wait until the link has a real href before clicking
        const handle = await targetDealItem.elementHandle();
        if (handle) {
            await this.page.waitForFunction(
                (el) => {
                    const href = el.getAttribute('href') || '';
                    return href && href !== '#' && href !== 'javascript:void(0)';
                },
                handle,
                { timeout: 10000 }
            ).catch(() => {});
        }

        await targetDealItem.evaluate(el => el.style.outline = '3px solid #8e44ad');
        await targetDealItem.hover();
        await this.page.waitForTimeout(500);

        const target = await targetDealItem.getAttribute('target') || '';
        let finalRedirectUrl = '';

        if (target === '_blank') {
            try {
                const [popupWindow] = await Promise.all([
                    this.page.context().waitForEvent('page', { timeout: 12000 }),
                    targetDealItem.click()
                ]);

                await popupWindow.waitForLoadState('commit').catch(() => {});
                finalRedirectUrl = popupWindow.url();
                console.log(`[Redirection Log Success]: External affiliate window spawned. Destination URL: ${finalRedirectUrl}`);

                expect(finalRedirectUrl).not.toContain('404');
                expect(finalRedirectUrl).not.toContain('error');

                await popupWindow.waitForTimeout(1000);
                await popupWindow.close();
            } catch (e) {
                console.log(`[Warning]: No popup window detected within timeout — checking same-tab navigation instead.`);
                finalRedirectUrl = await this._handleSameTabRedirect(targetDealItem);
            }
        } else {
            finalRedirectUrl = await this._handleSameTabRedirect(targetDealItem);
        }

        return finalRedirectUrl;
    }

    /**
     * Fallback: handles deal links that navigate the current tab instead of opening a new one
     */
    async _handleSameTabRedirect(targetDealItem) {
        const currentUrl = this.page.url();

        try {
            await Promise.all([
                this.page.waitForNavigation({ timeout: 10000 }).catch(() => null),
                targetDealItem.click(),
            ]);
            await this.page.waitForLoadState('domcontentloaded').catch(() => {});
            await this.page.waitForTimeout(1000);

            const newUrl = this.page.url();

            if (newUrl !== currentUrl) {
                console.log(`[Redirection Log Success]: Same-tab navigation detected. Destination URL: ${newUrl}`);

                expect(newUrl).not.toContain('404');
                expect(newUrl).not.toContain('error');

                await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
                await this.page.waitForTimeout(500);
                return newUrl;
            }
        } catch (e) {
            // ignore
        }

        return currentUrl;
    }

    /**
     * Scrapes all visible price tags on activity cards and returns their currency symbols/codes
     */
    async getDisplayedCurrencyTags() {
        const currencyPattern = /(AED|USD|EUR|GBP|INR|SAR|AUD|CAD|SGD|PKR|A\$|C\$|S\$|د\.إ|ر\.س|Rs|\$|€|£|₹)/g;

        const bodyText = await this.page.locator('body').innerText();
        const matches = bodyText.match(currencyPattern) || [];

        return [...new Set(matches)];
    }

    /**
     * Maps a currency code to its expected display symbol(s)
     */
    static getExpectedSymbols(currencyCode) {
        const map = {
            AED: ['AED', 'د.إ'],
            USD: ['USD', '$'],
            EUR: ['EUR', '€'],
            GBP: ['GBP', '£'],
            INR: ['INR', '₹'],
            SAR: ['SAR', 'ر.س'],
            AUD: ['AUD', 'A$'],
            CAD: ['CAD', 'C$'],
            SGD: ['SGD', 'S$'],
            PKR: ['PKR', 'Rs'],
        };
        return map[currencyCode] || [currencyCode];
    }

    /**
     * Returns true if any price on the page uses a currency symbol/code
     * that does NOT belong to the expected currency
     */
    async findMismatchedCurrencyTags(expectedCurrencyCode) {
        const expectedSymbols = AffiliatePage.getExpectedSymbols(expectedCurrencyCode);
        const allTags = await this.getDisplayedCurrencyTags();

        const mismatched = allTags.filter(tag => !expectedSymbols.includes(tag));
        return mismatched;
    }
}

module.exports = { AffiliatePage };