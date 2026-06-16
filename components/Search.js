const { expect } = require('@playwright/test');

class SearchPage {
  constructor(page) {
    this.page         = page;
    this.searchInput = page.getByTestId('master-search-input-1');
    
    // ✅ Keep the clean, working text-based anchor selector
    this.bookNowLinks = page.locator('a').filter({ hasText: /^Book Now$/i });
  }

  async navigateToHome() {
    await this.page.goto('https://www.tourchecknow.com', {
      waitUntil: 'domcontentloaded',
      timeout:   60000,
    });
    await this.page.waitForTimeout(1000);
  }

  async executeSearch(query) {
    const input = this.searchInput.first();
    await input.waitFor({ state: 'visible', timeout: 15000 });

    // ✅ visually move cursor to search bar first
    await input.scrollIntoViewIfNeeded();
    await this.page.mouse.move(
      ...(await input.boundingBox().then(b => [b.x + b.width / 2, b.y + b.height / 2]))
    );
    await this.page.waitForTimeout(300);

    await input.fill(query);
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Enter');
    
    // Wait for the URL to change
    await this.page.waitForURL(/search\?q=/, { timeout: 20000 });
    
    // 🚀 THE FIX: Force Playwright to wait until ALL background API calls, routing engines,
    // and hydration scripts are 100% finished and idle. This replicates the human delay!
    await this.page.waitForLoadState('networkidle').catch(() => {});
    await this.page.waitForTimeout(1500); 
  }

  clearSearchField() {
    return this.searchInput.first().fill('');
  }

  bookNowLink(index) {
    return this.bookNowLinks.nth(index);
  }

  async getCardInfo(index) {
    const link = this.bookNowLinks.nth(index);

    // ✅ scroll card into view
    await link.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    // ✅ move cursor visually to the button — like a human QA
    const box = await link.boundingBox();
    if (box) {
      await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await this.page.waitForTimeout(600); 
    }

    // ✅ highlight with red border
    await link.evaluate(el => {
      el.style.outline = '3px solid red';
      el.style.boxShadow = '0 0 10px red';
    });
    await this.page.waitForTimeout(800); 

    const href      = await link.getAttribute('href') || '';
    
    const cardText  = await link.evaluate(el => {
      let node = el;
      for (let i = 0; i < 6; i++) {
        if (node.parentElement) node = node.parentElement;
      }
      return node.textContent || '';
    });

    // ✅ remove highlight after reading
    await link.evaluate(el => {
      el.style.outline = '';
      el.style.boxShadow = '';
    });

    let provider = 'unknown';
    if (/booking\.com/i.test(href) || /booking/i.test(cardText)) provider = 'Booking.com';
    if (/groupon/i.test(href) || /groupon/i.test(cardText))     provider = 'Groupon';
    if (/headout/i.test(href) || /headout/i.test(cardText))     provider = 'Headout';

    const priceMatch = cardText.match(/[\d,]+\.?\d*/g) || [];
    const price = priceMatch
      .map(n => parseFloat(n.replace(',', '')))
      .find(n => n > 0 && n < 100000) || null;

    return { index, href, cardText: cardText.trim(), price, provider, link };
  }

  /**
   * ✅ Checks whether the search results page shows zero "Book Now" cards
   * or an explicit "No results" message — used to trigger cross-provider checks.
   */
  async hasNoResults() {
    const total = await this.bookNowLinks.count();
    if (total > 0) return false;

    const noResultsMsg = this.page.getByText(/No results|No matches|0 result/i);
    const msgVisible = await noResultsMsg.isVisible().catch(() => false);

    return total === 0 || msgVisible;
  }

  /**
   * ✅ Checks EACH visible "Book Now" card individually for its displayed currency,
   * and flags any card whose price does NOT match the expected currency symbols.
   * This catches the bug where individual provider cards show their OWN currency
   * (e.g. AED from Booking.com, EUR from Headout) instead of the user-selected one.
   */
  async checkEachCardCurrency(expectedSymbols) {
    const total = await this.bookNowLinks.count();
    const checkCount = Math.min(10, total); // check more cards since this catches per-card issues
    const results = [];

    for (let i = 0; i < checkCount; i++) {
      const link = this.bookNowLinks.nth(i);

      const cardText = await link.evaluate(el => {
        let node = el;
        for (let j = 0; j < 6; j++) {
          if (node.parentElement) node = node.parentElement;
        }
        return node.textContent || '';
      });

      // Detect ALL currency-like tokens present on this specific card
      const currencyPattern = /(AED|USD|EUR|GBP|INR|SAR|AUD|CAD|SGD|PKR|A\$|C\$|S\$|د\.إ|ر\.س|Rs|\$|€|£|₹)/g;
      const foundOnCard = [...new Set(cardText.match(currencyPattern) || [])];

      const matchesExpected = foundOnCard.some(tag => expectedSymbols.includes(tag));

      results.push({
        index: i,
        cardText: cardText.trim().replace(/\s+/g, ' ').slice(0, 120),
        currenciesFound: foundOnCard,
        matchesExpected,
      });
    }

    const mismatched = results.filter(r => !r.matchesExpected);
    return { total: checkCount, results, mismatched };
  }

  /**
   * ✅ Handles both new-tab (popup) and same-tab navigation,
   * since different provider cards/activities behave differently.
   */
  async clickBookNowAndGetUrl(index) {
    const link = this.bookNowLinks.nth(index);
    let destinationUrl = '';

    await link.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(800);

    const target = await link.getAttribute('target') || '';

    if (target === '_blank') {
      // Expect a new tab to open
      try {
        const popupPromise = this.page.context().waitForEvent('page', { timeout: 10000 });
        await link.click();
        const newPage = await popupPromise;
        await newPage.waitForLoadState('domcontentloaded').catch(() => {});
        await newPage.waitForTimeout(1500);
        destinationUrl = newPage.url();
        await newPage.close();
      } catch (e) {
        // target=_blank but no popup fired — fall back to same-tab handling
        destinationUrl = await this._handleSameTabNavigation(link);
      }
    } else {
      destinationUrl = await this._handleSameTabNavigation(link);
    }

    return destinationUrl;
  }

  /**
   * ✅ Handles cards that navigate the current tab instead of opening a new one.
   * Returns to the previous page afterwards so subsequent cards can be tested.
   */
  async _handleSameTabNavigation(link) {
    const currentUrl = this.page.url();

    try {
      await Promise.all([
        this.page.waitForNavigation({ timeout: 10000 }).catch(() => null),
        link.click(),
      ]);
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.page.waitForTimeout(1500);

      const newUrl = this.page.url();

      if (newUrl !== currentUrl) {
        const dest = newUrl;
        // navigate back to search results so next card index is still valid
        await this.page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await this.page.waitForLoadState('networkidle').catch(() => {});
        await this.page.waitForTimeout(1000);
        return dest;
      }
    } catch (e) {
      // ignore — fall through to return currentUrl
    }

    return currentUrl;
  }
}

module.exports = { SearchPage };