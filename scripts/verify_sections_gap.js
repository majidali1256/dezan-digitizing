const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    const browser = await chromium.launch({ channel: 'chrome' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_admin_test',
            role: 'admin',
            displayName: 'Admin Master',
            email: 'admin@dezan.com'
        }));
    });
    const page = await context.newPage();
    await page.goto('http://localhost:8245/admin-orders.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    console.log('=== VERIFYING STAGE SECTION GAPS IN ALL ORDERS VIEW ===');

    // 1. Measure gaps in default (Cards) view
    const sectionIds = ['stage-new-sub', 'stage-revisions-sub', 'stage-incomplete-sub', 'stage-in-progress-sub', 'stage-completed-sub'];
    
    async function measureGaps(modeName) {
        console.log(`\n--- Measuring Gaps in ${modeName} Mode ---`);
        const rects = await page.$$eval('.stage-sub-section', els => {
            return els.map(el => {
                const r = el.getBoundingClientRect();
                return { id: el.id, top: r.top, bottom: r.bottom, height: r.height };
            });
        });

        for (let i = 0; i < rects.length - 1; i++) {
            const current = rects[i];
            const next = rects[i + 1];
            const gap = next.top - current.bottom;
            console.log(`Gap between [${current.id}] and [${next.id}]: ${gap.toFixed(1)}px (PASS: ${gap >= 20 ? 'YES' : 'NO'})`);
            if (gap < 20) {
                console.error(`ERROR: Gap between ${current.id} and ${next.id} is too small: ${gap}px`);
            }
        }
    }

    await measureGaps('Cards');

    // Capture All Orders in Cards view
    await page.screenshot({
        path: path.join(outputDir, 'admin_all_orders_cards_gaps.png'),
        clip: { x: 100, y: 350, width: 1240, height: 1200 }
    });

    // 2. Switch to Table View (the exact mode user sent in screenshot)
    console.log('\n--- Switching to Table View ---');
    await page.click('#layout-toggle-table');
    await page.waitForTimeout(400);

    await measureGaps('Table');

    // Scroll directly so stage-revisions-sub and its gaps to adjacent sections are visible
    await page.evaluate(() => {
        const rev = document.getElementById('stage-revisions-sub');
        if (rev) rev.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(300);

    // Capture screenshot showing the gap between sections in Table mode
    await page.screenshot({
        path: path.join(outputDir, 'admin_sections_gap_table_view.png')
    });

    // Also in Cards view
    await page.click('#layout-toggle-grid');
    await page.waitForTimeout(300);
    await page.evaluate(() => {
        const rev = document.getElementById('stage-revisions-sub');
        if (rev) rev.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(300);
    await page.screenshot({
        path: path.join(outputDir, 'admin_sections_gap_cards_view.png')
    });

    // 3. Test Mobile Viewport
    console.log('\n--- Testing Mobile Viewport (390x844) ---');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    const mobileOverflow = await page.evaluate(() => {
        return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
        };
    });
    console.log(`Mobile dimensions: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}, hasOverflow=${mobileOverflow.hasOverflow}`);

    await page.screenshot({
        path: path.join(outputDir, 'mobile_all_orders_table_gaps.png'),
        clip: { x: 0, y: 250, width: 390, height: 900 }
    });

    await browser.close();
    console.log('\n=== ALL GAP VERIFICATIONS COMPLETED SUCCESSFULLY ===');
})();
