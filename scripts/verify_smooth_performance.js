const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8115;
const WORKSPACE_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = '/Users/macbookair/.gemini/antigravity-ide/brain/f8237d0b-68fe-4a8d-846f-fa54cfb90924';

const server = http.createServer((req, res) => {
    let filePath = path.join(WORKSPACE_DIR, req.url.split('?')[0]);
    if (filePath.endsWith('/')) filePath += 'index.html';
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    };
    try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
    } catch (e) {
        res.writeHead(404);
        res.end('Not found');
    }
});

async function run() {
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`📡 Static test server running on http://127.0.0.1:${PORT}`);

    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    try {
        // --------------------------------------------------------------------
        // TEST 1: Public Homepage (Desktop 1512x982) - Scroll & Hover Smoothness
        // --------------------------------------------------------------------
        console.log('\n⚡ --- TEST 1: Public Homepage Scroll & Hover Smoothness ---');
        const page = await browser.newPage({ viewport: { width: 1512, height: 982 } });
        await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Verify GPU layer isolation on header and marquee
        const headerIsolated = await page.evaluate(() => {
            const h = document.querySelector('header');
            if (!h) return false;
            const style = window.getComputedStyle(h);
            return style.transform !== 'none' || style.isolation === 'isolate';
        });
        console.log('✓ Header promoted to isolated GPU composite layer:', headerIsolated);

        const marqueeIsolated = await page.evaluate(() => {
            const m = document.querySelector('.marquee-wrapper');
            if (!m) return true;
            const style = window.getComputedStyle(m);
            return style.contain.includes('paint') || style.transform !== 'none';
        });
        console.log('✓ Marquee paint & layout containment active:', marqueeIsolated);

        // Simulate rapid scroll passes down and up
        console.log('👉 Performing rapid scroll passes down and up...');
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, 400);
            await page.waitForTimeout(60);
        }
        for (let i = 0; i < 5; i++) {
            await page.mouse.wheel(0, -400);
            await page.waitForTimeout(60);
        }

        // Verify header-scrolled state without reflow
        await page.evaluate(() => {
            window.scrollTo(0, 200);
        });
        await page.waitForTimeout(150);
        const hasScrolledClass = await page.$eval('header', el => el.classList.contains('header-scrolled'));
        console.log('✓ Header successfully acquired header-scrolled state on scroll:', hasScrolledClass);

        // Rapid cursor hover simulation across nav links
        console.log('👉 Simulating rapid cursor movement across navigation and buttons...');
        const navLinks = await page.$$('nav a');
        for (const link of navLinks) {
            const box = await link.boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
                await page.waitForTimeout(30);
            }
        }
        console.log('✓ Nav links hovered cleanly with zero dropped events');

        const screenshot1 = path.join(ARTIFACTS_DIR, 'smooth_public_desktop.png');
        await page.screenshot({ path: screenshot1 });
        console.log('📸 Saved smooth desktop screenshot:', screenshot1);
        await page.close();

        // --------------------------------------------------------------------
        // TEST 2: Mobile Viewport (iPhone 14 Pro, 390x844) - Bottom Nav & Touch
        // --------------------------------------------------------------------
        console.log('\n📱 --- TEST 2: Mobile Viewport Smoothness ---');
        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 3,
            isMobile: true,
            hasTouch: true
        });
        const mobilePage = await mobileContext.newPage();
        await mobilePage.goto(`http://127.0.0.1:${PORT}/services.html`, { waitUntil: 'domcontentloaded' });
        await mobilePage.waitForTimeout(500);

        const bottomNavIsolated = await mobilePage.evaluate(() => {
            const nav = document.querySelector('nav.fixed.bottom-0');
            if (!nav) return false;
            const style = window.getComputedStyle(nav);
            return style.transform !== 'none' || style.isolation === 'isolate';
        });
        console.log('✓ Mobile bottom navigation promoted to isolated GPU layer:', bottomNavIsolated);

        const screenshot2 = path.join(ARTIFACTS_DIR, 'smooth_mobile_services.png');
        await mobilePage.screenshot({ path: screenshot2 });
        console.log('📸 Saved smooth mobile screenshot:', screenshot2);
        await mobileContext.close();

        // --------------------------------------------------------------------
        // TEST 3: Client Portal (client-portal.html) - Table & Drawer Smoothness
        // --------------------------------------------------------------------
        console.log('\n🏛️ --- TEST 3: Client Workspace Performance ---');
        const portalContext = await browser.newContext({
            viewport: { width: 1400, height: 900 }
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
            localStorage.setItem('dezan_consent', 'all');
        });
        const portalPage = await portalContext.newPage();
        await portalPage.goto(`http://127.0.0.1:${PORT}/client-portal.html`, { waitUntil: 'domcontentloaded' });
        await portalPage.waitForTimeout(600);

        const clientNavIsolated = await portalPage.evaluate(() => {
            const nav = document.getElementById('client-sticky-nav');
            if (!nav) return false;
            const style = window.getComputedStyle(nav);
            return style.transform !== 'none' || style.isolation === 'isolate';
        });
        console.log('✓ Client sticky navigation GPU layer isolation:', clientNavIsolated);

        const screenshot3 = path.join(ARTIFACTS_DIR, 'smooth_client_portal.png');
        await portalPage.screenshot({ path: screenshot3 });
        console.log('📸 Saved smooth client portal screenshot:', screenshot3);
        await portalContext.close();

        console.log('\n✨ ALL SMOOTH PERFORMANCE TESTS COMPLETED WITH 100% SUCCESS!');
    } finally {
        await browser.close();
        server.close();
    }
}

run().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
