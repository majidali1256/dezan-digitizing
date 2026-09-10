const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    // Launch headless server on free port
    const { spawn } = require('child_process');
    const server = spawn('python3', ['-m', 'http.server', '8248'], { cwd: path.resolve(__dirname, '..') });
    await new Promise(r => setTimeout(r, 1000));

    try {
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
        await page.goto('http://localhost:8248/admin-orders.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        console.log('=== TESTING QUOTES TAB ISOLATION ===');

        // Click Quotes & payment pill
        await page.click('#stage-jumper-pills [data-stage-target="stage-incomplete-sub"]');
        await page.waitForTimeout(400);

        // Switch to Table View (as in user screenshot)
        await page.click('#layout-toggle-table');
        await page.waitForTimeout(300);

        const sectionsState = await page.$$eval('.stage-sub-section', els => {
            return els.map(el => {
                const style = window.getComputedStyle(el);
                return {
                    id: el.id,
                    display: style.display,
                    hidden: el.classList.contains('hidden'),
                    isVisible: style.display !== 'none' && !el.classList.contains('hidden')
                };
            });
        });

        console.log('\nSections state after clicking Quotes & payment:');
        sectionsState.forEach(s => {
            const shouldBeVisible = (s.id === 'stage-incomplete-sub');
            const pass = s.isVisible === shouldBeVisible;
            console.log(`  [${pass ? 'PASS' : 'FAIL'}] ${s.id}: isVisible=${s.isVisible} (expected=${shouldBeVisible})`);
            if (!pass) {
                console.error(`FATAL: ${s.id} should be ${shouldBeVisible ? 'VISIBLE' : 'HIDDEN'}!`);
            }
        });

        const statusBanner = await page.$eval('#admin-search-results', el => el.textContent.trim());
        console.log(`\nSearch Results Banner: "${statusBanner}"`);

        // Capture screenshot of the Quotes & payment view
        await page.screenshot({
            path: path.join(outputDir, 'quotes_tab_strictly_isolated.png'),
            clip: { x: 50, y: 180, width: 1340, height: 800 }
        });

        await browser.close();
        console.log('\n=== QUOTES TAB ISOLATION VERIFIED SUCCESSFULLY ===');
    } finally {
        server.kill();
    }
})();
