const { test, expect } = require('@playwright/test');
const { SearchPage } = require('../components/Search');
const { CrossProviderChecker } = require('../components/cross_provider_check');

const ACTIVITIES = [
    'Hiking',
    'Desert Safari',
    'Evening Desert Safari',
    'Morning Desert Safari',
    'Overnight Desert Safari',
    'Premium Desert Safari',
    'Luxury Desert Safari',
    'Private Desert Safari',
    'VIP Desert Safari',
    'Camel Ride',
    'Camel Trekking',
    'Sandboarding',
    'Dune Bashing',
    'Quad Biking',
    'ATV Ride',
    'Buggy Ride',
    'Dune Buggy',
    'Falcon Experience',
    'Henna Painting',
    'BBQ Dinner',
    'Tanoura Show',
    'Belly Dance',
    'Fire Show',
    'Yacht Rental',
    'Yacht Cruise',
    'Luxury Yacht',
    'Private Yacht',
    'Sunset Yacht Cruise',
    'Dinner Cruise',
    'Dhow Cruise',
    'Dhow Cruise Marina',
    'Dhow Cruise Creek',
    'Canal Cruise',
    'Marina Cruise',
    'Speed Boat Tour',
    'Jet Ski',
    'Flyboarding',
    'Parasailing',
    'Wakeboarding',
    'Kayaking',
    'Paddle Boarding',
    'Scuba Diving',
    'Snorkeling',
    'Deep Sea Fishing',
    'Burj Khalifa',
    'At The Top',
    'Sky Views',
    'Dubai Frame',
    'The View at The Palm',
    'Ain Dubai',
    'Museum of the Future',
    'AYA Universe',
    'Madame Tussauds',
    'Dubai Aquarium',
    'Lost Chambers Aquarium',
    'The Green Planet',
    'Dubai Dolphinarium',
    'National Aquarium',
    'Dubai Safari Park',
    'Aquaventure Waterpark',
    'Wild Wadi Waterpark',
    'Yas Waterworld',
    'Legoland Water Park',
    'IMG Worlds of Adventure',
    'Motiongate Dubai',
    'Legoland Dubai',
    'Real Madrid World',
    'Ferrari World',
    'Warner Bros. World',
    'SeaWorld Abu Dhabi',
    'KidZania',
    'VR Park',
    'House of Hype',
    'Ski Dubai',
    'Dubai City Tour',
    'Abu Dhabi City Tour',
    'Sharjah City Tour',
    'Al Ain City Tour',
    'Ajman City Tour',
    'Fujairah Tour',
    'Ras Al Khaimah Tour',
    'Umm Al Quwain Tour',
    'Hop On Hop Off',
    'Walking Tour',
    'Private Tour',
    'Group Tour',
    'Louvre Abu Dhabi',
    'Qasr Al Watan',
    'Etihad Museum',
    'Sheikh Zayed Grand Mosque',
    'Heritage Village',
    'Cultural Tour',
    'Helicopter Tour',
    'Skydiving',
    'Hot Air Balloon',
    'Zipline',
    'XLine Dubai Marina',
    'Hatta Kayaking',
    'Hatta Wadi Hub',
    'Mountain Biking',
    'Spa',
    'Luxury Spa',
    'Massage',
    'Beach Club',
    'Pool Day Pass',
    'Gold Souk Tour',
    'Spice Souk Tour',
    'Shopping Tour',
    'Global Village',
    'Dubai Miracle Garden',
    'Dubai Garden Glow',
    'Dubai Shopping Festival',
    'Family Activities',
    'Kids Activities',
    'Romantic Experience',
    'Photography Tour',
    'Sunrise Tour',
    'Sunset Tour'
];

test.describe('TourCheckNow - Complete Activity Sync & Provider Verification', () => {
    test.describe.configure({ mode: 'parallel' });

    for (const activity of ACTIVITIES) {
        test(`Verify sync for "${activity}"`, async ({ page, browser }) => {
            const s = new SearchPage(page);
            const checker = new CrossProviderChecker(browser);

            await s.navigateToHome();
            await s.executeSearch(activity);

            const noResults = await s.hasNoResults();

            if (!noResults) {
                // Results found on TourCheckNow!
                const totalCards = await s.bookNowLinks.count();
                const providersInResults = { 'Booking.com': 0, 'Groupon': 0, 'Headout': 0 };

                const checkCount = Math.min(5, totalCards);
                for (let i = 0; i < checkCount; i++) {
                    const card = page.getByTestId('comparison-card').nth(i);
                    const providerDesktop = card.getByTestId('comparison-card-desktop-provider');

                    let providerName = '';
                    if (await providerDesktop.isVisible()) {
                        providerName = (await providerDesktop.innerText()).trim();
                    } else {
                        const cardText = await card.innerText();
                        if (/booking\.com/i.test(cardText)) providerName = 'Booking.com';
                        else if (/groupon/i.test(cardText)) providerName = 'Groupon';
                        else if (/headout/i.test(cardText)) providerName = 'Headout';
                    }

                    if (/booking/i.test(providerName)) {
                        providersInResults['Booking.com']++;
                    } else if (/groupon/i.test(providerName)) {
                        providersInResults['Groupon']++;
                    } else if (/headout/i.test(providerName)) {
                        providersInResults['Headout']++;
                    }
                }

                console.log(`✅ "${activity}" — results found on TourCheckNow (Booking.com: ${providersInResults['Booking.com']}, Groupon: ${providersInResults['Groupon']}, Headout: ${providersInResults['Headout']})`);
                return;
            }

            // No results on TourCheckNow. Check if they exist upstream.
            console.log(`⚠️ "${activity}" — NO results on TourCheckNow. Checking upstream providers...`);
            const providerCheck = await checker.checkAllProviders(activity);

            if (providerCheck.anyHasData) {
                const errorMsg = `❌ [SYNC BUG] "${activity}" — data EXISTS upstream but missing on TourCheckNow! ` +
                    `(Booking.com: ${providerCheck.booking}, Groupon: ${providerCheck.groupon}, Headout: ${providerCheck.headout})`;
                console.log(errorMsg);

                // Fail this specific test case immediately
                expect(true, errorMsg).toBe(false);
            } else {
                console.log(`ℹ️ "${activity}" — genuinely empty (no data on TourCheckNow or upstream).`);
            }
        });
    }
});
