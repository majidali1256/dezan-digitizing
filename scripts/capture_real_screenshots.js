const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '../fiverr_portfolio_mockups/screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // 1. Desktop Context (1600x1000, 2x DPR for ultra-crisp display)
    const desktopContext = await browser.newContext({
        viewport: { width: 1512, height: 982 },
        deviceScaleFactor: 2,
    });
    const desktopPage = await desktopContext.newPage();

    console.log('Capturing Desktop Hero...');
    await desktopPage.goto('http://localhost:8089/index.html', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1500);
    await desktopPage.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_index.png') });

    console.log('Capturing Desktop Portfolio/Feedbacks...');
    await desktopPage.goto('http://localhost:8089/portfolio.html', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1500);
    await desktopPage.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_portfolio.png') });

    console.log('Capturing Desktop Pricing...');
    await desktopPage.goto('http://localhost:8089/pricing.html', { waitUntil: 'networkidle' });
    await desktopPage.waitForTimeout(1500);
    await desktopPage.screenshot({ path: path.join(OUTPUT_DIR, 'desktop_pricing.png') });

    await desktopContext.close();

    // 2. Tablet Context (iPad Pro 11-inch: 834 x 1194, 2x DPR)
    const tabletContext = await browser.newContext({
        viewport: { width: 834, height: 1112 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
    });
    const tabletPage = await tabletContext.newPage();

    console.log('Capturing Tablet Index...');
    await tabletPage.goto('http://localhost:8089/index.html', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);
    await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, 'tablet_index.png') });

    console.log('Capturing Tablet Services...');
    await tabletPage.goto('http://localhost:8089/services.html', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);
    await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, 'tablet_services.png') });

    console.log('Capturing Tablet Portfolio...');
    await tabletPage.goto('http://localhost:8089/portfolio.html', { waitUntil: 'networkidle' });
    await tabletPage.waitForTimeout(1500);
    await tabletPage.screenshot({ path: path.join(OUTPUT_DIR, 'tablet_portfolio.png') });

    await tabletContext.close();

    // 3. Mobile Context (iPhone 14 Pro: 393 x 852, 3x DPR)
    const mobileContext = await browser.newContext({
        viewport: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();

    console.log('Capturing Mobile Index...');
    await mobilePage.goto('http://localhost:8089/index.html', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_index.png') });

    console.log('Capturing Mobile Portfolio...');
    await mobilePage.goto('http://localhost:8089/portfolio.html', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_portfolio.png') });

    console.log('Capturing Mobile Pricing...');
    await mobilePage.goto('http://localhost:8089/pricing.html', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1500);
    await mobilePage.screenshot({ path: path.join(OUTPUT_DIR, 'mobile_pricing.png') });

    await mobileContext.close();

    await browser.close();
    console.log('All real website screenshots captured successfully!');
}

capture().catch(err => {
    console.error('Error during capture:', err);
    process.exit(1);
});
