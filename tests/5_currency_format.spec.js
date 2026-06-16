const { test, expect } = require('@playwright/test');
const { AffiliatePage } = require('../components/affiliate_pom');
const { SearchPage } = require('../components/Search');

const CURRENCIES_TO_TEST = ['AED', 'USD', 'EUR', 'GBP', 'INR'];
const TEST_ACTIVITIES = ['city tour', 'Desert Safari', 'Burj Khalifa'];

test.describe('TourCheckNow - Currency Format Verification Suite', () => {
    let affiliatePage;

    test.beforeEach(async ({ page }) => {
        affiliatePage = new AffiliatePage(page);
        await test.step('Navigate to TourCheckNow homepage', async () => {
            await affiliatePage.navigateToHome();
        });
    });

    // =========================================================================
    // ✅ POSITIVE: Selected currency is correctly displayed on homepage
    // Includes VISUAL scroll-through with on-screen highlighting
    // =========================================================================
    for (const currency of CURRENCIES_TO_TEST) {
        test(`[TC_CUR_POS] Selecting "${currency}" displays correct currency format on homepage`, async () => {
            test.setTimeout(90000);

            await affiliatePage.changeCurrencyManually(currency);

            await test.step(`Verify "${currency}" symbol/code appears on page`, async () => {
                const expectedSymbols = AffiliatePage.getExpectedSymbols(currency);
                const bodyText = await affiliatePage.page.locator('body').innerText();

                const foundExpected = expectedSymbols.some(symbol =>
                    bodyText.includes(symbol)
                );

                expect(
                    foundExpected,
                    `Expected one of [${expectedSymbols.join(', ')}] to appear on page after selecting "${currency}", but none were found`
                ).toBe(true);
            });

            // ✅ Visual scroll + highlight so QA can SEE the conversion live
            await affiliatePage.visuallyVerifyCurrencyAcrossPage(currency);
        });
    }

    // =========================================================================
    // ❌ NEGATIVE: Homepage doesn't show mismatched/wrong currency symbols
    // =========================================================================
    for (const currency of CURRENCIES_TO_TEST) {
        test(`[TC_CUR_NEG] Selecting "${currency}" does NOT show prices in other currencies on homepage`, async () => {
            test.setTimeout(60000);

            await affiliatePage.changeCurrencyManually(currency);

            await test.step(`Scan homepage for mismatched currency symbols`, async () => {
                const allTags = await affiliatePage.getDisplayedCurrencyTags();
                const mismatched = await affiliatePage.findMismatchedCurrencyTags(currency);

                console.log(`All detected currency tags: ${JSON.stringify(allTags)}`);
                console.log(`Mismatched tags: ${JSON.stringify(mismatched)}`);

                expect(
                    mismatched.length,
                    `Found mismatched currency symbols ${JSON.stringify(mismatched)} on homepage after selecting "${currency}"`
                ).toBe(0);
            });
        });
    }

    // =========================================================================
    // 🆕 NEW: After selecting a currency, search activities and verify
    // EACH result card shows prices in the SELECTED currency —
    // catches per-provider cards showing their own native currency
    // (e.g. Booking.com card shows AED, Headout card shows EUR, even
    // though user selected INR — breaks UI consistency)
    // =========================================================================
    for (const currency of CURRENCIES_TO_TEST) {
        test(`[TC_CUR_CARD] After selecting "${currency}", all activity cards show "${currency}" — not provider's native currency`, async ({ page }) => {
            test.setTimeout(0);

            const s = new SearchPage(page);
            const expectedSymbols = AffiliatePage.getExpectedSymbols(currency);

            // 1. Select currency on homepage
            await affiliatePage.changeCurrencyManually(currency);
            console.log(`\n✅ Currency set to "${currency}" — expecting symbols: [${expectedSymbols.join(', ')}]\n`);

            const allMismatches = [];

            // 2. Search each activity and check EVERY card's currency
            for (const activity of TEST_ACTIVITIES) {
                await test.step(`Search "${activity}" and verify each card shows "${currency}"`, async () => {
                    await s.executeSearch(activity);

                    const total = await s.bookNowLinks.count();
                    if (total === 0) {
                        console.log(`⚠️ "${activity}" — no results, skipping`);
                        return;
                    }

                    const { results, mismatched } = await s.checkEachCardCurrency(expectedSymbols);

                    console.log(`\n--- "${activity}" — checked ${results.length} card(s) ---`);
                    results.forEach(r => {
                        const status = r.matchesExpected ? '✅' : '❌';
                        console.log(`  ${status} Card #${r.index + 1}: currencies found = [${r.currenciesFound.join(', ')}] | "${r.cardText}"`);
                    });

                    if (mismatched.length > 0) {
                        console.log(`\n❌ "${activity}" — ${mismatched.length}/${results.length} card(s) NOT showing "${currency}":`);
                        mismatched.forEach(m => {
                            console.log(`   Card #${m.index + 1}: found [${m.currenciesFound.join(', ')}] — "${m.cardText}"`);
                        });
                        allMismatches.push({ activity, mismatched });
                    } else {
                        console.log(`✅ "${activity}" — all ${results.length} card(s) correctly show "${currency}"`);
                    }

                    // Clear search field for next activity (avoid full page reload which resets currency)
                    await s.clearSearchField();
                    await page.waitForTimeout(500);
                });
            }

            // 3. Final summary + assertion
            console.log(`\n========== PER-CARD CURRENCY CONSISTENCY SUMMARY (${currency}) ==========`);
            console.log(`Activities with currency-mismatched cards: ${allMismatches.length}`);
            allMismatches.forEach(a => {
                console.log(`  - "${a.activity}": ${a.mismatched.length} mismatched card(s)`);
            });
            console.log(`========================================================================\n`);

            expect(
                allMismatches.length,
                `UI currency consistency bug: after selecting "${currency}", the following activities show cards in ` +
                `OTHER currencies (provider's native currency instead of selected "${currency}"): ` +
                `${allMismatches.map(a => `${a.activity} (${a.mismatched.length} card(s))`).join(', ')}`
            ).toBe(0);
        });
    }
});