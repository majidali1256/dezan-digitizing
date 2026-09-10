const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    const browser = await chromium.launch({ channel: 'chrome' });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
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

    // Initial state screenshot
    await page.screenshot({ path: path.join(outputDir, 'mobile_admin_orders_all.png') });
    console.log('Saved mobile_admin_orders_all.png');

    // Click 'New Orders'
    await page.click('#stage-jumper-pills [data-stage-target="stage-new-sub"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'mobile_admin_orders_new.png') });
    console.log('Saved mobile_admin_orders_new.png');

    // Click 'In production'
    await page.click('#stage-jumper-pills [data-stage-target="stage-in-progress-sub"]');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(outputDir, 'mobile_admin_orders_production.png') });
    console.log('Saved mobile_admin_orders_production.png');

    // Check horizontal scroll overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`Mobile dimensions: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
    if (scrollWidth > clientWidth) {
        console.error(`HORIZONTAL OVERFLOW DETECTED: ${scrollWidth} > ${clientWidth}`);
    } else {
        console.log('ZERO horizontal overflow on mobile! PASS.');
    }

    await browser.close();
})();
