const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8099;
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || '/Users/macbookair/.gemini/antigravity-ide/brain/1f959792-d5db-4b0c-847b-551ee5e3eadf';

function createStaticServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.ico': 'image/x-icon'
    };

    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
        if (reqPath === '/order' || reqPath === '/order/') reqPath = '/order.html';

        const filePath = path.join(WORKSPACE_DIR, reqPath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found: ' + reqPath);
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    });
}

async function runVerification() {
    console.log('🚀 Starting Comprehensive Dedicated Order Flow Verification...');
    const server = createStaticServer();
    await new Promise(r => server.listen(PORT, r));
    console.log(`✅ Static server running on http://127.0.0.1:${PORT}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    let passedTests = 0;
    const totalTests = 8;

    try {
        // =========================================================================
        // TEST 1: Service Selector Modal in Order Mode redirects to /order
        // =========================================================================
        console.log('\n--- Test 1: Service Modal Redirect in Order Mode ---');
        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        await context.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            localStorage.setItem('dezan_cookie_consent', 'all');
            localStorage.setItem('dezan_analytics_consent', 'true');
            sessionStorage.setItem('dezan_consent', 'all');
            sessionStorage.setItem('dezan_cookie_consent', 'all');
        });

        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${PORT}/index.html?utm_source=google_ads&gclid=TEST_CLICK_ID_999`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Open Choose Service modal in Order mode
        await page.evaluate(() => {
            window.openOrderQuoteModal({ isQuote: false });
        });
        await page.waitForTimeout(300);

        const modalVisible = await page.evaluate(() => {
            const m = document.getElementById('new-order-modal') || document.getElementById('guest-checkout-modal');
            return m && !m.classList.contains('hidden');
        });
        assert.ok(modalVisible, 'Service selector modal must open');
        console.log('  ✔ Service selector modal is open');

        // Click "Embroidery Digitizing" card inside modal
        console.log('  → Clicking Embroidery Digitizing card...');
        await Promise.all([
            page.waitForURL(url => url.pathname.includes('/order') || url.pathname.includes('/order.html')),
            page.click('button[onclick*="selectOrderService(\'Digitizing\')"]')
        ]);

        const currentUrl = page.url();
        console.log(`  ✔ Navigated to dedicated order page: ${currentUrl}`);
        assert.ok(currentUrl.includes('service=embroidery'), 'URL must contain ?service=embroidery');
        assert.ok(currentUrl.includes('gclid=TEST_CLICK_ID_999'), 'Attribution gclid must be preserved in URL');
        passedTests++;

        // =========================================================================
        // TEST 2: Deep-linking with Placement & Service parameters
        // =========================================================================
        console.log('\n--- Test 2: Deep-linking (?service=embroidery&placement=cap) ---');
        await page.goto(`http://127.0.0.1:${PORT}/order?service=embroidery&placement=cap`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);

        const deepLinkState = await page.evaluate(() => {
            const placementVal = document.getElementById('dig-placement')?.value;
            const headerText = document.getElementById('header-selected-service-text')?.innerText;
            const calcPrice = window.calculatePrice ? window.calculatePrice() : 0;
            return { placementVal, headerText, calcPrice };
        });

        console.log(`  Selected placement: "${deepLinkState.placementVal}"`);
        console.log(`  Header service text: "${deepLinkState.headerText}"`);
        console.log(`  Calculated price: "$${deepLinkState.calcPrice.toFixed(2)}"`);

        assert.ok(deepLinkState.placementVal.includes('Cap') || deepLinkState.placementVal.includes('Hat'), 'Placement "cap" should map to Cap / Hat Front');
        assert.ok(deepLinkState.headerText.includes('Embroidery Digitizing'), 'Header should display Embroidery Digitizing');
        assert.strictEqual(deepLinkState.calcPrice, 15.00, 'Initial base price should be 15.00');
        passedTests++;

        // =========================================================================
        // TEST 3: Draft Persistence across Page Reload
        // =========================================================================
        console.log('\n--- Test 3: Input & File Draft Persistence across Page Reload ---');
        // Fill form fields
        await page.fill('#dig-job-name', 'Thunderbird Logistics Logo');
        await page.fill('#dig-size', '3.25');
        await page.selectOption('#dig-fabric', 'Structured Cap / Hat (Richardson 112, Yupoong)');
        await page.fill('#order-notes', 'High stitch density on front 3D puff embroidery, minimize jump stitches.');
        await page.fill('#order-client-name', 'Michael Vance');
        await page.fill('#order-client-email', 'mvance@thunderbird.com');

        // Select Rush Turnaround (+$5)
        await page.click('input[name="turnaround"][value="rush"]');
        await page.waitForTimeout(300);

        const priceAfterRush = await page.evaluate(() => window.calculatePrice ? window.calculatePrice() : 0);
        console.log(`  Price after rush toggle: $${priceAfterRush.toFixed(2)}`);
        assert.strictEqual(priceAfterRush, 20.00, 'Price must reflect $15 base + $5 rush = $20');

        // Simulate real file upload via setInputFiles
        const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        await page.setInputFiles('#artwork-file', {
            name: 'thunderbird_logo_vector.png',
            mimeType: 'image/png',
            buffer: buffer
        });
        await page.waitForTimeout(600);

        // Accidentally/intentionally reload the page
        console.log('  → Reloading page to test draft restoration...');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(800);

        const restoredState = await page.evaluate(() => {
            const bannerVisible = !document.getElementById('draft-alert-banner')?.classList.contains('hidden');
            const jobName = document.getElementById('dig-job-name')?.value;
            const size = document.getElementById('dig-size')?.value;
            const fabric = document.getElementById('dig-fabric')?.value;
            const notes = document.getElementById('order-notes')?.value;
            const clientName = document.getElementById('order-client-name')?.value;
            const clientEmail = document.getElementById('order-client-email')?.value;
            const rushChecked = document.querySelector('input[name="turnaround"][value="rush"]')?.checked;
            const price = window.calculatePrice ? window.calculatePrice() : 0;
            const fileChips = document.querySelectorAll('#uploaded-files-list > div').length;
            return { bannerVisible, jobName, size, fabric, notes, clientName, clientEmail, rushChecked, price, fileChips };
        });

        console.log('  Restored State:', restoredState);
        assert.ok(restoredState.bannerVisible, 'Draft alert banner should be visible');
        assert.strictEqual(restoredState.jobName, 'Thunderbird Logistics Logo', 'Job name must be restored');
        assert.strictEqual(restoredState.size, '3.25', 'Size must be restored');
        assert.strictEqual(restoredState.fabric, 'Structured Cap / Hat (Richardson 112, Yupoong)', 'Fabric must be restored');
        assert.strictEqual(restoredState.notes, 'High stitch density on front 3D puff embroidery, minimize jump stitches.', 'Notes must be restored');
        assert.strictEqual(restoredState.clientName, 'Michael Vance', 'Client name must be restored');
        assert.strictEqual(restoredState.clientEmail, 'mvance@thunderbird.com', 'Client email must be restored');
        assert.strictEqual(restoredState.rushChecked, true, 'Rush turnaround must stay checked');
        assert.strictEqual(restoredState.price, 20.00, 'Price must stay 20.00');
        assert.ok(restoredState.fileChips >= 1, 'Uploaded artwork file must be restored from storage');
        passedTests++;

        // =========================================================================
        // TEST 4: Step 2 -> Step 3 Transition & GA4 Funnel Events
        // =========================================================================
        await page.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });
        await page.click('#order-goto-review-btn', { force: true });
        await page.waitForTimeout(500);

        const step3Visibility = await page.evaluate(() => {
            const step2Hidden = document.getElementById('order-step-2-view')?.classList.contains('hidden');
            const step3Visible = !document.getElementById('order-step-3-view')?.classList.contains('hidden');
            const reviewJobName = document.getElementById('review-job-name')?.innerText;
            const reviewPlacement = document.getElementById('review-placement')?.innerText;
            const reviewTotal = document.getElementById('review-total-price')?.innerText;
            return { step2Hidden, step3Visible, reviewJobName, reviewPlacement, reviewTotal };
        });

        console.log('  Step 3 Visibility & Summary:', step3Visibility);
        assert.ok(step3Visibility.step2Hidden, 'Step 2 must be hidden');
        assert.ok(step3Visibility.step3Visible, 'Step 3 must be visible');
        assert.strictEqual(step3Visibility.reviewJobName, 'Thunderbird Logistics Logo', 'Summary card must show job name');
        assert.ok(step3Visibility.reviewPlacement.includes('Cap') || step3Visibility.reviewPlacement.includes('Hat'), 'Summary card must show placement');
        assert.strictEqual(step3Visibility.reviewTotal, '$20.00', 'Summary card must show $20.00 total');

        // Check GA4 Funnel events in dataLayer
        const dataLayerEvents = await page.evaluate(() => {
            return (window.dataLayer || []).map(e => e?.event).filter(Boolean);
        });
        console.log('  dataLayer events recorded:', dataLayerEvents);
        assert.ok(dataLayerEvents.includes('order_started'), 'order_started must be in dataLayer');
        assert.ok(dataLayerEvents.includes('order_details_completed'), 'order_details_completed must be in dataLayer');
        assert.ok(dataLayerEvents.includes('begin_checkout'), 'begin_checkout must be in dataLayer');
        passedTests++;

        // =========================================================================
        // TEST 5: Step 3 Back Navigation ("← Edit Order Details")
        // =========================================================================
        console.log('\n--- Test 5: Back Navigation ("← Edit Order Details") ---');
        await page.evaluate(() => window.backToOrderDetailsStep());
        await page.waitForTimeout(400);

        const step2Restored = await page.evaluate(() => {
            const step2Visible = !document.getElementById('order-step-2-view')?.classList.contains('hidden');
            const step3Hidden = document.getElementById('order-step-3-view')?.classList.contains('hidden');
            const jobName = document.getElementById('dig-job-name')?.value;
            return { step2Visible, step3Hidden, jobName };
        });
        assert.ok(step2Restored.step2Visible, 'Step 2 must be visible again');
        assert.ok(step2Restored.step3Hidden, 'Step 3 must be hidden again');
        assert.strictEqual(step2Restored.jobName, 'Thunderbird Logistics Logo', 'Form values must remain intact after back navigation');
        console.log('  ✔ Step 2 successfully restored with data intact');
        passedTests++;

        // Return to Step 3 for payment testing
        await page.click('#order-goto-review-btn', { force: true });
        await page.waitForTimeout(400);

        // =========================================================================
        // TEST 6: Side-by-Side Payment Selector (PayPal vs Card)
        // =========================================================================
        console.log('\n--- Test 6: Side-by-Side Payment Selector (PayPal vs Card) ---');
        const paymentSelectorState = await page.evaluate(() => {
            const paypalTab = document.getElementById('modal-tab-paypal');
            const cardTab = document.getElementById('modal-tab-card');
            return {
                paypalHasGoldBorder: paypalTab?.classList.contains('border-primary'),
                cardHasGoldBorder: cardTab?.classList.contains('border-primary')
            };
        });

        console.log('  Initial payment selector state:', paymentSelectorState);
        assert.strictEqual(paymentSelectorState.paypalHasGoldBorder, true, 'PayPal tab should have active gold border by default');
        assert.strictEqual(paymentSelectorState.cardHasGoldBorder, false, 'Card tab should not have gold border initially');

        // Click Card Tab
        console.log('  → Switching to Credit / Debit Card tab...');
        await page.click('#modal-tab-card');
        await page.waitForTimeout(300);

        const cardSelectedState = await page.evaluate(() => {
            const cardTab = document.getElementById('modal-tab-card');
            const paypalTab = document.getElementById('modal-tab-paypal');
            const instruction = document.getElementById('modal-payment-instruction')?.innerText;
            return {
                cardGoldBorder: cardTab?.classList.contains('border-primary'),
                paypalGoldBorder: paypalTab?.classList.contains('border-primary'),
                instruction
            };
        });

        assert.strictEqual(cardSelectedState.cardGoldBorder, true, 'Card tab must have active gold border');
        assert.strictEqual(cardSelectedState.paypalGoldBorder, false, 'PayPal tab must be inactive');
        console.log('  ✔ Credit / Debit Card tab activated');

        // Check that add_payment_info event was dispatched
        const paymentEvents = await page.evaluate(() => {
            return (window.dataLayer || []).filter(e => e?.event === 'add_payment_info');
        });
        assert.ok(paymentEvents.length >= 1, 'add_payment_info must be dispatched');
        console.log('  ✔ add_payment_info event verified in dataLayer');
        passedTests++;

        // =========================================================================
        // TEST 7: Quote Modal Remains Popup Modal (Zero Redirection)
        // =========================================================================
        console.log('\n--- Test 7: Free Quote Mode Remains in Popup Modal ---');
        const quotePage = await context.newPage();
        await quotePage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
        await quotePage.waitForTimeout(500);

        // Open modal in Quote mode
        await quotePage.evaluate(() => {
            window.openOrderQuoteModal({ isQuote: true });
        });
        await quotePage.waitForTimeout(300);

        const quoteModalState = await quotePage.evaluate(() => {
            const title = document.getElementById('order-modal-header-text')?.innerText;
            const desc = document.getElementById('order-modal-header-desc')?.innerText;
            return { title, desc };
        });

        console.log('  Quote modal opened:', quoteModalState);
        assert.ok(quoteModalState.title.includes('Quote'), 'Modal title must be Free Quote');

        // Click service inside Quote modal
        await quotePage.click('button[onclick*="selectOrderService(\'Digitizing\')"]');
        await quotePage.waitForTimeout(400);

        const postClickUrl = quotePage.url();
        const step2InModal = await quotePage.evaluate(() => {
            const m = document.getElementById('new-order-modal');
            const step2 = document.getElementById('order-step-2-view');
            const form = document.getElementById('adaptive-order-form');
            return m && !m.classList.contains('hidden') && form && !form.classList.contains('hidden');
        });

        console.log(`  URL after clicking service in Quote Mode: ${postClickUrl}`);
        assert.ok(!postClickUrl.includes('/order'), 'Quote flow must NOT redirect to /order');
        assert.ok(step2InModal, 'Quote flow Step 2 must remain open inside the popup modal');
        console.log('  ✔ Free Quote flow correctly preserved inside popup modal');
        passedTests++;

        // =========================================================================
        // TEST 8: Visual Screenshot Capture (Desktop & Mobile 390px)
        // =========================================================================
        console.log('\n--- Test 8: Visual Screenshots of /order Flow ---');
        // Capture Step 3 Review & Pay on Desktop
        await page.screenshot({
            path: path.join(ARTIFACTS_DIR, 'order_page_step3_desktop.png'),
            fullPage: false
        });
        console.log('  ✔ Desktop Step 3 screenshot captured');

        // Capture Step 2 Details on Desktop
        await page.evaluate(() => window.backToOrderDetailsStep());
        await page.waitForTimeout(300);
        await page.screenshot({
            path: path.join(ARTIFACTS_DIR, 'order_page_step2_desktop.png'),
            fullPage: false
        });
        console.log('  ✔ Desktop Step 2 screenshot captured');

        // Mobile Viewport (iPhone 14 / 390x844)
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true
        });
        await mobileContext.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            sessionStorage.setItem('dezan_consent', 'all');
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto(`http://127.0.0.1:${PORT}/order?service=embroidery&placement=cap`, { waitUntil: 'domcontentloaded' });
        await mobilePage.waitForTimeout(600);

        // Mobile Step 2 Screenshot
        await mobilePage.screenshot({
            path: path.join(ARTIFACTS_DIR, 'order_page_step2_mobile.png'),
            fullPage: false
        });
        console.log('  ✔ Mobile Step 2 screenshot captured');

        // Fill required fields on mobile and proceed to Step 3
        await mobilePage.fill('#dig-job-name', 'Mobile Test Hat');
        await mobilePage.fill('#dig-size', '2.5');
        await mobilePage.fill('#order-client-name', 'Sarah Mobile');
        await mobilePage.fill('#order-client-email', 'sarah@mobile.com');
        await mobilePage.setInputFiles('#artwork-file', {
            name: 'mobile_logo.png',
            mimeType: 'image/png',
            buffer: buffer
        });
        await mobilePage.waitForTimeout(400);
        await mobilePage.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });
        await mobilePage.click('#order-goto-review-btn', { force: true });
        await mobilePage.waitForTimeout(500);

        // Mobile Step 3 Screenshot
        await mobilePage.screenshot({
            path: path.join(ARTIFACTS_DIR, 'order_page_step3_mobile.png'),
            fullPage: false
        });
        console.log('  ✔ Mobile Step 3 screenshot captured');
        passedTests++;

        console.log(`\n🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);

    } finally {
        await browser.close();
        server.close();
        console.log('Static server closed.');
    }
}

runVerification().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
