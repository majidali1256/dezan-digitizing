const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('🚀 Starting Pricing Page FAQ Verification Suite...\n');
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    try {
        const outDir = path.resolve(__dirname, '../artifacts_media');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        // --- Test 1: Desktop Viewport ---
        console.log('--- Test 1: Desktop Viewport (1280x800) ---');
        const contextDesktop = await browser.newContext({ viewport: { width: 1280, height: 800 } });
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

        // Verify section presence
        const faqSection = await pageDesktop.$('#faq');
        if (!faqSection) throw new Error('#faq section not found in pricing.html');

        // Verify all 4 headings exist
        const headings = await pageDesktop.$$eval('#faq h3', els => els.map(e => e.textContent.trim()));
        console.log('Detected FAQ headings:', headings);

        const expectedHeadings = [
            'How much does embroidery digitizing cost in the U.S.?',
            'How much does hat digitizing cost in the U.S.?',
            'How much does left chest digitizing cost in the U.S.?',
            'How much does jacket back digitizing cost in the U.S.?'
        ];

        for (const exp of expectedHeadings) {
            const match = headings.some(h => h.includes(exp));
            if (!match) throw new Error(`Missing expected FAQ heading: "${exp}"`);
            console.log(`  ✓ Found heading: "${exp}"`);
        }

        // Verify answers content
        const answers = await pageDesktop.$$eval('#faq .faq-content', els => els.map(e => e.textContent.trim()));
        console.log('Detected answers count:', answers.length);

        const expectedAnswerSubstrings = [
            'Standard embroidery digitizing at Dezan starts at $15 for hat and left chest designs up to 5.5 inches. Larger embroidery designs over 5.5 inches are $25.',
            'Cap and hat embroidery digitizing is $15 flat for standard designs up to 5.5 inches wide. 3D puff setup is included when suitable for the artwork.',
            'Standard left chest embroidery digitizing is $15 flat for designs up to 5.5 inches.',
            'Large embroidery designs over 5.5 inches are $25 flat, with separate pricing for highly realistic or specialty artwork.'
        ];

        for (const expAns of expectedAnswerSubstrings) {
            const match = answers.some(a => a.includes(expAns));
            if (!match) throw new Error(`Missing expected FAQ answer content: "${expAns}"`);
            console.log(`  ✓ Found answer snippet: "${expAns.slice(0, 50)}..."`);
        }

        // Verify accordion functionality: click FAQ 2
        console.log('\nTesting FAQ accordion interaction...');
        const buttons = await pageDesktop.$$('#faq button');
        // Initial state: first button expanded, second button collapsed
        const btn1ExpandedInit = await buttons[0].getAttribute('aria-expanded');
        const btn2ExpandedInit = await buttons[1].getAttribute('aria-expanded');
        console.log(`  Initial: FAQ 1 expanded = ${btn1ExpandedInit}, FAQ 2 expanded = ${btn2ExpandedInit}`);

        // Click FAQ 2
        await buttons[1].click();
        await pageDesktop.waitForTimeout(400);

        const btn1ExpandedAfter = await buttons[0].getAttribute('aria-expanded');
        const btn2ExpandedAfter = await buttons[1].getAttribute('aria-expanded');
        console.log(`  After clicking FAQ 2: FAQ 1 expanded = ${btn1ExpandedAfter}, FAQ 2 expanded = ${btn2ExpandedAfter}`);

        if (btn2ExpandedAfter !== 'true' || btn1ExpandedAfter !== 'false') {
            throw new Error('Accordion state transition failed!');
        }
        console.log('  ✓ Accordion expansion and sibling collapse verified successfully.');

        // Verify JSON-LD Schema
        const schemaScripts = await pageDesktop.$$eval('script[type="application/ld+json"]', scripts =>
            scripts.map(s => {
                try { return JSON.parse(s.textContent); } catch (e) { return null; }
            }).filter(Boolean)
        );
        const faqSchema = schemaScripts.find(s => s['@type'] === 'FAQPage');
        if (!faqSchema) throw new Error('FAQPage JSON-LD schema not found or invalid JSON!');
        if (!faqSchema.mainEntity || faqSchema.mainEntity.length !== 4) {
            throw new Error(`Expected 4 mainEntity items in FAQPage schema, found ${faqSchema.mainEntity?.length}`);
        }
        console.log('  ✓ FAQPage schema found with 4 questions!');

        // Scroll to FAQ section and take desktop screenshot
        await faqSection.scrollIntoViewIfNeeded();
        await pageDesktop.waitForTimeout(300);
        const desktopShotPng = path.join(outDir, 'pricing_faq_desktop.png');
        await faqSection.screenshot({ path: desktopShotPng });
        console.log('Captured desktop screenshot:', desktopShotPng);

        // --- Test 2: Mobile Viewport ---
        console.log('\n--- Test 2: Mobile Viewport (390x844) ---');
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

        const mobileFaq = await pageMobile.$('#faq');
        await mobileFaq.scrollIntoViewIfNeeded();
        await pageMobile.waitForTimeout(300);

        const mobileShotPng = path.join(outDir, 'pricing_faq_mobile.png');
        await mobileFaq.screenshot({ path: mobileShotPng });
        console.log('Captured mobile screenshot:', mobileShotPng);

        // Convert screenshots to WebP
        const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/bcf04134-9365-4ca7-bca3-a10662ec0e96';
        const mobileWebp = path.join(artifactDir, 'pricing_faq_mobile.webp');
        const desktopWebp = path.join(artifactDir, 'pricing_faq_desktop.webp');

        execSync(`python3 -c "
from PIL import Image
im1 = Image.open('${mobileShotPng}')
im1.save('${mobileWebp}', 'WEBP', quality=90, method=6)
im2 = Image.open('${desktopShotPng}')
im2.save('${desktopWebp}', 'WEBP', quality=90, method=6)
print('Converted screenshots to WebP successfully!')
"`, { stdio: 'inherit' });

        console.log('\n🎉 ALL PRICING FAQ VERIFICATIONS PASSED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
})();
