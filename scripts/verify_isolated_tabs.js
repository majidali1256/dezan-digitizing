const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    const browser = await chromium.launch({ channel: 'chrome' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_admin_test',
            role: 'admin',
            displayName: 'Admin Master',
            email: 'admin@dezan.com'
        }));
    });
    const page = await context.newPage();
    await page.goto('http://localhost:8244/admin-orders.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const stages = [
        { name: 'all', target: 'all', visibleSection: 'all' },
        { name: 'new', target: 'stage-new-sub', visibleSection: 'stage-new-sub' },
        { name: 'revisions', target: 'stage-revisions-sub', visibleSection: 'stage-revisions-sub' },
        { name: 'quotes', target: 'stage-incomplete-sub', visibleSection: 'stage-incomplete-sub' },
        { name: 'in_progress', target: 'stage-in-progress-sub', visibleSection: 'stage-in-progress-sub' },
        { name: 'completed', target: 'stage-completed-sub', visibleSection: 'stage-completed-sub' }
    ];

    const sectionIds = ['stage-new-sub', 'stage-revisions-sub', 'stage-incomplete-sub', 'stage-in-progress-sub', 'stage-completed-sub'];

    console.log('=== TESTING ISOLATED STAGE TABS IN ADMIN ORDERS ===');

    for (const stage of stages) {
        console.log(`\n--- Clicking Stage: ${stage.name} (${stage.target}) ---`);
        await page.click(`#stage-jumper-pills [data-stage-target="${stage.target}"]`);
        await page.waitForTimeout(300);

        const statusText = await page.$eval('#admin-search-results', el => el.textContent.trim());
        console.log(`Search Results Banner: "${statusText}"`);

        const visibility = await page.$$eval('.stage-sub-section', (els, sectionIds) => {
            return els.map(el => ({
                id: el.id,
                display: window.getComputedStyle(el).display,
                hidden: el.classList.contains('hidden')
            }));
        }, sectionIds);

        console.log('Sections visibility:');
        for (const s of visibility) {
            const expectedVisible = (stage.visibleSection === 'all') || (stage.visibleSection === s.id);
            const isVisible = s.display !== 'none' && !s.hidden;
            const pass = isVisible === expectedVisible;
            console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${s.id}: display=${s.display}, hidden=${s.hidden} (expected visible=${expectedVisible})`);
            if (!pass) {
                console.error(`ERROR: Stage ${stage.name} expected ${s.id} visible=${expectedVisible}, got ${isVisible}`);
            }
        }

        // Check active pill aria-pressed
        const activePills = await page.$$eval('#stage-jumper-pills .stage-jump-pill', pills => {
            return pills.filter(p => p.getAttribute('aria-pressed') === 'true').map(p => p.dataset.stageTarget);
        });
        console.log(`Active pill with aria-pressed="true": [${activePills.join(', ')}] (expected: [${stage.target}])`);

        // Capture screenshot
        const shotName = `tab_${stage.name}_isolated.png`;
        await page.screenshot({ path: path.join(outputDir, shotName) });
        console.log(`Saved screenshot: ${shotName}`);
    }

    // Capture pill bar closeup
    const pillBar = await page.$('#stage-jumper-pills');
    if (pillBar) {
        await pillBar.screenshot({ path: path.join(outputDir, 'admin_pills_final_closeup.png') });
        console.log('\nSaved admin_pills_final_closeup.png');
    }

    // Now test Table view isolation as well
    console.log('\n--- TESTING TABLE VIEW ISOLATION ---');
    await page.click('#layout-toggle-table');
    await page.waitForTimeout(300);

    await page.click('#stage-jumper-pills [data-stage-target="stage-in-progress-sub"]');
    await page.waitForTimeout(300);

    const tableVisibility = await page.$$eval('.stage-sub-section', els => els.map(el => ({
        id: el.id,
        display: window.getComputedStyle(el).display,
        tableHidden: el.querySelector('.stage-table-container')?.classList.contains('hidden')
    })));
    console.log('Table view sections after clicking in_progress:');
    console.log(JSON.stringify(tableVisibility, null, 2));

    await page.screenshot({ path: path.join(outputDir, 'admin_table_view_in_production.png') });

    console.log('\nALL ADMIN TAB ISOLATION TESTS COMPLETED!');
    await browser.close();
})();
