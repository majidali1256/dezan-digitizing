const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8092;
const ROOT = path.join(__dirname, '..');
const PROOFS_DIR = path.join(ROOT, 'tests/visual_proofs');

if (!fs.existsSync(PROOFS_DIR)) {
    fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

const MIMES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    
    // Clean vanity routes rewrite simulation (matches vercel.json & express)
    if (reqPath === '/tiktok') reqPath = '/tiktok.html';
    if (reqPath === '/instagram') reqPath = '/instagram.html';
    if (reqPath === '/facebook') reqPath = '/facebook.html';
    if (reqPath === '/fb') reqPath = '/fb.html';
    if (reqPath === '/ig') reqPath = '/ig.html';
    if (reqPath === '/youtube') reqPath = '/youtube.html';
    if (reqPath === '/yt') reqPath = '/yt.html';
    if (reqPath === '/pinterest') reqPath = '/pinterest.html';

    let filePath = path.join(ROOT, reqPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIMES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function runCleanLinkVerification() {
    server.listen(PORT, async () => {
        console.log(`[Clean Link Server] Listening on http://localhost:${PORT}`);

        let browser = null;
        try {
            browser = await chromium.launch({ channel: 'chrome', headless: true });
            const context = await browser.newContext({
                viewport: { width: 1512, height: 982 },
                deviceScaleFactor: 2
            });

            const page = await context.newPage();

            // =========================================================================
            // TEST 1: Visit dezandigitizing.com/tiktok -> Auto-Redirect to /
            // =========================================================================
            console.log('\n[Flow 1] Navigating to clean link: http://localhost:' + PORT + '/tiktok');
            await page.goto(`http://localhost:${PORT}/tiktok`, { waitUntil: 'networkidle' });

            // Wait for redirect to complete
            await page.waitForURL(`http://localhost:${PORT}/`, { timeout: 5000 });
            const currentUrl1 = page.url();
            console.log(`[Flow 1] Redirect Completed: Current URL is "${currentUrl1}"`);
            assert.strictEqual(currentUrl1, `http://localhost:${PORT}/`, 'URL must be clean homepage with zero UTM params');

            // Verify stored attribution in localStorage
            const storage1 = await page.evaluate(() => {
                return {
                    firstTouch: JSON.parse(localStorage.getItem('dezan_first_touch_attribution') || '{}'),
                    lastTouch: JSON.parse(localStorage.getItem('dezan_last_touch_attribution') || '{}'),
                    dataLayer: window.dataLayer || []
                };
            });

            console.log('[Flow 1] Stored First Touch:', storage1.firstTouch);
            assert.strictEqual(storage1.firstTouch.source, 'tiktok');
            assert.strictEqual(storage1.firstTouch.utm_source, 'tiktok');
            assert.strictEqual(storage1.firstTouch.utm_medium, 'organic_social');
            assert.strictEqual(storage1.firstTouch.utm_campaign, 'profile_bio');

            // Capture screenshot of clean redirected homepage
            const shotPath1 = path.join(PROOFS_DIR, 'clean_link_tiktok_redirected_home.png');
            await page.screenshot({ path: shotPath1 });
            console.log(`[Flow 1] Screenshot saved to ${shotPath1}`);

            // =========================================================================
            // TEST 2: Visit /instagram with custom destination ?dest=/pricing.html
            // =========================================================================
            console.log('\n[Flow 2] Navigating to clean link with destination: http://localhost:' + PORT + '/instagram?dest=/pricing.html');
            await page.goto(`http://localhost:${PORT}/instagram?dest=/pricing.html`, { waitUntil: 'networkidle' });

            await page.waitForURL(`http://localhost:${PORT}/pricing.html`, { timeout: 5000 });
            const currentUrl2 = page.url();
            console.log(`[Flow 2] Redirect Completed: Current URL is "${currentUrl2}"`);
            assert.strictEqual(currentUrl2, `http://localhost:${PORT}/pricing.html`, 'URL must be /pricing.html without UTM query params');

            const storage2 = await page.evaluate(() => {
                return {
                    firstTouch: JSON.parse(localStorage.getItem('dezan_first_touch_attribution') || '{}'),
                    lastTouch: JSON.parse(localStorage.getItem('dezan_last_touch_attribution') || '{}')
                };
            });

            console.log('[Flow 2] Preserved First Touch:', storage2.firstTouch.source);
            console.log('[Flow 2] Updated Last Touch:', storage2.lastTouch.source);
            assert.strictEqual(storage2.firstTouch.source, 'tiktok', 'First touch must remain tiktok (original acquisition source)');
            assert.strictEqual(storage2.lastTouch.source, 'instagram', 'Last touch must update to instagram');
            assert.strictEqual(storage2.lastTouch.utm_campaign, 'profile_bio');

            const shotPath2 = path.join(PROOFS_DIR, 'clean_link_instagram_redirected_pricing.png');
            await page.screenshot({ path: shotPath2 });
            console.log(`[Flow 2] Screenshot saved to ${shotPath2}`);

            // =========================================================================
            // TEST 3: Visit /facebook -> Verifies Facebook profile bio attribution
            // =========================================================================
            console.log('\n[Flow 3] Navigating to clean link: http://localhost:' + PORT + '/facebook');
            await page.goto(`http://localhost:${PORT}/facebook`, { waitUntil: 'networkidle' });
            await page.waitForURL(`http://localhost:${PORT}/`, { timeout: 5000 });

            const storage3 = await page.evaluate(() => {
                return {
                    firstTouch: JSON.parse(localStorage.getItem('dezan_first_touch_attribution') || '{}'),
                    lastTouch: JSON.parse(localStorage.getItem('dezan_last_touch_attribution') || '{}')
                };
            });

            assert.strictEqual(storage3.lastTouch.source, 'facebook');
            assert.strictEqual(storage3.lastTouch.utm_source, 'facebook');
            assert.strictEqual(storage3.lastTouch.utm_medium, 'organic_social');
            assert.strictEqual(storage3.lastTouch.utm_campaign, 'profile_bio');
            console.log('[Flow 3] Facebook attribution verified: Last Touch is "facebook" / "organic_social" / "profile_bio"');

            // =========================================================================
            // TEST 4: Full End-to-End Purchase Attribution Verification
            // =========================================================================
            console.log('\n[Flow 4] Simulating final order confirmation and conversion firing...');
            await page.goto(`http://localhost:${PORT}/order-success.html?order=DZ-CLEAN-LINK-TEST&amount=45.00`, { waitUntil: 'networkidle' });

            const conversionResult = await page.evaluate(() => {
                if (window.dezanTracker) {
                    window.dezanTracker.trackOrderPurchase({
                        orderId: 'DZ-CLEAN-LINK-TEST',
                        amount: 45.00,
                        service: 'Jacket Back Digitizing',
                        email: 'socialbuyer@example.com'
                    });
                }
                return {
                    dataLayer: window.dataLayer || []
                };
            });

            const purchaseEvt = conversionResult.dataLayer.find(e => e && e.event === 'purchase');
            const conversionEvt = conversionResult.dataLayer.find(e => e && e.event === 'conversion_order_paid');

            assert.ok(purchaseEvt, 'GA4 purchase event must exist');
            assert.ok(purchaseEvt.ecommerce.transaction_id, 'transaction_id must be populated');
            assert.strictEqual(purchaseEvt.ad_attribution.original_source, 'tiktok', 'Original source on order must be tiktok');
            assert.strictEqual(purchaseEvt.ad_attribution.last_source, 'facebook', 'Last source on order must be facebook');

            assert.ok(conversionEvt, 'conversion_order_paid must exist');
            assert.strictEqual(conversionEvt.original_source, 'tiktok');
            assert.strictEqual(conversionEvt.last_source, 'facebook');

            console.log('[Flow 4] Order Conversion successfully tied back to clean traffic sources:');
            console.log('         - Original Source:', purchaseEvt.ad_attribution.original_source);
            console.log('         - Last Source:    ', purchaseEvt.ad_attribution.last_source);
            console.log('         - Campaign:       ', purchaseEvt.ad_attribution.utm_campaign);

            console.log('\n✔ ALL 4 CLEAN LINK VERIFICATION FLOWS PASSED PERFECTLY!\n');

        } catch (err) {
            console.error('Verification failed:', err);
            process.exitCode = 1;
        } finally {
            if (browser) await browser.close();
            server.close();
        }
    });
}

runCleanLinkVerification();
