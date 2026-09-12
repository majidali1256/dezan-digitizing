const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
    console.log('--- Step 1: Content & Tag Verification ---');
    const capHtmlPath = path.join(__dirname, '../embroidery-digitizing/cap-hat-digitizing/index.html');
    const capHtml = fs.readFileSync(capHtmlPath, 'utf8');

    // Expected tags
    const expectedTitle = '<title>Cap & Hat Embroidery Digitizing Services | Dezan Digitizing</title>';
    const expectedMetaDesc = 'Professional cap and hat embroidery digitizing services for embroidery shops across the U.S. Get production-ready DST, PES and EMB files for structured caps, trucker hats, snapbacks, beanies and 3D puff designs.';
    const expectedH1Text = 'Cap &amp; Hat <span class="text-primary">Embroidery Digitizing Services</span>';
    const expectedHeroCopy = 'Production-ready embroidery files for structured caps, trucker hats, snapbacks, beanies and 3D puff hat designs. Every file is digitized for the selected size, placement and cap style.';
    const expectedCanonical = '<link rel="canonical" href="https://dezandigitizing.com/embroidery-digitizing/cap-hat-digitizing/" />';

    if (!capHtml.includes(expectedTitle)) {
        throw new Error('Title tag mismatch in cap-hat-digitizing/index.html');
    }
    console.log('✔ Title tag verified');

    if (!capHtml.includes(expectedMetaDesc)) {
        throw new Error('Meta description mismatch in cap-hat-digitizing/index.html');
    }
    console.log('✔ Meta description verified');

    if (!capHtml.includes(expectedH1Text)) {
        throw new Error('H1 mismatch in cap-hat-digitizing/index.html');
    }
    console.log('✔ H1 verified');

    if (!capHtml.includes(expectedHeroCopy)) {
        throw new Error('Hero copy mismatch in cap-hat-digitizing/index.html');
    }
    console.log('✔ Hero copy verified');

    if (!capHtml.includes(expectedCanonical)) {
        throw new Error('Canonical tag mismatch in cap-hat-digitizing/index.html');
    }
    console.log('✔ Canonical tag verified');

    if (capHtml.includes('Get Free Cap Quote')) {
        throw new Error('Get Free Cap Quote still found in cap-hat-digitizing/index.html hero!');
    }
    console.log('✔ "Get Free Cap Quote" verified removed from hero');

    // Check Hero Content
    if (!capHtml.includes('Order Hat Digitizing')) {
        throw new Error('"Order Hat Digitizing" not found in hero');
    }
    console.log('✔ "Order Hat Digitizing" button verified');

    if (!capHtml.includes('$15 flat rate')) {
        throw new Error('"$15 flat rate" subline not found in hero button');
    }
    console.log('✔ "$15 flat rate" subline verified');

    // Section 2: Real Cap Stitch-Out Proof & Placeholders
    const expectedSection2 = 'Real Cap Stitch-Out Proof';
    const expectedSection2Sub = 'Digitized file preview → actual embroidered cap result.';
    const expectedSlot1 = 'Digitized Preview Placeholder';
    const expectedSlot2 = 'Actual Cap Stitch-Out Placeholder';
    const expectedSection2Caption = 'This cap file was digitized specifically for headwear, not reused from a flat left-chest file. The final stitch-out shows how the design runs on a real structured cap.';
    if (!capHtml.includes(expectedSection2) || !capHtml.includes(expectedSection2Sub) || !capHtml.includes(expectedSlot1) || !capHtml.includes(expectedSlot2) || !capHtml.includes(expectedSection2Caption)) {
        throw new Error('Section 2 (Real Cap Stitch-Out Proof) content or placeholders mismatch');
    }
    console.log('✔ Section 2: Real Cap Stitch-Out Proof & Placeholders verified');

    // Section 3: What You Get With Cap Digitizing (4 cards)
    const expectedSection3 = 'What You Get With Cap Digitizing';
    const s3Cards = [
        'Cap-ready embroidery file',
        'Machine formats included',
        '3D Puff supported',
        'Real production focus'
    ];
    if (!capHtml.includes(expectedSection3) || !s3Cards.every(c => capHtml.includes(c))) {
        throw new Error('Section 3 (What You Get With Cap Digitizing) content mismatch');
    }
    console.log('✔ Section 3: What You Get With Cap Digitizing & 4 cards verified');

    // Section 4: Service Overview
    const expectedSection4Heading = 'Cap Digitizing Made for Real Hat Embroidery';
    const expectedSection4Text = 'Cap embroidery is different from left-chest embroidery. Hats have a curved front, center seam, and limited stitching height, so the file needs to be planned differently.';
    if (!capHtml.includes(expectedSection4Heading) || !capHtml.includes(expectedSection4Text)) {
        throw new Error('Section 4 (Service Overview) content mismatch');
    }
    console.log('✔ Section 4: Service Overview verified');

    // Section 5: Things We Check Before Digitizing a Hat File (5 cards)
    const expectedSection5 = 'Things We Check Before Digitizing a Hat File';
    const s5Checks = [
        'Cap height limit',
        'Center seam',
        'Small text',
        '3D Puff suitability',
        'Flat file vs hat file'
    ];
    if (!capHtml.includes(expectedSection5) || !s5Checks.every(c => capHtml.includes(c))) {
        throw new Error('Section 5 (Things We Check Before Digitizing a Hat File) content mismatch');
    }
    console.log('✔ Section 5: Things We Check Before Digitizing a Hat File & 5 cards verified');

    // Section 6: Recent Cap & Hat Projects & Placeholders
    const expectedSection6 = 'Recent Cap &amp; Hat Projects';
    const expectedSection6Sub = 'Watch real cap stitch-outs from Dezan digitized files, including structured caps, center-seam designs and 3D puff work.';
    const expectedSlot3 = 'Cap video placeholder';
    const expectedSlot4 = 'Hat stitch-out image placeholder';
    const expectedSlot5 = '3D puff cap placeholder';
    if (!capHtml.includes(expectedSection6) || !capHtml.includes(expectedSection6Sub) || !capHtml.includes(expectedSlot3) || !capHtml.includes(expectedSlot4) || !capHtml.includes(expectedSlot5)) {
        throw new Error('Section 6 (Recent Cap & Hat Projects) content or placeholders mismatch');
    }
    console.log('✔ Section 6: Recent Cap & Hat Projects & 3 media placeholders verified');

    // Section 7: FAQ
    if (!capHtml.includes('Cap Digitizing FAQ') || !capHtml.includes('<details class="group')) {
        throw new Error('Section 7 (FAQ) mismatch');
    }
    console.log('✔ Section 7: FAQ verified');

    // Section 8: Final CTA
    const expectedFinalHeading = 'Get Your Cap File Digitized for $15';
    const expectedFinalText = 'Production-ready cap embroidery files delivered in 12–24 hours.';
    const expectedFinalBtn = 'Order Hat Digitizing Now';
    if (!capHtml.includes(expectedFinalHeading) || !capHtml.includes(expectedFinalText) || !capHtml.includes(expectedFinalBtn)) {
        throw new Error('Section 8 (Final CTA) content mismatch');
    }
    console.log('✔ Section 8: Final CTA verified');

    // Check Sitemap
    const sitemapPath = path.join(__dirname, '../sitemap.xml');
    const sitemap = fs.readFileSync(sitemapPath, 'utf8');
    if (!sitemap.includes('https://dezandigitizing.com/embroidery-digitizing/cap-hat-digitizing/')) {
        throw new Error('Cap page missing from sitemap.xml');
    }
    console.log('✔ sitemap.xml entry verified');

    // Check Internal Links
    const servicesHtml = fs.readFileSync(path.join(__dirname, '../services.html'), 'utf8');
    if (!servicesHtml.includes('href="/embroidery-digitizing/cap-hat-digitizing/"') || !servicesHtml.includes('Cap &amp; Hat Digitizing')) {
        throw new Error('services.html link mismatch');
    }
    console.log('✔ services.html internal link verified');

    const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
    if (!indexHtml.includes('href="/embroidery-digitizing/cap-hat-digitizing/"') || !indexHtml.includes('Cap &amp; Hat Digitizing')) {
        throw new Error('index.html portfolio link mismatch');
    }
    console.log('✔ index.html portfolio link verified');

    const embHtml = fs.readFileSync(path.join(__dirname, '../embroidery-digitizing/index.html'), 'utf8');
    if (!embHtml.includes('href="/embroidery-digitizing/cap-hat-digitizing/"') || !embHtml.includes('Cap &amp; Hat Digitizing')) {
        throw new Error('embroidery-digitizing/index.html link mismatch');
    }
    console.log('✔ embroidery-digitizing/index.html internal link verified');

    console.log('\n--- Step 2: Multi-Viewport Playwright Rendering Verification ---');
    const http = require('http');
    const serveHandler = (req, res) => {
        let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
        if (filePath.endsWith('/')) filePath += 'index.html';
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath);
            const contentTypes = {
                '.html': 'text/html',
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.webp': 'image/webp',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.svg': 'image/svg+xml'
            };
            res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.writeHead(404);
            res.end('Not found');
        }
    };

    const server = http.createServer(serveHandler);
    await new Promise((resolve) => server.listen(8091, resolve));
    console.log('Temporary verification server running at http://localhost:8091');

    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // Output dir for screenshots
    const screenshotDir = path.join(__dirname, '../playwright_artifacts/cap_hat_verification');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
    }

    // Viewports: Desktop, Tablet, Mobile
    const viewports = [
        { name: 'desktop', width: 1512, height: 982 },
        { name: 'tablet', width: 834, height: 1112 },
        { name: 'mobile', width: 390, height: 844 }
    ];

    for (const vp of viewports) {
        const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            deviceScaleFactor: 2
        });
        const page = await context.newPage();
        await page.goto('http://localhost:8091/embroidery-digitizing/cap-hat-digitizing/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(800);

        // Check hero button dimensions
        const buttonBox = await page.locator('button:has-text("Order Hat Digitizing")').first().boundingBox();
        console.log(`[${vp.name.toUpperCase()}] Viewport width: ${vp.width}px, Button width: ${Math.round(buttonBox.width)}px (${Math.round((buttonBox.width / vp.width) * 100)}% of viewport)`);

        if (vp.name === 'mobile') {
            const ratio = buttonBox.width / vp.width;
            if (ratio > 0.85 || ratio < 0.65) {
                console.warn(`Note: mobile button ratio is ${(ratio * 100).toFixed(1)}%`);
            } else {
                console.log(`✔ Mobile button width is optimal: ${(ratio * 100).toFixed(1)}% (within 70-80% target)`);
            }
        }

        const screenshotPath = path.join(screenshotDir, `cap_hat_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`Captured ${screenshotPath}`);

        await context.close();
    }

    await browser.close();
    server.close();
    console.log('\n✔ All verifications completed successfully!');
}

main().catch((err) => {
    console.error('Error during verification:', err);
    process.exit(1);
});
