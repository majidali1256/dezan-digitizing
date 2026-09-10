const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    const { spawn } = require('child_process');
    const server = spawn('python3', ['-m', 'http.server', '8252'], { cwd: path.resolve(__dirname, '..') });
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
        await page.goto('http://localhost:8252/admin-orders.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);

        console.log('=== VERIFYING NEW ORDERS QUEUE STRICTLY HAS ZERO QUOTES ===');

        // Click New Orders tab
        await page.click('#stage-jumper-pills [data-stage-target="stage-new-sub"]');
        await page.waitForTimeout(300);

        // Check Table View
        await page.click('#layout-toggle-table');
        await page.waitForTimeout(300);

        const newOrdersAudit = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#stage-new-tbody tr'));
            const orders = rows.map(r => {
                const text = r.innerText.replace(/\s+/g, ' ');
                const isQuote = text.includes('QUO-') || text.toLowerCase().includes('quote requested') || text.toLowerCase().includes('quote estimate');
                const isPaymentDue = text.includes('Payment Due');
                return { text, isQuote, isPaymentDue };
            });

            const pillCounts = {
                all: document.getElementById('pill-count-all')?.textContent,
                new: document.getElementById('pill-count-new')?.textContent,
                revisions: document.getElementById('pill-count-revisions')?.textContent,
                quotes: document.getElementById('pill-count-unpaid')?.textContent,
                in_progress: document.getElementById('pill-count-in-progress')?.textContent,
                completed: document.getElementById('pill-count-completed')?.textContent
            };

            return { orders, pillCounts };
        });

        console.log('\nPill Counts:');
        console.log(JSON.stringify(newOrdersAudit.pillCounts, null, 2));

        console.log(`\nNew Orders count in table: ${newOrdersAudit.orders.length}`);
        let hasQuoteFailure = false;
        let hasPaymentDueFailure = false;

        newOrdersAudit.orders.forEach((o, i) => {
            console.log(`  Row ${i + 1}: ${o.text.slice(0, 100)}...`);
            if (o.isQuote) {
                console.error(`  FAIL: Row ${i + 1} contains a Quote!`);
                hasQuoteFailure = true;
            }
            if (o.isPaymentDue) {
                console.error(`  FAIL: Row ${i + 1} has Payment Due!`);
                hasPaymentDueFailure = true;
            }
        });

        if (!hasQuoteFailure && !hasPaymentDueFailure) {
            console.log('\n[PASS] ZERO Quotes and ZERO Payment Due orders in New Orders queue!');
        } else {
            console.error('\n[FAIL] Found quotes or payment due orders in New Orders!');
        }

        // Capture screenshot of the purified New Orders queue in Table mode
        await page.screenshot({
            path: path.join(outputDir, 'new_orders_strictly_no_quotes_table.png'),
            clip: { x: 50, y: 180, width: 1340, height: 750 }
        });

        // Switch to Cards mode
        await page.click('#layout-toggle-grid');
        await page.waitForTimeout(300);

        await page.screenshot({
            path: path.join(outputDir, 'new_orders_strictly_no_quotes_cards.png'),
            clip: { x: 50, y: 180, width: 1340, height: 750 }
        });

        await browser.close();
        console.log('\n=== AUDIT COMPLETED SUCCESSFULLY ===');
    } finally {
        server.kill();
    }
})();
