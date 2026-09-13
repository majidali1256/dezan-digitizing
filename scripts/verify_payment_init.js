const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const realSdk = process.argv.includes('--real-sdk');
const paymentEnv = realSdk ? require('dotenv').parse(fs.readFileSync(path.join(root, '.env.local'))) : {};
const sdk = `window.paypal = { FUNDING: {PAYPAL:'paypal', CARD:'card'}, Buttons(options) { return { isEligible: () => true, close: async () => {}, render: async (selector) => { const b=document.createElement('button'); b.textContent=options.fundingSource === 'card' ? 'Debit or Credit Card' : 'PayPal'; b.dataset.testFunding=options.fundingSource; b.style='height:44px;background:#ffc439;color:#111;border-radius:4px;width:100%'; document.querySelector(selector).replaceChildren(b); } }; } };`;
(async () => {
    const server = http.createServer((req, res) => {
        const filename = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname.replace(/\/$/, '/index.html'));
        if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404); res.end(); return; }
        const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp' };
        res.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
        fs.createReadStream(filename).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    try {
        browser = await chromium.launch({channel:'chrome', headless:true});
        for (const [name, width, height] of [['desktop',1512,982],['tablet',834,1112],['mobile',390,844]]) {
            const page = await browser.newPage({viewport:{width,height}});
            await page.route('**/api/paypal/config', route => route.fulfill({json:{success:true,data:{clientId:paymentEnv.PAYPAL_CLIENT_ID || 'test-id',currency:'USD',environment:'sandbox'}}}));
            let sdkRequests = 0;
            if (!realSdk) await page.route('https://www.paypal.com/sdk/js?**', async route => {
                sdkRequests++;
                if (sdkRequests === 1) return route.abort();
                await route.fulfill({contentType:'text/javascript',body:sdk});
            });
            await page.addInitScript(() => { localStorage.setItem('dezan_consent','all'); });
            await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil:'domcontentloaded'});
            await page.waitForFunction(() => typeof window.openOrderQuoteModal === 'function');
            await page.evaluate(() => {
                window.openOrderQuoteModal({service:'Digitizing'});
                document.getElementById('order-step-2-view').classList.add('hidden');
                document.getElementById('order-step-3-view').classList.remove('hidden');
                window.initModalPayPal('PayPal');
            });
            const container = page.locator('#modal-paypal-button-container');
            if (realSdk) {
                await container.locator('iframe').first().waitFor({timeout:45000});
                await page.waitForTimeout(3000);
                assert.equal(await container.getByText('Retry Connection').count(), 0, 'Real SDK renders without gateway error');
            } else {
                await container.getByText('Retry Connection').waitFor();
                await container.getByText('Retry Connection').click();
                await container.locator('[data-test-funding="paypal"]').waitFor();
                await page.evaluate(() => window.setModalPaymentMethod('Card'));
                await container.locator('[data-test-funding="card"]').waitFor();
                await page.evaluate(() => window.setModalPaymentMethod('PayPal'));
                await container.locator('[data-test-funding="paypal"]').waitFor();
                assert.equal(sdkRequests,2);
            }
            await container.scrollIntoViewIfNeeded();
            const box = await container.boundingBox();
            assert.ok(box.x >= 0 && box.x + box.width <= width, 'Payment area fits viewport');
            await page.screenshot({path:path.join(root,'tests/visual_evidence',`payment-${realSdk ? "real-" : ""}${name}.png`)});
            console.log(realSdk ? `${name}: real PayPal SDK rendered; no payment submitted` : `${name}: failed SDK -> retry -> PayPal -> Card -> PayPal passed (mock SDK, no charge)`);
            await page.close();
        }
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
})().catch(error => { console.error(error); process.exitCode=1; });
