const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('🚀 Starting Step 1 card verification...');
    const browser = await chromium.launch({
        headless: true,
        channel: 'chrome'
    });

    try {
        const outDir = path.resolve(__dirname, '../artifacts_media');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // Test 1: Mobile viewport matching user's iPhone screenshot
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

        await pageMobile.goto('http://localhost:5001/index.html', { waitUntil: 'domcontentloaded' });
        await pageMobile.waitForTimeout(600);
        await pageMobile.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
            window.openOrderQuoteModal();
        });

        await pageMobile.waitForSelector('#order-service-selection-view', { state: 'visible', timeout: 5000 });
        await pageMobile.waitForTimeout(500);

        // Verify that format badges are NOT present in stage 1
        const mobileStage1Text = await pageMobile.$eval('#order-service-selection-view', el => el.innerText);
        const mobileHasDst = mobileStage1Text.includes('.DST');
        const mobileHasAi = mobileStage1Text.includes('.AI');
        console.log('Mobile Stage 1 Text contains .DST:', mobileHasDst);
        console.log('Mobile Stage 1 Text contains .AI:', mobileHasAi);

        if (mobileHasDst || mobileHasAi) {
            throw new Error('Format badges still detected in Stage 1 cards on mobile!');
        }

        // Check that feature pills are still present
        const mobileHasLeftChest = mobileStage1Text.includes('Left Chest / Hats / Jacket Back');
        const mobileHas3DPuff = mobileStage1Text.includes('3D Puff');
        const mobileHasPrintReady = mobileStage1Text.includes('Print-ready Vectors');
        const mobileHasPets = mobileStage1Text.includes('Pets, Animals & Fur');
        console.log('Mobile feature pills present:', { mobileHasLeftChest, mobileHas3DPuff, mobileHasPrintReady, mobileHasPets });

        if (!mobileHasLeftChest || !mobileHas3DPuff || !mobileHasPrintReady || !mobileHasPets) {
            throw new Error('Expected feature pills are missing on mobile!');
        }

        const modalBox = await pageMobile.$('#new-order-modal > div');
        const mobileShotPng = path.join(outDir, 'step1_cards_clean_mobile.png');
        if (modalBox) {
            await modalBox.screenshot({ path: mobileShotPng });
        } else {
            await pageMobile.screenshot({ path: mobileShotPng });
        }
        console.log('Captured mobile screenshot:', mobileShotPng);

        // Test 2: Desktop viewport
        console.log('--- Test 2: Desktop Viewport (1280x800) ---');
        const contextDesktop = await browser.newContext({
            viewport: { width: 1280, height: 800 }
        });
        const pageDesktop = await contextDesktop.newPage();
        await pageDesktop.addInitScript(() => {
            localStorage.setItem('dezan_consent', 'all');
            document.cookie = 'dezan_consent=all; path=/; max-age=31536000';
        });

        await pageDesktop.goto('http://localhost:5001/index.html', { waitUntil: 'domcontentloaded' });
        await pageDesktop.waitForTimeout(600);
        await pageDesktop.evaluate(() => {
            const b = document.getElementById('dezan-cookie-banner');
            if (b) b.remove();
            window.openOrderQuoteModal();
        });

        await pageDesktop.waitForSelector('#order-service-selection-view', { state: 'visible', timeout: 5000 });
        await pageDesktop.waitForTimeout(500);

        const desktopStage1Text = await pageDesktop.$eval('#order-service-selection-view', el => el.innerText);
        if (desktopStage1Text.includes('.DST') || desktopStage1Text.includes('.AI')) {
            throw new Error('Format badges still detected in Stage 1 cards on desktop!');
        }

        const modalBoxDesktop = await pageDesktop.$('#new-order-modal > div');
        const desktopShotPng = path.join(outDir, 'step1_cards_clean_desktop.png');
        if (modalBoxDesktop) {
            await modalBoxDesktop.screenshot({ path: desktopShotPng });
        } else {
            await pageDesktop.screenshot({ path: desktopShotPng });
        }
        console.log('Captured desktop screenshot:', desktopShotPng);

        // Test 3: Select Embroidery Digitizing and ensure Step 2 format checkboxes are intact
        console.log('--- Test 3: Step 2 Format Checkboxes Verification ---');
        await pageDesktop.click('button[onclick*="Digitizing"]');
        await pageDesktop.waitForSelector('#order-step-2-view', { state: 'visible', timeout: 5000 });
        const step2HasFormats = await pageDesktop.isVisible('input[name="dig-formats"]');
        console.log('Step 2 format checkboxes visible for customer selection:', step2HasFormats);

        if (!step2HasFormats) {
            throw new Error('Step 2 format selection checkboxes should still exist!');
        }

        // Convert captured screenshots to WebP per Universal WebP optimization rule
        const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/bcf04134-9365-4ca7-bca3-a10662ec0e96';
        const mobileWebp = path.join(artifactDir, 'step1_cards_clean_mobile.webp');
        const desktopWebp = path.join(artifactDir, 'step1_cards_clean_desktop.webp');

        execSync(`python3 -c "
from PIL import Image
im1 = Image.open('${mobileShotPng}')
im1.save('${mobileWebp}', 'WEBP', quality=90, method=6)
im2 = Image.open('${desktopShotPng}')
im2.save('${desktopWebp}', 'WEBP', quality=90, method=6)
print('Converted screenshots to WebP successfully!')
"`, { stdio: 'inherit' });

        console.log('✅ ALL STEP 1 CLEAN CARD VERIFICATIONS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
