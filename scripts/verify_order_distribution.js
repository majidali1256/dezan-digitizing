const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

function startStaticServer(port = 8244) {
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
        if (filePath.endsWith('/') || (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory())) {
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

async function verifyOrderDistribution() {
    const server = await startStaticServer(8244);
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    
    // Admin context with admin session
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminContext.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_admin_test',
            role: 'admin',
            displayName: 'Admin Master',
            email: 'admin@dezan.com'
        }));
    });
    const page = await adminContext.newPage();

    const outputDir = path.join('/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f');

    let errors = [];

    try {
        console.log('--- TEST 1: Admin Orders (admin-orders.html) ---');
        await page.goto('http://localhost:8244/admin-orders.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);

        const adminTabs = await page.$$eval('#stage-jumper-pills .stage-jump-pill', pills => {
            return pills.map(p => ({
                text: p.querySelector('span:first-child')?.textContent?.trim(),
                count: p.querySelector('span:last-child')?.textContent?.trim(),
                className: p.className,
                target: p.dataset.stageTarget
            }));
        });

        console.log('Admin Tabs Found:', adminTabs);

        const expectedAdminTabs = [
            'All orders',
            'New Orders',
            'Revisions',
            'Quotes & payment',
            'In production',
            'Completed'
        ];

        if (adminTabs.length !== 6) {
            errors.push(`Admin expected 6 tabs, found ${adminTabs.length}`);
        } else {
            for (let i = 0; i < 6; i++) {
                if (adminTabs[i].text !== expectedAdminTabs[i]) {
                    errors.push(`Admin tab ${i} expected "${expectedAdminTabs[i]}", got "${adminTabs[i].text}"`);
                }
            }
        }

        // Test clicking each tab
        for (const tab of adminTabs) {
            console.log(`Clicking admin tab: ${tab.text} (${tab.target})`);
            await page.click(`#stage-jumper-pills [data-stage-target="${tab.target}"]`);
            await page.waitForTimeout(200);
        }
        // Reset to all
        await page.click('#stage-jumper-pills [data-stage-target="all"]');
        await page.waitForTimeout(300);

        await page.screenshot({ path: path.join(outputDir, 'admin_orders_distribution_desktop.png'), fullPage: false });
        console.log('Saved admin_orders_distribution_desktop.png');

        console.log('\n--- TEST 2: Digitizer Studio Portal (worker-portal.html) ---');
        const digitizerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await digitizerContext.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                id: 'usr_digitizer_test',
                role: 'digitizer',
                displayName: 'Master Digitizer',
                email: 'digitizer@dezan.com'
            }));
        });
        const dPage = await digitizerContext.newPage();
        await dPage.goto('http://localhost:8244/worker-portal.html', { waitUntil: 'networkidle' });
        await dPage.waitForTimeout(800);

        const digitizerTabs = await dPage.$$eval('#digitizer-distribution-nav .digitizer-dist-pill', pills => {
            return pills.map(p => ({
                text: p.querySelector('span:first-child')?.textContent?.trim(),
                count: p.querySelector('span:last-child')?.textContent?.trim(),
                className: p.className,
                filter: p.dataset.digitizerFilter
            }));
        });

        console.log('Digitizer Portal Tabs Found:', digitizerTabs);

        const expectedDigitizerTabs = [
            'All orders',
            'New Orders',
            'Revisions',
            'In production',
            'Completed'
        ];

        if (digitizerTabs.length !== 5) {
            errors.push(`Digitizer Portal expected 5 tabs, found ${digitizerTabs.length}`);
        } else {
            for (let i = 0; i < 5; i++) {
                if (digitizerTabs[i].text !== expectedDigitizerTabs[i]) {
                    errors.push(`Digitizer tab ${i} expected "${expectedDigitizerTabs[i]}", got "${digitizerTabs[i].text}"`);
                }
            }
        }

        // Verify quotes tab is NOT present
        const hasQuotes = digitizerTabs.some(t => t.text.toLowerCase().includes('quote') || t.text.toLowerCase().includes('pay'));
        if (hasQuotes) {
            errors.push('CRITICAL: Quotes tab must NOT be present for digitizer!');
        } else {
            console.log('CONFIRMED: Zero quotes tabs present for digitizer.');
        }

        // Test clicking each digitizer tab
        for (const tab of digitizerTabs) {
            console.log(`Clicking digitizer portal tab: ${tab.text} (${tab.filter})`);
            await dPage.click(`#digitizer-distribution-nav [data-digitizer-filter="${tab.filter}"]`);
            await dPage.waitForTimeout(200);
        }
        await dPage.click('#digitizer-distribution-nav [data-digitizer-filter="all"]');
        await dPage.waitForTimeout(300);

        await dPage.screenshot({ path: path.join(outputDir, 'digitizer_portal_distribution_desktop.png'), fullPage: false });
        console.log('Saved digitizer_portal_distribution_desktop.png');

        console.log('\n--- TEST 3: Digitizer Tasks Workbench (worker-tasks.html) ---');
        await dPage.goto('http://localhost:8244/worker-tasks.html', { waitUntil: 'networkidle' });
        await dPage.waitForTimeout(800);

        const workerTasksTabs = await dPage.$$eval('#worker-filter-tabs .worker-filter-pill', pills => {
            return pills.map(p => ({
                text: p.querySelector('span:first-child')?.textContent?.trim(),
                count: p.querySelector('span:last-child')?.textContent?.trim(),
                className: p.className,
                filter: p.dataset.filter
            }));
        });

        console.log('Worker Tasks Tabs Found:', workerTasksTabs);

        if (workerTasksTabs.length !== 5) {
            errors.push(`Worker Tasks expected 5 tabs, found ${workerTasksTabs.length}`);
        } else {
            for (let i = 0; i < 5; i++) {
                if (workerTasksTabs[i].text !== expectedDigitizerTabs[i]) {
                    errors.push(`Worker Tasks tab ${i} expected "${expectedDigitizerTabs[i]}", got "${workerTasksTabs[i].text}"`);
                }
            }
        }

        // Test clicking each task workbench tab
        for (const tab of workerTasksTabs) {
            console.log(`Clicking worker task tab: ${tab.text} (${tab.filter})`);
            await dPage.click(`#worker-filter-tabs [data-filter="${tab.filter}"]`);
            await dPage.waitForTimeout(200);
        }
        await dPage.click('#worker-filter-tabs [data-filter="all"]');
        await dPage.waitForTimeout(300);

        await dPage.screenshot({ path: path.join(outputDir, 'digitizer_tasks_distribution_desktop.png'), fullPage: false });
        console.log('Saved digitizer_tasks_distribution_desktop.png');

        // Mobile responsive check (390x844)
        console.log('\n--- TEST 4: Mobile Viewports (390x844) ---');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('http://localhost:8244/admin-orders.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(outputDir, 'admin_orders_distribution_mobile.png'), fullPage: false });

        await dPage.setViewportSize({ width: 390, height: 844 });
        await dPage.goto('http://localhost:8244/worker-portal.html', { waitUntil: 'networkidle' });
        await dPage.waitForTimeout(500);
        await dPage.locator('#digitizer-distribution-nav').scrollIntoViewIfNeeded();
        await dPage.screenshot({ path: path.join(outputDir, 'digitizer_portal_distribution_mobile.png'), fullPage: false });

        await dPage.goto('http://localhost:8244/worker-tasks.html', { waitUntil: 'networkidle' });
        await dPage.waitForTimeout(500);
        await dPage.screenshot({ path: path.join(outputDir, 'digitizer_tasks_distribution_mobile.png'), fullPage: false });

        console.log('Saved all mobile screenshots.');

    } catch (err) {
        console.error('Test execution error:', err);
        errors.push(err.message);
    } finally {
        await browser.close();
        server.close();
    }

    console.log('\n--- SUMMARY ---');
    if (errors.length === 0) {
        console.log('✅ ALL VERIFICATIONS PASSED PERFECTLY!');
    } else {
        console.error('❌ FAILURES ENCOUNTERED:');
        errors.forEach(e => console.error(' -', e));
        process.exit(1);
    }
}

verifyOrderDistribution();
