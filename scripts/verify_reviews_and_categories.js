const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    console.log('🚀 Auditing avatars and section title...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1512, height: 982 });

    // 1. Audit index.html
    await page.goto('http://localhost:5001/', { waitUntil: 'networkidle' });

    // Check heading
    const headingText = await page.$eval('#portfolio h3', el => el.textContent.trim());
    console.log(`Heading on index.html: "${headingText}"`);

    // Check review avatar images
    const avatars = [
        'reviews/judith-staponkus-avatar.webp',
        'reviews/ashlea-foxwell-avatar.webp',
        'reviews/chris-velasquez-avatar.webp',
        'reviews/jean-trinh-le-avatar.webp'
    ];

    for (const src of avatars) {
        const loaded = await page.$eval(`img[src="${src}"]`, img => img.complete && img.naturalWidth > 0).catch(() => false);
        console.log(`Avatar ${src} on index.html: ${loaded ? '✅ LOADED' : '❌ FAILED'}`);
    }

    // Scroll to portfolio categories section and capture
    const portEl = await page.$('#portfolio');
    if (portEl) {
        await portEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await portEl.screenshot({ path: 'scratch/categories_section.png' });
        console.log('📸 Captured scratch/categories_section.png');
    }

    // Scroll to reviews section and capture
    const revEl = await page.$('.columns-1');
    if (revEl) {
        await revEl.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        await revEl.screenshot({ path: 'scratch/reviews_section.png' });
        console.log('📸 Captured scratch/reviews_section.png');
    }

    // 2. Audit portfolio.html
    await page.goto('http://localhost:5001/portfolio.html', { waitUntil: 'networkidle' });
    for (const src of avatars) {
        const loaded = await page.$eval(`img[src="${src}"]`, img => img.complete && img.naturalWidth > 0).catch(() => false);
        console.log(`Avatar ${src} on portfolio.html: ${loaded ? '✅ LOADED' : '❌ FAILED'}`);
    }

    await browser.close();
    console.log('✅ Audit complete!');
})();
