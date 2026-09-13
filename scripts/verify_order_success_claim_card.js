const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('🚀 Starting Order Success Claim Card Verification...');
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    try {
        const outDir = path.resolve(__dirname, '../artifacts_media');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // --- Test 1: Desktop Viewport (matching user screenshot) ---
        console.log('--- Test 1: Desktop Viewport (1280x800) ---');
        const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const pageDesktop = await contextDesktop.newPage();

        await pageDesktop.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('dezan_consent', 'all');
            document.cookie = 'dezan_consent=all; path=/; max-age=31536000';
        });

        const testUrl = 'http://localhost:5001/order-success.html?order=ORD-8842&service=Embroidery+Digitizing&amount=15.00&email=ali.majid1256%40gmail.com&project=Front+Logo';
        await pageDesktop.goto(testUrl, { waitUntil: 'domcontentloaded' });
        await pageDesktop.waitForTimeout(500);

        // Verify #guest-claim-account-card is visible
        const claimCard = await pageDesktop.$('#guest-claim-account-card');
        if (!claimCard) throw new Error('#guest-claim-account-card not found!');

        const cardText = await claimCard.innerText();
        console.log('Card text snippet:', cardText.slice(0, 150));

        // Assert that "OPTIONAL" does not exist in the card
        const hasOptional = cardText.toLowerCase().includes('optional');
        console.log('Card contains "optional":', hasOptional);
        if (hasOptional) {
            throw new Error('Card still contains "optional" text or badge!');
        }

        // Assert that "Or keep this Order ID for reference" is not visible
        const fallbackVisible = await pageDesktop.isVisible('#claim-fallback-note:not(.hidden)');
        console.log('Fallback note is visible:', fallbackVisible);
        if (fallbackVisible) {
            throw new Error('Fallback reference note should be hidden!');
        }

        // Verify required inputs are present
        const emailVal = await pageDesktop.$eval('#claim-email', el => el.value);
        console.log('Email input pre-filled:', emailVal);
        if (emailVal !== 'ali.majid1256@gmail.com') {
            throw new Error(`Expected email ali.majid1256@gmail.com, got: ${emailVal}`);
        }

        const hasPasswordInput = await pageDesktop.isVisible('#claim-password');
        const hasConfirmInput = await pageDesktop.isVisible('#claim-password-confirm');
        const hasSubmitBtn = await pageDesktop.isVisible('#claim-submit-btn');
        console.log('Inputs & Button visible:', { hasPasswordInput, hasConfirmInput, hasSubmitBtn });

        if (!hasPasswordInput || !hasConfirmInput || !hasSubmitBtn) {
            throw new Error('Required account creation inputs or button missing!');
        }

        // Capture screenshot of claim card
        const desktopShotPng = path.join(outDir, 'claim_account_card_desktop.png');
        await claimCard.screenshot({ path: desktopShotPng });
        console.log('Captured desktop screenshot:', desktopShotPng);

        // --- Test 2: Mobile Viewport (390x844) ---
        console.log('--- Test 2: Mobile Viewport (390x844) ---');
        const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
        const pageMobile = await contextMobile.newPage();
        await pageMobile.addInitScript(() => {
            localStorage.clear();
            sessionStorage.clear();
            localStorage.setItem('dezan_consent', 'all');
            document.cookie = 'dezan_consent=all; path=/; max-age=31536000';
        });

        await pageMobile.goto(testUrl, { waitUntil: 'domcontentloaded' });
        await pageMobile.waitForTimeout(500);

        const mobileClaimCard = await pageMobile.$('#guest-claim-account-card');
        const mobileShotPng = path.join(outDir, 'claim_account_card_mobile.png');
        await mobileClaimCard.screenshot({ path: mobileShotPng });
        console.log('Captured mobile screenshot:', mobileShotPng);

        // Convert to WebP
        const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/bcf04134-9365-4ca7-bca3-a10662ec0e96';
        const mobileWebp = path.join(artifactDir, 'claim_account_card_mobile.webp');
        const desktopWebp = path.join(artifactDir, 'claim_account_card_desktop.webp');

        execSync(`python3 -c "
from PIL import Image
im1 = Image.open('${mobileShotPng}')
im1.save('${mobileWebp}', 'WEBP', quality=90, method=6)
im2 = Image.open('${desktopShotPng}')
im2.save('${desktopWebp}', 'WEBP', quality=90, method=6)
print('Converted screenshots to WebP successfully!')
"`, { stdio: 'inherit' });

        console.log('\n🎉 ALL ORDER SUCCESS CLAIM CARD TESTS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
