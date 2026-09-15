const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Starting Playwright verification for Embroidery Digitizing page...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const errors = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`Console error: ${msg.text()}`);
        }
    });
    page.on('pageerror', err => {
        errors.push(`Page error: ${err.message}`);
    });

    const targetUrls = [
        'http://localhost:5001/embroidery-digitizing/',
        'http://localhost:5001/embroidery-digitizing.html'
    ];

    for (const url of targetUrls) {
        console.log(`\n🔍 Auditing URL: ${url}`);
        const response = await page.goto(url, { waitUntil: 'networkidle' });
        if (!response || response.status() !== 200) {
            console.error(`❌ HTTP Status failed: ${response ? response.status() : 'No response'}`);
            process.exit(1);
        }
        console.log(`✅ HTTP 200 OK`);

        // Check Title
        const title = await page.title();
        console.log(`Title: "${title}"`);
        if (title !== 'Embroidery Digitizing Services from $15 | Dezan Digitizing') {
            errors.push(`Title mismatch on ${url}: ${title}`);
        }

        // Check Meta Description
        const metaDesc = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => null);
        console.log(`Meta description: "${metaDesc}"`);
        if (!metaDesc || !metaDesc.includes('Professional embroidery digitizing for hats, left chest logos, jacket backs, 3D puff and more')) {
            errors.push(`Meta description missing or incorrect on ${url}`);
        }

        // Check H1
        const h1Count = await page.$$eval('h1', els => els.length);
        const h1Text = await page.$eval('h1', el => el.textContent.trim());
        console.log(`H1 count: ${h1Count}, Text: "${h1Text}"`);
        if (h1Count !== 1) {
            errors.push(`Expected exactly 1 H1, found ${h1Count} on ${url}`);
        }
        if (!h1Text.includes('Professional Embroidery Digitizing Services')) {
            errors.push(`H1 text mismatch: "${h1Text}"`);
        }

        // Check placement cards
        const placementCards = await page.$$eval('#common-placements a[href]', els => els.map(a => ({
            href: a.getAttribute('href'),
            text: a.textContent.trim().replace(/\s+/g, ' ')
        })));
        console.log(`Found ${placementCards.length} placement cards with links:`);
        placementCards.forEach(c => console.log(`  - [${c.text}] -> ${c.href}`));
        if (placementCards.length < 6) {
            errors.push(`Expected 6 placement card links, found ${placementCards.length}`);
        }

        // Check FAQ Accordion in DOM
        const faqs = await page.$$eval('#faq details', details => details.map(d => ({
            q: d.querySelector('summary')?.textContent?.trim()?.replace(/\s+/g, ' '),
            a: d.querySelector('p')?.textContent?.trim()?.replace(/\s+/g, ' ')
        })));
        console.log(`Found ${faqs.length} FAQs in DOM:`);
        faqs.forEach(f => console.log(`  - Q: ${f.q}\n    A: ${f.a}`));
        if (faqs.length !== 5) {
            errors.push(`Expected 5 FAQs in DOM, found ${faqs.length}`);
        }

        // Scroll to bottom to trigger lazy loaded images
        await page.evaluate(async () => {
            await new Promise((resolve) => {
                let totalHeight = 0;
                const distance = 400;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 100);
            });
        });

        // Wait a brief moment for images to render
        await page.waitForTimeout(1000);

        // Check broken images
        const brokenImages = await page.$$eval('img', imgs => {
            return imgs
                .filter(img => !img.complete || img.naturalWidth === 0)
                .map(img => img.src);
        });
        if (brokenImages.length > 0) {
            errors.push(`Found broken images on ${url}: ${brokenImages.join(', ')}`);
        } else {
            console.log(`✅ All images loaded with naturalWidth > 0`);
        }
    }

    // Capture Desktop Screenshot
    await page.setViewportSize({ width: 1512, height: 982 });
    await page.goto('http://localhost:5001/embroidery-digitizing/', { waitUntil: 'networkidle' });
    const desktopScreenshotPath = path.join(__dirname, '../scratch/embroidery_digitizing_desktop.png');
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`📸 Desktop screenshot captured: ${desktopScreenshotPath}`);

    // Capture Mobile Screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5001/embroidery-digitizing/', { waitUntil: 'networkidle' });
    const mobileScreenshotPath = path.join(__dirname, '../scratch/embroidery_digitizing_mobile.png');
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`📸 Mobile screenshot captured: ${mobileScreenshotPath}`);

    await browser.close();

    console.log('\n================ AUDIT SUMMARY ================');
    if (errors.length > 0) {
        console.error(`❌ Audit failed with ${errors.length} errors:`);
        errors.forEach(e => console.error(`  - ${e}`));
        process.exit(1);
    } else {
        console.log('✅ ALL AUDITS PASSED WITH ZERO ERRORS!');
    }
})();
