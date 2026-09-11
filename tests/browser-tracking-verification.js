const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

// Simple static file server
function createStaticServer(port) {
    const rootDir = path.join(__dirname, '..');
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    const server = http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(rootDir, reqPath);

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
                return;
            }
            const ext = path.extname(filePath);
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(data);
        });
    });

    return new Promise((resolve) => {
        server.listen(port, () => resolve(server));
    });
}

async function runBrowserVerification() {
    console.log('--- Starting Playwright End-to-End Tracking Verification ---');
    const PORT = 3088;
    const server = await createStaticServer(PORT);
    console.log(`Test server listening on http://localhost:${PORT}`);

    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const launchOptions = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
    }
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`[Browser ${msg.type()}]: ${msg.text()}`);
    });

    try {
        // Step 1: User lands from a Google Ad click
        console.log('1. Simulating landing on homepage with Google Ads gclid and UTM params...');
        await page.goto(`http://localhost:${PORT}/index.html?gclid=TEST_AD_CLICK_998877&utm_source=google&utm_medium=cpc&utm_campaign=embroidery_digitizing_usa`);
        await page.waitForTimeout(600);

        // Verify attribution stored
        const attribution = await page.evaluate(() => {
            return JSON.parse(sessionStorage.getItem('dezan_ad_attribution') || '{}');
        });
        console.log('Captured attribution:', attribution);
        if (attribution.gclid !== 'TEST_AD_CLICK_998877') {
            throw new Error(`Expected gclid 'TEST_AD_CLICK_998877', got '${attribution.gclid}'`);
        }
        if (attribution.utm_campaign !== 'embroidery_digitizing_usa') {
            throw new Error(`Expected utm_campaign 'embroidery_digitizing_usa', got '${attribution.utm_campaign}'`);
        }

        // Step 2: Customer completes paid checkout and lands on order-success.html
        console.log('2. Navigating to Thank You / Order Confirmed page (paid order #DZ-9812)...');
        await page.goto(`http://localhost:${PORT}/order-success.html?orderId=DZ-9812&amount=15.00&plan=Hat%20/%20Left%20Chest&service=Embroidery%20Digitizing&email=david@example.com`);
        await page.waitForTimeout(1000);

        // Verify dataLayer purchase event
        const dataLayer = await page.evaluate(() => window.dataLayer || []);
        const purchaseEvents = dataLayer.filter(item => item && item.event === 'purchase');
        console.log('Found purchase events in dataLayer:', purchaseEvents.length);
        if (purchaseEvents.length !== 1) {
            throw new Error(`Expected exactly 1 purchase event, found ${purchaseEvents.length}`);
        }

        const purchase = purchaseEvents[0];
        console.log('Purchase payload:', JSON.stringify(purchase, null, 2));
        if (purchase.ecommerce.transaction_id !== 'DZ-9812') {
            throw new Error(`Expected transaction_id 'DZ-9812', got '${purchase.ecommerce.transaction_id}'`);
        }
        if (purchase.ecommerce.value !== 15.00) {
            throw new Error(`Expected value 15.00, got '${purchase.ecommerce.value}'`);
        }
        if (purchase.ad_attribution.gclid !== 'TEST_AD_CLICK_998877') {
            throw new Error(`Expected preserved gclid, got '${purchase.ad_attribution.gclid}'`);
        }
        if (purchase.user_data.email !== 'david@example.com') {
            throw new Error(`Expected email 'david@example.com', got '${purchase.user_data.email}'`);
        }

        // Step 3: Refresh the page to test deduplication safeguard
        console.log('3. Refreshing Thank You page to test deduplication safeguard...');
        await page.reload();
        await page.waitForTimeout(800);

        const dataLayerAfterReload = await page.evaluate(() => window.dataLayer || []);
        const purchaseEventsAfterReload = dataLayerAfterReload.filter(item => item && item.event === 'purchase');
        console.log('Purchase events after reload (should be 0 because order is already converted):', purchaseEventsAfterReload.length);
        if (purchaseEventsAfterReload.length !== 0) {
            throw new Error(`Deduplication failed! Expected 0 purchase events on reload, but found ${purchaseEventsAfterReload.length}`);
        }
        console.log('✅ Deduplication confirmed: page refresh did NOT fire a second conversion!');

        // Step 4: Test a Free Quote Request landing on confirmation
        console.log('4. Navigating to quote confirmation (quote #QUO-3344)...');
        await page.goto(`http://localhost:${PORT}/order-success.html?orderId=QUO-3344&quote=true&amount=0.00&email=quote@example.com`);
        await page.waitForTimeout(800);

        const quoteDataLayer = await page.evaluate(() => window.dataLayer || []);
        const quotePurchases = quoteDataLayer.filter(item => item && item.event === 'purchase');
        const quoteLeads = quoteDataLayer.filter(item => item && item.event === 'generate_lead');

        console.log(`Quote events: ${quotePurchases.length} purchases, ${quoteLeads.length} leads`);
        if (quotePurchases.length !== 0) {
            throw new Error('Quote request should NOT fire a purchase event!');
        }
        if (quoteLeads.length !== 1) {
            throw new Error(`Expected 1 generate_lead event for quote, found ${quoteLeads.length}`);
        }
        console.log('✅ Quote lead separation confirmed: zero purchase conversions fired for $0 quote!');

        // Capture screenshot of Order Success page
        const screenshotPath = path.join(__dirname, 'order-success-tracking-verified.png');
        await page.goto(`http://localhost:${PORT}/order-success.html?orderId=DZ-1048&amount=15.00&plan=Left%20Chest%20/%20Hat&service=Digitizing&email=customer@example.com`);
        await page.waitForTimeout(500);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved verification screenshot to ${screenshotPath}`);

        console.log('\n======================================================');
        console.log('🎉 ALL PLAYWRIGHT CONVERSION TRACKING VERIFICATIONS PASSED!');
        console.log('======================================================');

    } finally {
        await browser.close();
        server.close();
    }
}

runBrowserVerification().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
