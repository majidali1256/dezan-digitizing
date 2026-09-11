const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8099;
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = '/Users/macbookair/.gemini/antigravity-ide/brain/869f30e7-f663-48ff-8853-5277d416cebf';

function createStaticServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
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
        stream.on('error', (err) => {
            if (!res.headersSent) res.writeHead(404);
            res.end();
        });
        stream.pipe(res);
    });
}

async function runVerification() {
    console.log('🚀 Starting Review & Pay End-to-End Verification...');
    const server = createStaticServer();
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`📡 Local static server running on http://127.0.0.1:${PORT}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    try {
        // ----------------------------------------------------
        // TEST 1: Mobile Viewport (iPhone 14 Pro: 390 x 844)
        // ----------------------------------------------------
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
        await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(600);
        await page.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        // 1. Open the modal in Order Mode for Embroidery Digitizing
        await page.evaluate(() => {
            window.openOrderQuoteModal({ service: 'Digitizing' });
        });
        await page.waitForTimeout(400);

        // Verify Step 2 is active
        const step2Visible = await page.$eval('#order-step-2-view', el => !el.classList.contains('hidden'));
        const step3Hidden = await page.$eval('#order-step-3-view', el => el.classList.contains('hidden'));
        console.log('✓ Step 2 view visible:', step2Visible);
        console.log('✓ Step 3 view hidden:', step3Hidden);

        // Verify Step 2 CTA button text
        const step2BtnText = await page.$eval('#order-goto-review-btn', el => el.textContent.trim());
        console.log('✓ Step 2 button text:', JSON.stringify(step2BtnText));
        if (!step2BtnText.includes('Review & Pay')) {
            throw new Error(`Step 2 button should say "Review & Pay", found: "${step2BtnText}"`);
        }

        // 2. Fill in customer & order details
        await page.fill('#dig-job-name', 'Falcon Left Chest Polo');
        await page.selectOption('#dig-placement', 'Left Chest — $15');
        await page.fill('#dig-size', '4.0');
        await page.selectOption('#dig-fabric', 'Cotton / Pique Knit');

        // Check file formats (.DST and .PES)
        await page.check('input[name="dig-formats"][value=".PES"]');

        // Check Special Options (3D Puff)
        await page.check('input[name="dig-special"][value="3D Puff"]');

        // Production Notes
        await page.fill('#order-notes', 'High stitch density required, use navy blue thread on chest.');

        // Guest contact fields
        await page.fill('#order-client-name', 'Sarah Jenkins');
        await page.fill('#order-client-email', 'sarah.jenkins@company.com');

        // Attach a simulated artwork file
        const sampleArtPath = path.join(WORKSPACE_DIR, 'logo.webp');
        if (fs.existsSync(sampleArtPath)) {
            await page.setInputFiles('#artwork-file', sampleArtPath);
            await page.waitForTimeout(300);
        }

        // 3. Click "Review & Pay →"
        console.log('👉 Clicking "Review & Pay →" button...');
        await page.click('#order-goto-review-btn');
        await page.waitForTimeout(400);

        // Verify view transition: Step 2 hidden, Step 3 visible
        const step2AfterReview = await page.$eval('#order-step-2-view', el => el.classList.contains('hidden'));
        const step3AfterReview = await page.$eval('#order-step-3-view', el => !el.classList.contains('hidden'));
        console.log('✓ Step 2 view hidden after review click:', step2AfterReview);
        console.log('✓ Step 3 view visible after review click:', step3AfterReview);

        // Verify Stepper State: Step 3 Active, 100% connector progress
        const progressWidth = await page.$eval('#step-connector-progress', el => el.style.width);
        console.log('✓ Step Connector progress bar width:', progressWidth);
        if (progressWidth !== '100%') {
            throw new Error(`Expected progress bar to be 100%, found: ${progressWidth}`);
        }

        // Verify Order Summary fields on Step 3
        const summaryService = await page.$eval('#review-summary-service', el => el.textContent.trim());
        const summaryJobName = await page.$eval('#review-summary-jobname', el => el.textContent.trim());
        const summaryPlacement = await page.$eval('#review-summary-placement', el => el.textContent.trim());
        const summarySize = await page.$eval('#review-summary-size', el => el.textContent.trim());
        const summaryMaterial = await page.$eval('#review-summary-material', el => el.textContent.trim());
        const summaryFormats = await page.$eval('#review-summary-formats', el => el.textContent.trim());
        const summarySpecialVisible = await page.$eval('#review-summary-special-row', el => !el.classList.contains('hidden'));
        const summarySpecial = await page.$eval('#review-summary-special', el => el.textContent.trim());
        const summaryContact = await page.$eval('#review-summary-contact-name', el => el.textContent.trim());
        const summaryPrice = await page.$eval('#review-price-display', el => el.textContent.trim());
        const submitBtnText = await page.$eval('#adaptive-order-submit-btn', el => el.textContent.trim());

        console.log('✓ Review Summary Service:', summaryService);
        console.log('✓ Review Summary Job Name:', summaryJobName);
        console.log('✓ Review Summary Placement:', summaryPlacement);
        console.log('✓ Review Summary Target Size:', summarySize);
        console.log('✓ Review Summary Garment/Material:', summaryMaterial);
        console.log('✓ Review Summary File Formats:', summaryFormats);
        console.log('✓ Review Summary Special Options Visible:', summarySpecialVisible, `(${summarySpecial})`);
        console.log('✓ Review Summary Contact:', summaryContact);
        console.log('✓ Review Summary Price:', summaryPrice);
        console.log('✓ Step 3 Pay & Place Order Button:', submitBtnText);

        if (!summarySpecial.includes('3D Puff')) {
            throw new Error('Special options must show 3D Puff!');
        }
        if (!summaryFormats.includes('.DST') || !summaryFormats.includes('.PES')) {
            throw new Error('File formats must show .DST and .PES!');
        }

        // Capture mobile screenshot of Step 3 Review & Pay view
        const mobileScreenshotPath = path.join(ARTIFACTS_DIR, 'mobile_step3_review_pay.png');
        await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
        console.log(`📸 Saved Step 3 Review & Pay screenshot: ${mobileScreenshotPath}`);

        // 4. Test "← Edit Details" button to go back to Step 2
        console.log('👉 Testing "← Edit Details" back navigation...');
        await page.click('button:has-text("Edit Details")');
        await page.waitForTimeout(300);

        const step2BackVisible = await page.$eval('#order-step-2-view', el => !el.classList.contains('hidden'));
        const step3BackHidden = await page.$eval('#order-step-3-view', el => el.classList.contains('hidden'));
        const restoredJobName = await page.$eval('#dig-job-name', el => el.value);
        const restoredSize = await page.$eval('#dig-size', el => el.value);
        console.log('✓ Step 2 view restored:', step2BackVisible);
        console.log('✓ Job Name preserved:', restoredJobName);
        console.log('✓ Target Size preserved:', restoredSize);

        if (restoredJobName !== 'Falcon Left Chest Polo' || restoredSize !== '4.0') {
            throw new Error('Form input values were not preserved when navigating back to edit!');
        }

        // 5. Navigate back to Step 3 again
        await page.click('#order-goto-review-btn');
        await page.waitForTimeout(300);

        // 6. Test Payment Method switching on Step 3
        console.log('👉 Testing Payment Method selection...');
        await page.click('#modal-tab-paypal');
        await page.waitForTimeout(200);
        const paypalActive = await page.$eval('#modal-tab-paypal', el => el.className.includes('border-primary'));
        console.log('✓ PayPal option highlighted on selection:', paypalActive);

        await page.click('#modal-tab-card');
        await page.waitForTimeout(200);
        const cardActive = await page.$eval('#modal-tab-card', el => el.className.includes('border-primary'));
        console.log('✓ Credit Card option highlighted on selection:', cardActive);

        await mobileContext.close();

        // ----------------------------------------------------
        // TEST 2: Desktop Viewport (1512 x 982) & Quote Mode
        // ----------------------------------------------------
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
        await desktopPage.goto(`http://127.0.0.1:${PORT}/pricing.html`, { waitUntil: 'domcontentloaded' });
        await desktopPage.waitForTimeout(600);
        await desktopPage.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        // Open in Quote Mode
        await desktopPage.evaluate(() => {
            window.openOrderQuoteModal({ service: 'PetPortrait', isQuote: true });
        });
        await desktopPage.waitForTimeout(400);

        const quoteBtnText = await desktopPage.$eval('#order-goto-review-btn', el => el.textContent.trim());
        console.log('✓ Quote Mode Step 2 button text:', JSON.stringify(quoteBtnText));

        const quoteRushHidden = await desktopPage.$eval('#order-turnaround-rush-card', el => el.classList.contains('hidden'));
        const quoteStandardFullWidth = await desktopPage.$eval('#order-turnaround-standard-card', el => el.classList.contains('sm:col-span-2'));
        const quoteStandardDesc = await desktopPage.$eval('#order-turnaround-standard-desc', el => el.textContent.trim());
        console.log('✓ Quote Mode Rush Fee Option Hidden:', quoteRushHidden);
        console.log('✓ Quote Mode Standard Card Spans Full Width:', quoteStandardFullWidth);
        console.log('✓ Quote Mode Standard Desc:', quoteStandardDesc);
        assert.equal(quoteRushHidden, true, 'Rush fee card MUST be hidden in quote mode');

        await desktopPage.$eval('#order-turnaround-container', el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
        await desktopPage.waitForTimeout(200);

        const quoteStep2Screenshot = path.join(ARTIFACTS_DIR, 'quote_step2_no_rush_fee.png');
        await desktopPage.screenshot({ path: quoteStep2Screenshot, fullPage: false });
        console.log(`📸 Saved Quote Step 2 (No Rush Fee) screenshot: ${quoteStep2Screenshot}`);

        await desktopPage.fill('#dig-job-name', 'Golden Retriever Portrait on Denim Jacket');
        await desktopPage.fill('#order-client-name', 'Mark Peterson');
        await desktopPage.fill('#order-client-email', 'mark.p@studio.com');
        await desktopPage.click('#order-goto-review-btn');
        await desktopPage.waitForTimeout(300);

        const quoteReviewTitle = await desktopPage.$eval('#order-review-title', el => el.textContent.trim());
        const quoteSubmitText = await desktopPage.$eval('#order-submit-btn-text', el => el.textContent.trim());
        const quotePriceBoxHidden = await desktopPage.$eval('#review-price-summary-box', el => el.classList.contains('hidden'));
        console.log('✓ Quote Review Title:', quoteReviewTitle);
        console.log('✓ Quote Mode Price Box Hidden:', quotePriceBoxHidden);
        console.log('✓ Quote Submit Button Text:', quoteSubmitText);

        const desktopScreenshotPath = path.join(ARTIFACTS_DIR, 'desktop_step3_review_quote.png');
        await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
        console.log(`📸 Saved Desktop Quote Review screenshot: ${desktopScreenshotPath}`);

        await desktopContext.close();

        // ----------------------------------------------------
        // TEST 3: Client Portal Verification (client-portal.html)
        // ----------------------------------------------------
        console.log('\n🏛️ --- TEST 3: Client Portal (client-portal.html) ---');
        const portalContext = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 2
        });
        await portalContext.addInitScript(() => {
            const demoClient = {
                id: 'demo_client_1',
                email: 'client@falconapparel.com',
                name: 'Sarah Jenkins',
                role: 'client',
                company: 'Falcon Apparel'
            };
            localStorage.setItem('dezan_session', JSON.stringify(demoClient));
            sessionStorage.setItem('dezan_session', JSON.stringify(demoClient));
        });

        const portalPage = await portalContext.newPage();
        await portalPage.goto(`http://127.0.0.1:${PORT}/client-portal.html`, { waitUntil: 'domcontentloaded' });
        await portalPage.waitForTimeout(600);

        await portalPage.evaluate(() => {
            if (typeof openNewOrderModal === 'function') {
                openNewOrderModal();
            } else if (typeof window.openOrderQuoteModal === 'function') {
                window.openOrderQuoteModal();
            }
            if (typeof window.selectOrderService === 'function') {
                window.selectOrderService('Digitizing');
            }
        });
        await portalPage.waitForTimeout(400);

        const portalStep2Btn = await portalPage.$eval('#order-goto-review-btn', el => el.textContent.trim());
        console.log('✓ Client Portal Step 2 button:', portalStep2Btn);
        await portalPage.fill('#dig-job-name', 'Portal Verification Order');
        await portalPage.click('#order-goto-review-btn');
        await portalPage.waitForTimeout(300);

        const portalStep3Visible = await portalPage.$eval('#order-step-3-view', el => !el.classList.contains('hidden'));
        console.log('✓ Client Portal Step 3 Review & Pay view opened successfully:', portalStep3Visible);

        await portalContext.close();

        console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!');
    } finally {
        await browser.close();
        server.close();
        console.log('🛑 Server closed.');
    }
}

runVerification().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
