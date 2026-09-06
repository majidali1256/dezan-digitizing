const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

// Simple static HTTP server for accurate relative path & asset resolution
function startStaticServer(port = 8199) {
    const root = path.join(__dirname, '..');
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    const server = http.createServer((req, res) => {
        const parsedUrl = new URL(req.url, `http://localhost:${port}`);
        let filePath = path.join(root, decodeURIComponent(parsedUrl.pathname));
        if (filePath.endsWith('/') || fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });

    return new Promise((resolve) => {
        server.listen(port, () => {
            console.log(`Static server running on http://localhost:${port}`);
            resolve(server);
        });
    });
}

async function verifyWorkerSuite() {
    const server = await startStaticServer(8199);
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const outputDir = path.join(__dirname, '../scratch/worker_verification');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    try {
        console.log('--- 1. Verifying worker-tasks.html (Workbench Queue) ---');
        await page.goto('http://localhost:8199/worker-tasks.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        // Check task cards count
        const taskCards = await page.$$('.worker-task-card');
        console.log(`Rendered task cards on Active Workbench: ${taskCards.length}`);
        if (taskCards.length === 0) {
            throw new Error('worker-tasks.html rendered 0 task cards!');
        }

        await page.screenshot({ path: path.join(outputDir, '01_worker_tasks_all.png'), fullPage: false });

        // Test Filter: Vectorizing
        console.log('Testing Vectorizing filter...');
        const vectorPill = await page.$('button[data-filter="vectorizing"]');
        if (vectorPill) {
            await vectorPill.click();
            await page.waitForTimeout(500);
            const vectorCards = await page.$$('.worker-task-card');
            console.log(`Vectorizing filter returned ${vectorCards.length} cards.`);
            await page.screenshot({ path: path.join(outputDir, '02_worker_tasks_vectorizing.png') });
        }

        // Test Filter: All
        const allPill = await page.$('button[data-filter="all"]');
        if (allPill) await allPill.click();
        await page.waitForTimeout(500);

        // Test Specs Modal
        console.log('Testing Specs Modal click...');
        const specsBtn = await page.$('.worker-task-card button:has-text("Specs")');
        if (specsBtn) {
            await specsBtn.click();
            await page.waitForTimeout(500);
            const isModalVisible = await page.isVisible('#task-details-modal');
            console.log(`Specs modal visible: ${isModalVisible}`);
            await page.screenshot({ path: path.join(outputDir, '03_worker_specs_modal.png') });

            // Close modal
            const closeBtn = await page.$('#task-details-modal button:has-text("Close")');
            if (closeBtn) await closeBtn.click();
            await page.waitForTimeout(300);
        }

        console.log('--- 2. Verifying worker-archive.html (Completed Archive) ---');
        await page.goto('http://localhost:8199/worker-archive.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);

        const archiveCards = await page.$$('.worker-task-card');
        console.log(`Rendered archive cards: ${archiveCards.length}`);
        if (archiveCards.length === 0) {
            throw new Error('worker-archive.html rendered 0 archive cards!');
        }
        await page.screenshot({ path: path.join(outputDir, '04_worker_archive.png') });

        console.log('--- 3. Verifying worker-specs.html (SOP Guide) ---');
        await page.goto('http://localhost:8199/worker-specs.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, '05_worker_specs_guide.png') });

        console.log('--- 4. Verifying worker-portal.html (Dashboard Overview) ---');
        await page.goto('http://localhost:8199/worker-portal.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(outputDir, '06_worker_dashboard.png') });

        console.log('--- 5. Verifying Mobile Viewport (iPhone 390x844) ---');
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto('http://localhost:8199/worker-tasks.html', { waitUntil: 'networkidle' });
        await mobilePage.waitForTimeout(1000);
        await mobilePage.screenshot({ path: path.join(outputDir, '07_worker_tasks_mobile.png') });
        await mobileContext.close();

        console.log('✅ ALL WORKER STUDIO SUITE PAGES VERIFIED SUCCESSFULLY!');
    } finally {
        await browser.close();
        server.close();
    }
}

verifyWorkerSuite().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
