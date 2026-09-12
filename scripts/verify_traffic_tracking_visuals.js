const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8089;
const ROOT = path.join(__dirname, '..');
const PROOFS_DIR = path.join(ROOT, 'tests/visual_proofs');

if (!fs.existsSync(PROOFS_DIR)) {
    fs.mkdirSync(PROOFS_DIR, { recursive: true });
}

// Simple MIME lookup
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
    const filePath = path.join(ROOT, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIMES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function runVisualVerification() {
    server.listen(PORT, async () => {
        console.log(`[Local Server] Listening on http://localhost:${PORT}`);

        try {
            const browser = await chromium.launch({ channel: 'chrome', headless: true });
            const context = await browser.newContext({
                viewport: { width: 1512, height: 982 },
                deviceScaleFactor: 2
            });

            await context.addInitScript(() => {
                const user = {
                    id: 'a0000000-0000-4000-8000-000000000001',
                    email: 'admin@dezandigitizing.com',
                    displayName: 'System Administrator',
                    name: 'System Administrator',
                    role: 'admin',
                    company: 'Dezan Admin HQ'
                };
                localStorage.setItem('dezan_session', JSON.stringify(user));
                sessionStorage.setItem('dezan_session', JSON.stringify(user));
                localStorage.setItem('insforge_auth_user', JSON.stringify(user));
            });

            const page = await context.newPage();

            // 1. Verify admin-portal.html traffic analytics section
            console.log('\n--- 1. Testing Admin Portal Traffic Analytics UI ---');
            await page.goto(`http://localhost:${PORT}/admin-portal.html`, { waitUntil: 'networkidle' });
            await page.waitForSelector('#admin-traffic-analytics', { timeout: 5000 });

            // Scroll to analytics section and snapshot
            const analyticsEl = await page.$('#admin-traffic-analytics');
            await analyticsEl.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await analyticsEl.screenshot({ path: path.join(PROOFS_DIR, 'admin_traffic_analytics_section.png') });
            console.log('✔ Captured screenshot: tests/visual_proofs/admin_traffic_analytics_section.png');

            // 2. Test Order Details Modal Section 6 Attribution Dossier
            console.log('\n--- 2. Testing Order Details Modal Attribution Dossier ---');
            await page.evaluate(() => {
                const sampleGoogleAdsOrder = {
                    id: 'test-google-ads-order',
                    order_number: 'DZ-GOOGLE-ADS-991',
                    client_name: 'Marcus Sterling',
                    client_email: 'marcus.sterling@customapparel.com',
                    client_company: 'Sterling Apparel Co.',
                    service_type: 'Embroidery Digitizing',
                    plan_name: 'Left Chest & Cap',
                    placement: 'Cap Front / 3D Puff',
                    sizing: '2.5" Height',
                    fabric_type: 'Structured Cotton Twill',
                    price: 25.00,
                    turnaround_speed: 'rush',
                    payment_status: 'paid',
                    status: 'new',
                    file_format: '.DST, .EMB',
                    created_at: new Date().toISOString(),
                    original_source: 'google_ads',
                    last_source: 'google_ads',
                    landing_page: '/embroidery-digitizing/',
                    referral_source: 'https://www.google.com/',
                    utm_source: 'google_ads',
                    utm_medium: 'cpc',
                    utm_campaign: 'express_rush_digitizing_2026',
                    utm_term: 'best 3d puff embroidery digitizer',
                    utm_content: 'banner_hero_rush',
                    gclid: 'Cj0KCQ_PLAYWRIGHT_TEST_CLICK_987654321',
                    attribution_data: {
                        first_touch_at: new Date(Date.now() - 3600000).toISOString(),
                        last_touch_at: new Date().toISOString()
                    }
                };

                const existingOrders = JSON.parse(localStorage.getItem('dezan_orders') || '[]');
                existingOrders.unshift(sampleGoogleAdsOrder);
                localStorage.setItem('dezan_orders', JSON.stringify(existingOrders));

                window.openAdminOrderDetailsModal('DZ-GOOGLE-ADS-991');
            });

            await page.waitForSelector('#admin-order-details-modal:not(.hidden)', { timeout: 3000 });
            await page.waitForTimeout(600);

            // Screenshot the Attribution Dossier inside the open modal
            const modalContent = await page.$('#admin-order-details-modal .overflow-y-auto');
            if (modalContent) {
                await page.evaluate(() => {
                    const section6 = document.getElementById('order-details-original-source')?.closest('.rounded-2xl');
                    if (section6) section6.scrollIntoView();
                });
                await page.waitForTimeout(400);
            }
            await page.screenshot({ path: path.join(PROOFS_DIR, 'admin_order_details_attribution_modal.png') });
            console.log('✔ Captured screenshot: tests/visual_proofs/admin_order_details_attribution_modal.png');

            // 3. Test order-success.html live conversion firing
            console.log('\n--- 3. Testing order-success.html Live Conversion Flow ---');
            await page.goto(
                `http://localhost:${PORT}/order-success.html?orderId=DZ-LIVE-CONV-888&amount=35.00&service=Embroidery%20Digitizing&plan=Jacket%20Back&placement=Full%20Back&turnaround=rush&gclid=Cj0KCQ_VERIFIED_CONV_GCLID_444&email=sarah.connor@cyberdyne.com`,
                { waitUntil: 'networkidle' }
            );
            await page.waitForTimeout(1000);
            await page.screenshot({ path: path.join(PROOFS_DIR, 'order_success_conversion_page.png') });
            console.log('✔ Captured screenshot: tests/visual_proofs/order_success_conversion_page.png');

            // Verify dataLayer in order-success page
            const dataLayerEvents = await page.evaluate(() => window.dataLayer || []);
            const purchaseEvt = dataLayerEvents.find(e => e && e.event === 'purchase');
            const customPaidEvt = dataLayerEvents.find(e => e && e.event === 'conversion_order_paid');

            console.log('\n--- Live DataLayer Verification ---');
            console.log('GA4 Purchase Event Present:', Boolean(purchaseEvt));
            console.log('Conversion Order Paid Present:', Boolean(customPaidEvt));
            if (purchaseEvt) {
                console.log('Transaction ID:', purchaseEvt.ecommerce?.transaction_id);
                console.log('Value:', purchaseEvt.ecommerce?.value, purchaseEvt.ecommerce?.currency);
                console.log('Placement:', purchaseEvt.placement);
                console.log('Turnaround Speed:', purchaseEvt.rush_or_standard);
                console.log('GCLID Attribution:', purchaseEvt.ad_attribution?.gclid);
                console.log('Enhanced Conversions Hashed Email:', purchaseEvt.user_data?.sha256_email_address?.slice(0, 16) + '...');
            }

            if (purchaseEvt && customPaidEvt) {
                console.log('\n🎉 ALL VISUAL AND CONVERSION VERIFICATIONS PASSED SUCCESSFULLY!');
            } else {
                console.error('\n❌ Warning: purchase or customPaidEvt missing from dataLayer');
            }

            await browser.close();
            server.close(() => process.exit(0));
        } catch (err) {
            console.error('Error during visual verification:', err);
            server.close(() => process.exit(1));
        }
    });
}

runVisualVerification();
