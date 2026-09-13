const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('🚀 Verifying Pricing Hero updated subtitle...');
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    try {
        const outDir = path.resolve(__dirname, '../artifacts_media');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // Test 1: Mobile (390x844)
        console.log('--- Test 1: Mobile Viewport (390x844) ---');
        const contextMobile = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2
        });
        const pageMobile = await contextMobile.newPage();
        await pageMobile.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            document.cookie = 'dezan_consent=all; path=/; max-age=31536000';
        });

        await pageMobile.goto('http://localhost:5001/pricing.html', { waitUntil: 'domcontentloaded' });
        await pageMobile.waitForTimeout(500);
        await pageMobile.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        const heroSubtitle = await pageMobile.$eval('main section p', el => el.textContent.trim());
        console.log('Mobile Hero Subtitle:', heroSubtitle);

        const expected = 'Know your digitizing cost before you quote your customer. Our flat rates make it easy to price jobs, place orders, and keep production moving.';
        if (!heroSubtitle.includes('Know your digitizing cost before you quote your customer')) {
            throw new Error(`Subtitle mismatch! Got: "${heroSubtitle}"`);
        }

        const heroMobile = await pageMobile.$('main section:first-of-type');
        const mobileShotPng = path.join(outDir, 'pricing_hero_updated_mobile.png');
        if (heroMobile) {
            await heroMobile.screenshot({ path: mobileShotPng });
        } else {
            await pageMobile.screenshot({ path: mobileShotPng });
        }
        console.log('Captured mobile screenshot:', mobileShotPng);

        // Test 2: Desktop (1280x800)
        console.log('--- Test 2: Desktop Viewport (1280x800) ---');
        const contextDesktop = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const pageDesktop = await contextDesktop.newPage();
        await pageDesktop.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            document.cookie = 'dezan_consent=all; path=/; max-age=31536000';
        });

        await pageDesktop.goto('http://localhost:5001/pricing.html', { waitUntil: 'domcontentloaded' });
        await pageDesktop.waitForTimeout(500);
        await pageDesktop.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
        });

        const heroDesktop = await pageDesktop.$('main section:first-of-type');
        const desktopShotPng = path.join(outDir, 'pricing_hero_updated_desktop.png');
        if (heroDesktop) {
            await heroDesktop.screenshot({ path: desktopShotPng });
        } else {
            await pageDesktop.screenshot({ path: desktopShotPng });
        }
        console.log('Captured desktop screenshot:', desktopShotPng);

        // Convert to WebP
        const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/bcf04134-9365-4ca7-bca3-a10662ec0e96';
        const mobileWebp = path.join(artifactDir, 'pricing_hero_updated_mobile.webp');
        const desktopWebp = path.join(artifactDir, 'pricing_hero_updated_desktop.webp');

        execSync(`python3 -c "
from PIL import Image
im1 = Image.open('${mobileShotPng}')
im1.save('${mobileWebp}', 'WEBP', quality=90, method=6)
im2 = Image.open('${desktopShotPng}')
im2.save('${desktopWebp}', 'WEBP', quality=90, method=6)
print('Converted screenshots to WebP successfully!')
"`, { stdio: 'inherit' });

        console.log('✅ ALL HERO SUBTITLE VERIFICATIONS PASSED!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
