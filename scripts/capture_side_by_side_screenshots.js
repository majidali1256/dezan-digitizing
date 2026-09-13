const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8098;
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || '/Users/macbookair/.gemini/antigravity-ide/brain/1f959792-d5db-4b0c-847b-551ee5e3eadf';

function createStaticServer() {
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
    };

    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const filePath = path.join(WORKSPACE_DIR, reqPath);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    });
}

async function capture() {
    const server = createStaticServer();
    await new Promise(r => server.listen(PORT, r));
    console.log(`Server up on ${PORT}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // Desktop
    const context = await browser.newContext({
        viewport: { width: 1512, height: 982 },
        deviceScaleFactor: 2
    });
    await context.addInitScript(() => {
        localStorage.setItem('dezan_consent', 'all');
        sessionStorage.setItem('dezan_consent', 'all');
    });

    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.evaluate(() => {
        const b = document.getElementById('dezan-cookie-banner');
        if (b) b.remove();
        window.openOrderQuoteModal({ service: 'Digitizing' });
    });
    await page.waitForTimeout(400);

    await page.fill('#dig-job-name', 'Vector & Embroidery Shield');
    await page.selectOption('#dig-placement', 'Left Chest — $15');
    await page.fill('#dig-size', '4.0');
    await page.selectOption('#dig-fabric', 'Polo / Pique Knit');
    await page.fill('#order-client-name', 'Alexander Vance');
    await page.fill('#order-client-email', 'alex@example.com');

    const sampleArtPath = path.join(WORKSPACE_DIR, 'logo.webp');
    if (fs.existsSync(sampleArtPath)) {
        await page.setInputFiles('#artwork-file', sampleArtPath);
        await page.waitForTimeout(300);
    }

    await page.click('#order-goto-review-btn');
    await page.waitForTimeout(600);

    // Wait for Step 3 view
    await page.waitForSelector('#order-step-3-view:not(.hidden)');
    await page.waitForTimeout(500);

    const paymentBox = await page.$('#order-payment-terms-box');
    if (paymentBox) {
        await paymentBox.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await paymentBox.screenshot({ path: path.join(ARTIFACTS_DIR, 'step3_payment_box_paypal.png') });
        console.log('Saved PayPal active screenshot of payment box');
    }

    // 2. Click Credit / Debit Card
    await page.click('#modal-tab-card');
    await page.waitForTimeout(400);
    if (paymentBox) {
        await paymentBox.screenshot({ path: path.join(ARTIFACTS_DIR, 'step3_payment_box_card.png') });
        console.log('Saved Card active screenshot of payment box');
    }
    await context.close();

    // Mobile Viewport
    const mobileCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
    });
    await mobileCtx.addInitScript(() => {
        localStorage.setItem('dezan_consent', 'all');
        sessionStorage.setItem('dezan_consent', 'all');
    });
    const mobilePage = await mobileCtx.newPage();
    await mobilePage.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await mobilePage.evaluate(() => {
        const b = document.getElementById('dezan-cookie-banner');
        if (b) b.remove();
        window.openOrderQuoteModal({ service: 'Digitizing' });
    });
    await mobilePage.waitForTimeout(400);
    await mobilePage.fill('#dig-job-name', 'Mobile Left Chest');
    await mobilePage.selectOption('#dig-placement', 'Left Chest — $15');
    await mobilePage.fill('#dig-size', '4.0');
    await mobilePage.selectOption('#dig-fabric', 'Polo / Pique Knit');
    await mobilePage.fill('#order-client-name', 'Mobile User');
    await mobilePage.fill('#order-client-email', 'mobile@example.com');
    if (fs.existsSync(sampleArtPath)) {
        await mobilePage.setInputFiles('#artwork-file', sampleArtPath);
    }
    await mobilePage.click('#order-goto-review-btn');
    await mobilePage.waitForSelector('#order-step-3-view:not(.hidden)');
    await mobilePage.waitForTimeout(400);

    const mPaymentBox = await mobilePage.$('#order-payment-terms-box');
    if (mPaymentBox) {
        await mPaymentBox.scrollIntoViewIfNeeded();
        await mobilePage.waitForTimeout(300);
        await mPaymentBox.screenshot({ path: path.join(ARTIFACTS_DIR, 'mobile_step3_payment_box.png') });
        console.log('Saved Mobile payment box screenshot');
    }
    await mobileCtx.close();

    await browser.close();
    server.close();
    console.log('Done!');
}

capture().catch(err => {
    console.error(err);
    process.exit(1);
});
