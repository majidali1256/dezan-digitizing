const { chromium } = require('playwright');

async function debugClientOrders() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
        const user = {
            id: 'c1010101-0000-4000-8000-000000000001',
            email: 'john@apparelcorp.com',
            displayName: 'John Foster',
            name: 'John Foster',
            role: 'client',
            company: 'Creative Merch & Embroidery',
            phone: '+1 (555) 234-5678'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const page = await context.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('http://localhost:8085/client-orders.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const cards = await page.$$('.client-order-card');
    console.log(`Found ${cards.length} cards`);

    const viewOrderBtn = await cards[0].$('button:has-text("View Order")');
    console.log('Button found:', !!viewOrderBtn);

    const btnHtml = await cards[0].$eval('button:has-text("View Order")', el => el.outerHTML);
    console.log('Button HTML:', btnHtml);

    console.log('Calling window.clientWorkspace.openOrderDetailsModal...');
    const result = await page.evaluate(() => {
        try {
            const firstCardBtn = document.querySelector('.client-order-card button');
            console.log('First card button:', firstCardBtn ? firstCardBtn.outerHTML : 'none');
            // Try triggering click
            firstCardBtn.click();
            const modal = document.getElementById('order-details-modal');
            return {
                modalExists: !!modal,
                modalClasses: modal ? modal.className : null,
                modalDisplay: modal ? window.getComputedStyle(modal).display : null,
            };
        } catch (e) {
            return { error: e.message, stack: e.stack };
        }
    });

    console.log('Eval result:', result);
    await browser.close();
}

debugClientOrders().catch(console.error);
