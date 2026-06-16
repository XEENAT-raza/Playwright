const { test, expect } = require('@playwright/test');
const { SearchPage } = require('../components/Search');

const TEST_ACTIVITIES = [
  'Desert Safari',
    'Burj Khalifa',
    'Dhow Cruise',
    'Aquaventure',
    'Louvre Abu Dhabi',
];

const SAMPLE_SIZE     = 5;
const KNOWN_PROVIDERS = ['Booking.com', 'Groupon', 'Headout'];

test.describe('Search — Card Functionality Tests', () => {
  // Increased suite-wide timeout since it is now opening and loading heavy external pages
  test.setTimeout(120000); 

  // ─────────────────────────────────────
  // TC_SRH_001 — Search redirects (Multi-Location Check)
  // ─────────────────────────────────────
  const TEST_LOCATIONS = ['Abu Dhabi', 'Dubai','Sharjah'];

  for (const location of TEST_LOCATIONS) {
    test(`TC_SRH_001 | Search redirects to correct results URL for "${location}"`, async ({ page }) => {
      const s = new SearchPage(page);
      await s.navigateToHome();
      
      console.log(`\n🌍 Running redirection validation check for location: ${location}`);
      await s.executeSearch(location);
      
      // Asserts that the URL updated to the search queries path format string safely
      await expect(page).toHaveURL(/search\?q=/i);
      await expect(s.searchInput.first()).toBeVisible();
      
      console.log(`  ✅ Redirection verified for "${location}"`);
    });
  }

  // ─────────────────────────────────────
  // TC_SRH_002 — Top 5 cards per activity
  // ─────────────────────────────────────
  // ─────────────────────────────────────
  // TC_SRH_002 — Top 5 cards per activity (with live redirect check)
  // ─────────────────────────────────────
  for (const activity of TEST_ACTIVITIES) {
    test(`TC_SRH_002 | "${activity}" — top ${SAMPLE_SIZE} cards validated`, async ({ page }) => {

      const s = new SearchPage(page);
      await s.navigateToHome();
      await s.executeSearch(activity);

      const total = await s.bookNowLinks.count();
      if (total === 0) {
        console.log(`⚠️ No results for "${activity}" — skipping`);
        return;
      }

      const checkCount = Math.min(SAMPLE_SIZE, total);
      console.log(`\n"${activity}" — checking top ${checkCount} of ${total} cards\n`);

      for (let i = 0; i < checkCount; i++) {
        console.log(`\n👆 Moving to Card #${i + 1}...`);
        const card = await s.getCardInfo(i);

        console.log(`Card #${i + 1}`);
        console.log(`  Provider : ${card.provider}`);
        console.log(`  Price    : AED ${card.price}`);
        console.log(`  href     : ${card.href}`);

        // ✅ 1. Book Now visible
        await expect(card.link).toBeVisible({ timeout: 10000 });

        // ✅ 2. href not empty
        expect(card.href, `Card #${i + 1} href is empty`).toBeTruthy();

        // ✅ 3. href points to known provider
        expect(
          card.href,
          `Card #${i + 1} does not point to known provider`
        ).toMatch(/booking\.com|groupon|headout/i);

        // ✅ 4. provider identified
        expect(
          KNOWN_PROVIDERS,
          `Card #${i + 1} unknown provider: ${card.provider}`
        ).toContain(card.provider);

        // ✅ 5. price > 0 (data fetched correctly)
        expect(
          card.price,
          `Card #${i + 1} price missing or 0`
        ).toBeGreaterThan(0);

        console.log(`  Ref: Card #${i + 1} Structural Check PASSED`);

        // ✅ 6. Click Book Now and validate live redirect
        console.log(`\n👆 Clicking Card #${i + 1} Book Now button...`);
        const actualUrl = await s.clickBookNowAndGetUrl(i);

        console.log(`  Opened URL: ${actualUrl}`);

        expect(
          actualUrl,
          `Card #${i + 1} Book Now opened empty URL page`
        ).toBeTruthy();

        expect(
          actualUrl,
          `Card #${i + 1} Opened page URL is not secure (https)`
        ).toMatch(/^https:\/\//);

        expect(
          actualUrl,
          `Card #${i + 1} URL doesn't target expected provider ${card.provider}`
        ).toMatch(/booking\.com|groupon\.ae|groupon\.com|headout\.com/i);

        console.log(`  ✅ Card #${i + 1} Visual Redirection is working!`);

        await page.waitForTimeout(500);
      }
    });
  }


  // ─────────────────────────────────────
  // TC_SRH_003 — Edge case: no results
  // ─────────────────────────────────────
  test('TC_SRH_003 | Nonsense query shows graceful empty state', async ({ page }) => {
    const s = new SearchPage(page);
    await s.navigateToHome();
    await s.executeSearch('ZyxwVutsrQponMlkj123987');

    await expect(page).not.toHaveTitle(/Runtime Error|500|Crash/i);

    const total = await s.bookNowLinks.count();
    const noResultsMsg = page.getByText(/No results|No matches|0 result/i);
    const msgVisible = await noResultsMsg.isVisible().catch(() => false);

    expect(total === 0 || msgVisible).toBe(true);
    console.log(`Empty state — cards: ${total}, message: ${msgVisible}`);
  });

 
});
