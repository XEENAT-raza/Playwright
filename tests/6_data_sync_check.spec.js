const { test, expect } = require('@playwright/test');
const { SearchPage } = require('../components/Search');
const { CrossProviderChecker } = require('../components/cross_provider_check');

const TEST_ACTIVITIES = [
    'Desert Safari',
    'Burj Khalifa',
    'Dhow Cruise',
    'Aquaventure',
    'Louvre Abu Dhabi',
    'Museum of the Future',
    'Ferrari World',
    'Helicopter Tour',
    'Quad Biking',
    'Skyview Observatory',
    'Yacht Tour',
    'Warner Bros World',
    'Green Planet',
];

test.describe('TourCheckNow - Data Sync / API Health Check Suite', () => {
    test('[TC_SYNC_001] Verify search results exist on TourCheckNow or upstream providers for all activity keywords', async ({ page, browser }) => {
        test.setTimeout(0); // long-running — covers many keywords with cross-provider checks

        const s = new SearchPage(page);
        const checker = new CrossProviderChecker(browser);

        const apiFailures = [];   // data exists upstream, but TourCheckNow shows nothing → API bug
        const trulyEmpty = [];    // no data anywhere → not a bug
        const passed = [];        // TourCheckNow has results

        for (const activity of TEST_ACTIVITIES) {
            await test.step(`Check "${activity}" on TourCheckNow`, async () => {
                await s.navigateToHome();
                await s.executeSearch(activity);

                const noResults = await s.hasNoResults();

                if (!noResults) {
                    console.log(`✅ "${activity}" — results found on TourCheckNow`);
                    passed.push(activity);
                    return;
                }

                console.log(`⚠️ "${activity}" — NO results on TourCheckNow. Checking upstream providers (Booking.com, Groupon, Headout)...`);

                const providerCheck = await checker.checkAllProviders(activity);
                console.log(`   Booking.com: ${providerCheck.booking ? 'HAS DATA' : 'no data'}`);
                console.log(`   Groupon    : ${providerCheck.groupon ? 'HAS DATA' : 'no data'}`);
                console.log(`   Headout    : ${providerCheck.headout ? 'HAS DATA' : 'no data'}`);

                if (providerCheck.anyHasData) {
                    console.log(`❌ [API ERROR] "${activity}" — data EXISTS upstream but TourCheckNow shows NO results. Possible API/sync failure.`);
                    apiFailures.push({ activity, providers: providerCheck });
                } else {
                    console.log(`ℹ️ "${activity}" — no data on TourCheckNow OR any upstream provider. Likely genuinely empty keyword.`);
                    trulyEmpty.push(activity);
                }
            });
        }

        // ─────────────────────────────────────
        // Final summary
        // ─────────────────────────────────────
        console.log(`\n========== DATA SYNC CHECK SUMMARY ==========`);
        console.log(`✅ Passed (results on TourCheckNow): ${passed.length} — ${passed.join(', ') || 'none'}`);
        console.log(`ℹ️ Truly empty (no data anywhere): ${trulyEmpty.length} — ${trulyEmpty.join(', ') || 'none'}`);
        console.log(`❌ API/Sync failures (upstream has data, TourCheckNow doesn't): ${apiFailures.length}`);
        apiFailures.forEach(f => {
            console.log(`   - "${f.activity}" — Booking.com: ${f.providers.booking}, Groupon: ${f.providers.groupon}, Headout: ${f.providers.headout}`);
        });
        console.log(`==============================================\n`);

        // ✅ Fail the test ONLY if there's an API/sync mismatch
        expect(
            apiFailures.length,
            `API/Data sync failure detected for: ${apiFailures.map(f => f.activity).join(', ')}. ` +
            `These keywords have results on upstream providers but TourCheckNow shows none.`
        ).toBe(0);
    });
});