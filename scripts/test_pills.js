const { chromium } = require('playwright');

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

    // Check computed styles of pills
    const pills = await page.$$eval('#stage-jumper-pills .stage-jump-pill', els => els.map(el => {
        const style = window.getComputedStyle(el);
        return {
            text: el.innerText.replace(/\n/g, ' '),
            bg: style.backgroundColor,
            color: style.color,
            border: style.borderColor,
            ariaPressed: el.getAttribute('aria-pressed')
        };
    }));
    console.log('INITIAL PILL STYLES:');
    console.log(JSON.stringify(pills, null, 2));

    // Check visibility of sections
    const sections = await page.$$eval('.stage-sub-section', els => els.map(el => ({
        id: el.id,
        hidden: el.classList.contains('hidden'),
        display: window.getComputedStyle(el).display,
        cardsCount: el.querySelectorAll('.admin-order-card').length
    })));
    console.log('\nINITIAL SECTIONS:');
    console.log(JSON.stringify(sections, null, 2));

    // Now click on 'New Orders'
    console.log('\n--- CLICKING "New Orders" ---');
    await page.click('#stage-jumper-pills [data-stage-target="stage-new-sub"]');
    await page.waitForTimeout(300);

    const sectionsAfterNew = await page.$$eval('.stage-sub-section', els => els.map(el => ({
        id: el.id,
        hidden: el.classList.contains('hidden'),
        display: window.getComputedStyle(el).display
    })));
    console.log('SECTIONS AFTER CLICKING NEW:');
    console.log(JSON.stringify(sectionsAfterNew, null, 2));

    // Now click on 'In production'
    console.log('\n--- CLICKING "In production" ---');
    await page.click('#stage-jumper-pills [data-stage-target="stage-in-progress-sub"]');
    await page.waitForTimeout(300);

    const sectionsAfterProd = await page.$$eval('.stage-sub-section', els => els.map(el => ({
        id: el.id,
        hidden: el.classList.contains('hidden'),
        display: window.getComputedStyle(el).display
    })));
    console.log('SECTIONS AFTER CLICKING IN PRODUCTION:');
    console.log(JSON.stringify(sectionsAfterProd, null, 2));

    await browser.close();
})();
