const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://www.tourchecknow.com';

// ════════════════════════════════════════
// PAGE OBJECT CLASS — using data-testid
// ════════════════════════════════════════
class Footer {
  constructor(page) {
    this.page   = page;
    this.footer = page.getByTestId('home-travel-shared-components-footer-1');
  }

  // ── Section headings ───────────────────
  companyHeading()  { return this.footer.getByTestId('home-travel-shared-components-p-12'); }
  supportHeading()  { return this.footer.getByTestId('home-travel-shared-components-p-13'); }
  legalHeading()    { return this.footer.getByTestId('home-travel-shared-components-p-14'); }
  exploreHeading()  { return this.footer.getByTestId('home-travel-shared-components-p-15'); }

  // ── Company links ──────────────────────
  aboutLink()        { return this.footer.getByTestId('home-travel-shared-components-a-11'); }
  careersLink()      { return this.footer.getByTestId('home-travel-shared-components-a-12'); }
  pressLink()        { return this.footer.getByTestId('home-travel-shared-components-a-13'); }

  // ── Support links ──────────────────────
  helpCenterLink()   { return this.footer.getByTestId('home-travel-shared-components-a-14'); }
  contactLink()      { return this.footer.getByTestId('home-travel-shared-components-a-15'); }
  cancellationLink() { return this.footer.getByTestId('home-travel-shared-components-a-16'); }

  // ── Legal links ────────────────────────
  privacyLink()      { return this.footer.getByTestId('home-travel-shared-components-a-17'); }
  termsLink()        { return this.footer.getByTestId('home-travel-shared-components-a-18'); }
  cookiesLink()      { return this.footer.getByTestId('home-travel-shared-components-a-19'); }

  // ── Explore links ──────────────────────
  topToursLink()     { return this.footer.getByTestId('home-travel-shared-components-a-20'); }
  destinationsLink() { return this.footer.getByTestId('home-travel-shared-components-a-21'); }
  blogLink()         { return this.footer.getByTestId('home-travel-shared-components-a-22'); }

  // ── Branding ───────────────────────────
  brandName()        { return this.footer.getByTestId('home-travel-shared-components-span-25'); }
  copyright()        { return this.footer.getByTestId('home-travel-shared-components-p-16');    }
  version()          { return this.footer.getByTestId('home-travel-shared-components-p-17');    }
}

// ════════════════════════════════════════
// ✏️ EDIT ONLY THIS DATA
// ════════════════════════════════════════
const FOOTER_LINKS = [
  // Company
  { name: 'About',        testid: 'home-travel-shared-components-a-11', url: '/about'               },
  { name: 'Careers',      testid: 'home-travel-shared-components-a-12', url: '/careers'             },
  { name: 'Press',        testid: 'home-travel-shared-components-a-13', url: '/press'               },
  // Support
  { name: 'Help Center',  testid: 'home-travel-shared-components-a-14', url: '/help-center'         },
  { name: 'Contact',      testid: 'home-travel-shared-components-a-15', url: '/contact'             },
  { name: 'Cancellation', testid: 'home-travel-shared-components-a-16', url: '/cancellation-policy' },
  // Legal
  { name: 'Privacy',      testid: 'home-travel-shared-components-a-17', url: '/privacy-policy'      },
  { name: 'Terms',        testid: 'home-travel-shared-components-a-18', url: '/terms'               },
  { name: 'Cookies',      testid: 'home-travel-shared-components-a-19', url: '/cookies'             },
  // Explore
  { name: 'Top Tours',    testid: 'home-travel-shared-components-a-20', url: '/search'              },
  { name: 'Destinations', testid: 'home-travel-shared-components-a-21', url: '/search'              },
  { name: 'Blog',         testid: 'home-travel-shared-components-a-22', url: '/blog'                },
];

const FOOTER_SECTIONS = [
  { name: 'Company',  testid: 'home-travel-shared-components-p-12' },
  { name: 'Support',  testid: 'home-travel-shared-components-p-13' },
  { name: 'Legal',    testid: 'home-travel-shared-components-p-14' },
  { name: 'Explore',  testid: 'home-travel-shared-components-p-15' },
];

// ════════════════════════════════════════
// 🚫 DON'T TOUCH — TESTS RUN THEMSELVES
// ════════════════════════════════════════
function testFooter() {
  test.describe('Footer', () => {
    test.setTimeout(45000);

    // ── 1. Footer visible ──────────────────
    test('footer is visible', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const f = new Footer(page);
      await expect(f.footer).toBeVisible({ timeout: 15000 });
    });

    // ── 2. Brand name ──────────────────────
    test('TourCheckNow brand name is visible', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const f = new Footer(page);
      await expect(f.brandName()).toBeVisible({ timeout: 15000 });
    });

    // ── 3. Copyright ───────────────────────
    test('copyright text is visible', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const f = new Footer(page);
      await expect(f.copyright()).toBeVisible({ timeout: 15000 });
    });

    // ── 4. Version ─────────────────────────
    test('version number is visible', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const f = new Footer(page);
      await expect(f.version()).toBeVisible({ timeout: 15000 });
    });

    // ── 5. Section headings ────────────────
    for (const section of FOOTER_SECTIONS) {
      test(`"${section.name}" heading is visible`, async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await expect(
          page.getByTestId(section.testid)
        ).toBeVisible({ timeout: 15000 });
      });
    }

    // ── 6. All links visible ───────────────
    for (const link of FOOTER_LINKS) {
      test(`"${link.name}" link is visible`, async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await expect(
          page.getByTestId(link.testid)
        ).toBeVisible({ timeout: 15000 });
      });
    }

    // ── 7. All links navigate correctly ────
    for (const link of FOOTER_LINKS) {
      test(`"${link.name}" navigates to correct page`, async ({ page }) => {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.getByTestId(link.testid).click();
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
        expect(page.url()).toContain(link.url);
      });
    }

  });
}

module.exports = { testFooter };