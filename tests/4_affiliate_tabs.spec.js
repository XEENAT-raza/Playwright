const { test } = require('@playwright/test');
const { AffiliatePage } = require('../components/affiliate_pom');

test.describe('TourCheckNow - Affiliate Monetization Visual Integration Suite', () => {
    let affiliatePage;

    test.beforeEach(async ({ page }) => {
        affiliatePage = new AffiliatePage(page);
        await affiliatePage.navigateToHome();
    });

    // =========================================================================
    // 🆔 TC_AFF_001: VISUAL CURRENCY CONVERSION DROPDOWN CHECK
    // =========================================================================
    test('[TC_AFF_001] Live Currency Run: Swap pricing metrics between AED and USD contexts', async () => {
        test.setTimeout(0); // Protect slowMo transitions from execution limits

        // 1. Interact with header settings layout to apply United Arab Emirates currency tags
        await affiliatePage.changeCurrencyManually('AED');
        await affiliatePage.verifyVisiblePriceFormat('AED');

        // 2. Re-trigger change to roll the platform back to global US Dollar context mapping rules
        await affiliatePage.changeCurrencyManually('USD');
        await affiliatePage.verifyVisiblePriceFormat('$');
    });

    // =========================================================================
    // 🆔 TC_AFF_002: REFERRAL TRACKING POP-UP INTERACTION AUDIT
    // =========================================================================
    test('[TC_AFF_002] Link Integrity Run: Click card deal link and follow redirection tab window', async () => {
        test.setTimeout(0);

        // Executes a manual-style pointer jump, boxes the target card, fires the click event,
        // follows the affiliate tracking bounce into a secondary tab window view live on screen!
        await affiliatePage.testExternalAffiliateRedirect();
    });
});