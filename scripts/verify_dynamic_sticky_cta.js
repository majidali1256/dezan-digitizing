const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8097;
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || '/Users/macbookair/.gemini/antigravity-ide/brain/1f959792-d5db-4b0c-847b-551ee5e3eadf';

function createStaticServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.json': 'application/json',
        '.woff2': 'font/woff2'
    };

    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(WORKSPACE_DIR, reqPath);

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
            if (!res.headersSent) res.writeHead(404);
            res.end();
        });
        stream.pipe(res);
    });
}

async function runVerification() {
    console.log('🚀 Starting Dynamic Sticky CTA Verification Suite...');
    const server = createStaticServer();
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`📡 Local static server running on http://127.0.0.1:${PORT}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    try {
        // ========================================================
        // TEST 1: Mobile Viewport (iPhone 14 Pro: 390 x 844)
        // ========================================================
        console.log('\n📱 --- TEST 1: Mobile Viewport (390 x 844) ---');
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        await mobileContext.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            sessionStorage.setItem('dezan_consent', 'all');
        });

        const page = await mobileContext.newPage();
        page.on('dialog', async dialog => {
            console.log('📢 DIALOG FIRED:', dialog.message());
            await dialog.accept();
        });
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Permanently hide cookie banner so it doesn't intercept pointer events
        await page.addStyleTag({ content: '#dezan-cookie-banner { display: none !important; pointer-events: none !important; }' });
        await page.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        // 1. Open Modal in Order Mode
        await page.evaluate(() => {
            window.openOrderQuoteModal({ service: 'Digitizing' });
        });
        await page.waitForTimeout(400);

        // Fill required fields in Step 2
        await page.fill('#dig-job-name', 'Mobile Test Falcon Logo');
        await page.selectOption('#dig-placement', 'Left Chest — $15');
        await page.fill('#dig-size', '4.0');
        await page.selectOption('#dig-fabric', 'Polo / Pique Knit');
        await page.fill('#order-client-name', 'Alex Rivera');
        await page.fill('#order-client-email', 'alex.rivera@example.com');

        // Attach artwork file if available
        const logoPath = path.join(WORKSPACE_DIR, 'logo.webp');
        if (fs.existsSync(logoPath)) {
            await page.setInputFiles('#artwork-file', logoPath);
            await page.waitForTimeout(300);
        }

        // Navigate to Step 3 (Review & Pay)
        console.log('👉 Navigating to Step 3 (Review & Pay)...');
        await page.click('#order-goto-review-btn', { force: true });
        await page.waitForTimeout(500);

        // Verify Step 3 is visible
        const step3Visible = await page.$eval('#order-step-3-view', el => !el.classList.contains('hidden'));
        assert.strictEqual(step3Visible, true, 'Step 3 must be visible');

        // Verify "Click PayPal or Card above" is GONE
        const oldNote = await page.$eval('#order-step-3-view', el => el.textContent.includes('Click PayPal or Card above') || el.textContent.includes('Click PayPal or Card button above'));
        console.log('✓ Old passive text "Click PayPal or Card above" removed:', !oldNote);
        assert.strictEqual(oldNote, false, 'Obsolete text "Click PayPal or Card above" must be completely removed');

        // STATE 1 CHECK: At top of Step 3, payment section is below visible viewport
        console.log('👉 Checking STATE 1 (Payment below viewport)...');
        const ctaStateInitial = await page.$eval('#modal-step3-dynamic-cta', el => el.getAttribute('data-cta-state'));
        const ctaTextInitial = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Initial Sticky CTA State: "${ctaStateInitial}" | Text: "${ctaTextInitial}"`);
        assert.strictEqual(ctaStateInitial, 'continue', 'Initial state must be "continue" when payment is below fold');
        assert.ok(ctaTextInitial.includes('Continue to Payment'), `Text must contain "Continue to Payment", got "${ctaTextInitial}"`);

        // Capture screenshot of State 1 (Top with sticky "Continue to Payment →")
        const shot1Path = path.join(ARTIFACTS_DIR, 'mobile_cta_state1_continue.png');
        await page.screenshot({ path: shot1Path, fullPage: false });
        console.log(`📸 Saved State 1 screenshot: ${shot1Path}`);

        // Click "Continue to Payment →"
        console.log('👉 Clicking "Continue to Payment →"...');
        await page.click('#modal-step3-dynamic-cta');
        await page.waitForTimeout(600);

        // STATE 2 CHECK: Payment section is now visible in viewport, but no method selected yet
        console.log('👉 Checking STATE 2 (Payment section visible, method unselected)...');
        const ctaStateVisible = await page.$eval('#modal-step3-dynamic-cta', el => el.getAttribute('data-cta-state'));
        const ctaTextVisible = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Scrolled Sticky CTA State: "${ctaStateVisible}" | Text: "${ctaTextVisible}"`);
        assert.strictEqual(ctaStateVisible, 'choose', 'State must become "choose" when payment section enters viewport');
        assert.strictEqual(ctaTextVisible, 'Choose Payment Method', 'Text must be "Choose Payment Method"');

        // Capture screenshot of State 2 ("Choose Payment Method")
        const shot2Path = path.join(ARTIFACTS_DIR, 'mobile_cta_state2_choose.png');
        await page.screenshot({ path: shot2Path, fullPage: false });
        console.log(`📸 Saved State 2 screenshot: ${shot2Path}`);

        // STATE 3A CHECK: Click PayPal
        console.log('👉 Selecting PayPal payment method...');
        await page.click('#modal-tab-paypal');
        await page.waitForTimeout(300);

        const ctaStatePayPal = await page.$eval('#modal-step3-dynamic-cta', el => el.getAttribute('data-cta-state'));
        const ctaTextPayPal = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ PayPal Selected CTA State: "${ctaStatePayPal}" | Text: "${ctaTextPayPal}"`);
        assert.strictEqual(ctaStatePayPal, 'paypal', 'State must become "paypal"');
        assert.strictEqual(ctaTextPayPal, 'Pay $15 with PayPal', 'Text must dynamically match "Pay $15 with PayPal"');

        // Capture screenshot of State 3A ("Pay $15 with PayPal")
        const shot3aPath = path.join(ARTIFACTS_DIR, 'mobile_cta_state3a_paypal.png');
        await page.screenshot({ path: shot3aPath, fullPage: false });
        console.log(`📸 Saved State 3A screenshot: ${shot3aPath}`);

        // STATE 3B CHECK: Click Credit / Debit Card
        console.log('👉 Selecting Credit / Debit Card payment method...');
        await page.click('#modal-tab-card');
        await page.waitForTimeout(300);

        const ctaStateCard = await page.$eval('#modal-step3-dynamic-cta', el => el.getAttribute('data-cta-state'));
        const ctaTextCard = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Card Selected CTA State: "${ctaStateCard}" | Text: "${ctaTextCard}"`);
        assert.strictEqual(ctaStateCard, 'card', 'State must become "card"');
        assert.strictEqual(ctaTextCard, 'Pay $15 by Card', 'Text must dynamically match "Pay $15 by Card"');

        // Capture screenshot of State 3B ("Pay $15 by Card")
        const shot3bPath = path.join(ARTIFACTS_DIR, 'mobile_cta_state3b_card.png');
        await page.screenshot({ path: shot3bPath, fullPage: false });
        console.log(`📸 Saved State 3B screenshot: ${shot3bPath}`);

        // STATE 4 CHECK: Scroll back up to top -> CTA should return to "Continue to Payment →"
        console.log('👉 Scrolling modal back up to top...');
        await page.evaluate(() => {
            const scrollable = document.querySelector('#order-step-3-view .overflow-y-auto');
            if (scrollable) scrollable.scrollTop = 0;
        });
        await page.waitForTimeout(400);

        const ctaStateScrolledUp = await page.$eval('#modal-step3-dynamic-cta', el => el.getAttribute('data-cta-state'));
        const ctaTextScrolledUp = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Scrolled Back Up CTA State: "${ctaStateScrolledUp}" | Text: "${ctaTextScrolledUp}"`);
        assert.strictEqual(ctaStateScrolledUp, 'continue', 'State must return to "continue" when payment scrolls out of view');
        assert.ok(ctaTextScrolledUp.includes('Continue to Payment'), 'Text must return to "Continue to Payment →"');

        // STATE 5 CHECK: Dynamic price update (Jacket Back -> $25)
        console.log('👉 Testing dynamic price update ($25.00 Jacket Back)...');
        await page.click('button[onclick*="backToOrderDetailsStep"]');
        await page.waitForTimeout(400);

        // Select Jacket Back placement ($25)
        await page.selectOption('#dig-placement', 'Jacket Back — $25');
        await page.waitForTimeout(200);

        // Proceed back to Step 3
        await page.click('#order-goto-review-btn', { force: true });
        await page.waitForTimeout(500);

        // Scroll down to payment section
        await page.click('#modal-step3-dynamic-cta');
        await page.waitForTimeout(500);

        // Select PayPal
        await page.click('#modal-tab-paypal');
        await page.waitForTimeout(300);

        const ctaText25PayPal = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Dynamic Price ($25) CTA Text: "${ctaText25PayPal}"`);
        assert.strictEqual(ctaText25PayPal, 'Pay $25 with PayPal', 'Price must dynamically reflect $25 order total');

        // Select Card
        await page.click('#modal-tab-card');
        await page.waitForTimeout(300);
        const ctaText25Card = await page.$eval('#modal-step3-cta-text', el => el.textContent.trim());
        console.log(`✓ Dynamic Price ($25 Card) CTA Text: "${ctaText25Card}"`);
        assert.strictEqual(ctaText25Card, 'Pay $25 by Card', 'Price must dynamically reflect $25 order total');

        // Capture screenshot of dynamic price
        const shotPricePath = path.join(ARTIFACTS_DIR, 'mobile_cta_dynamic_price_25.png');
        await page.screenshot({ path: shotPricePath, fullPage: false });
        console.log(`📸 Saved Dynamic Price screenshot: ${shotPricePath}`);

        await mobileContext.close();

        // ========================================================
        // TEST 2: Desktop Viewport (1512 x 982) & Quote Mode Check
        // ========================================================
        console.log('\n💻 --- TEST 2: Desktop Viewport & Quote Mode ---');
        const desktopContext = await browser.newContext({
            viewport: { width: 1512, height: 982 },
            deviceScaleFactor: 2
        });
        await desktopContext.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            sessionStorage.setItem('dezan_consent', 'all');
        });

        const desktopPage = await desktopContext.newPage();
        desktopPage.on('dialog', async dialog => {
            console.log('📢 DESKTOP DIALOG FIRED:', dialog.message());
            await dialog.accept();
        });
        await desktopPage.goto(`http://127.0.0.1:${PORT}/pricing.html`, { waitUntil: 'domcontentloaded' });
        await desktopPage.waitForTimeout(500);
        await desktopPage.addStyleTag({ content: '#dezan-cookie-banner { display: none !important; pointer-events: none !important; }' });
        await desktopPage.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        // Open in Quote Mode
        await desktopPage.evaluate(() => {
            window.openOrderQuoteModal({ service: 'PetPortrait', isQuote: true });
        });
        await desktopPage.waitForTimeout(400);

        await desktopPage.fill('#dig-job-name', 'Desktop Quote Test Pet');
        await desktopPage.fill('#dig-size', '4.0');
        await desktopPage.selectOption('#dig-fabric', 'Polo / Pique Knit');
        await desktopPage.fill('#order-client-name', 'Dana White');
        await desktopPage.fill('#order-client-email', 'dana@gym.com');
        await desktopPage.click('#order-goto-review-btn', { force: true });
        await desktopPage.waitForTimeout(500);

        // In Quote Mode, the dynamic payment CTA must be hidden
        const dynamicCtaHidden = await desktopPage.$eval('#modal-step3-dynamic-cta', el => el.classList.contains('hidden'));
        const quoteSubmitVisible = await desktopPage.$eval('#adaptive-order-submit-btn', el => !el.classList.contains('hidden'));
        const quoteSubmitText = await desktopPage.$eval('#adaptive-order-submit-btn', el => el.textContent.trim());

        console.log('✓ Quote Mode: Dynamic Payment CTA hidden:', dynamicCtaHidden);
        console.log('✓ Quote Mode: Submit Quote Button visible:', quoteSubmitVisible);
        console.log(`✓ Quote Mode Button Text: "${quoteSubmitText}"`);
        assert.strictEqual(dynamicCtaHidden, true, 'Payment CTA must be hidden in quote mode');
        assert.strictEqual(quoteSubmitVisible, true, 'Quote submit button must be visible in quote mode');

        const shotQuotePath = path.join(ARTIFACTS_DIR, 'desktop_quote_mode_step3.png');
        await desktopPage.screenshot({ path: shotQuotePath, fullPage: false });
        console.log(`📸 Saved Desktop Quote Mode screenshot: ${shotQuotePath}`);

        await desktopContext.close();

        console.log('\n🎉 ALL 10 DYNAMIC STICKY CTA VERIFICATIONS PASSED SUCCESSFULLY!');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Verification Failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
        server.close();
    }
}

runVerification();
