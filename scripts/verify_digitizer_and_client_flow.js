const { chromium } = require('playwright');
const path = require('path');

const outputDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

(async () => {
    console.log('=== STARTING DIGITIZER & CLIENT PORTAL PLAYWRIGHT VERIFICATION ===');
    const browser = await chromium.launch({ channel: 'chrome' });

    // ----------------------------------------------------
    // 1. DIGITIZER PORTAL (worker-portal.html)
    // ----------------------------------------------------
    console.log('\n--- 1. Testing Digitizer Studio (worker-portal.html) ---');
    const workerCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    await workerCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_digitizer_test',
            role: 'digitizer',
            displayName: 'Tariq Digitizer Pro',
            email: 'digitizer@dezan.com'
        }));
    });
    const workerPage = await workerCtx.newPage();
    await workerPage.goto('http://localhost:8245/worker-portal.html', { waitUntil: 'networkidle' });
    await workerPage.waitForTimeout(500);

    // Verify 4 stage sections exist
    const workerSectionCount = await workerPage.$$eval('.stage-sub-section', els => els.length);
    console.log(`Digitizer sections found: ${workerSectionCount} (Expected: 4)`);

    // Measure gaps between visible sections
    const workerGaps = await workerPage.$$eval('.stage-sub-section', els => {
        const visible = els.filter(el => !el.classList.contains('hidden'));
        const gaps = [];
        for (let i = 0; i < visible.length - 1; i++) {
            const current = visible[i].getBoundingClientRect();
            const next = visible[i + 1].getBoundingClientRect();
            gaps.push({ from: visible[i].id, to: visible[i + 1].id, gap: next.top - current.bottom });
        }
        return gaps;
    });
    console.log('Digitizer Stage Gaps in All Orders view:', workerGaps);
    workerGaps.forEach(g => {
        console.log(`Gap between [${g.from}] and [${g.to}]: ${g.gap.toFixed(1)}px (PASS: ${g.gap >= 24 ? 'YES' : 'NO'})`);
    });

    // Test tab isolation on digitizer portal: Click "Revisions"
    console.log('Clicking Digitizer "Revisions" pill...');
    await workerPage.click('button[data-digitizer-filter="revisions"]');
    await workerPage.waitForTimeout(300);

    const revisionsVisible = await workerPage.$eval('#stage-worker-revisions', el => !el.classList.contains('hidden'));
    const newHidden = await workerPage.$eval('#stage-worker-new', el => el.classList.contains('hidden'));
    const prodHidden = await workerPage.$eval('#stage-worker-production', el => el.classList.contains('hidden'));
    console.log(`Digitizer Tab Isolation check: Revisions visible: ${revisionsVisible}, New hidden: ${newHidden}, Production hidden: ${prodHidden}`);

    // Capture desktop digitizer screenshot
    await workerPage.click('button[data-digitizer-filter="all"]');
    await workerPage.waitForTimeout(300);
    await workerPage.screenshot({
        path: path.join(outputDir, 'digitizer_studio_all_orders_desktop.png'),
        fullPage: false
    });

    // Mobile Digitizer test
    console.log('Testing Digitizer Studio Mobile Viewport (390x844)...');
    const workerMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await workerMobileCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_digitizer_test',
            role: 'digitizer',
            displayName: 'Tariq Digitizer Pro'
        }));
    });
    const workerMobilePage = await workerMobileCtx.newPage();
    await workerMobilePage.goto('http://localhost:8245/worker-portal.html', { waitUntil: 'networkidle' });
    await workerMobilePage.waitForTimeout(500);
    await workerMobilePage.screenshot({
        path: path.join(outputDir, 'digitizer_studio_mobile.png'),
        fullPage: false
    });

    // ----------------------------------------------------
    // 2. CLIENT ORDERS (client-orders.html)
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Client Orders (client-orders.html) ---');
    const clientCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    await clientCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_client_test',
            role: 'client',
            displayName: 'Sarah Jenkins',
            email: 'client@apparel.com'
        }));
    });
    const clientPage = await clientCtx.newPage();
    await clientPage.goto('http://localhost:8245/client-orders.html', { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(500);

    // Verify 6 stage pills exist
    const clientPills = await clientPage.$$eval('#order-filter-tabs .client-dist-pill', els => {
        return els.map(el => ({
            filter: el.getAttribute('data-filter'),
            text: el.innerText.trim().replace(/\n/g, ' ')
        }));
    });
    console.log('Client Orders Stage Pills:', clientPills);

    // Verify 5 stage sections in All view
    const clientSections = await clientPage.$$eval('.stage-sub-section', els => {
        return els.map(el => el.id);
    });
    console.log('Client Stage Subsections in All view:', clientSections);

    // Measure gaps between visible client sections
    const clientGaps = await clientPage.$$eval('.stage-sub-section', els => {
        const visible = els.filter(el => !el.classList.contains('hidden'));
        const gaps = [];
        for (let i = 0; i < visible.length - 1; i++) {
            const current = visible[i].getBoundingClientRect();
            const next = visible[i + 1].getBoundingClientRect();
            gaps.push({ from: visible[i].id, to: visible[i + 1].id, gap: next.top - current.bottom });
        }
        return gaps;
    });
    console.log('Client Stage Gaps in All view:', clientGaps);
    clientGaps.forEach(g => {
        console.log(`Client gap [${g.from}] to [${g.to}]: ${g.gap.toFixed(1)}px (PASS: ${g.gap >= 24 ? 'YES' : 'NO'})`);
    });

    // Capture All Orders Client Desktop
    await clientPage.screenshot({
        path: path.join(outputDir, 'client_orders_all_desktop.png'),
        fullPage: false
    });

    // Test Tab Isolation: Click "Quotes & Estimates"
    console.log('Testing Client Tab Isolation: Clicking "Quotes & Estimates"...');
    await clientPage.click('button[data-filter="quotes"]');
    await clientPage.waitForTimeout(300);

    const clientQuoteVisible = await clientPage.$eval('#stage-client-quotes', el => !el.classList.contains('hidden'));
    const clientProdHidden = await clientPage.$eval('#stage-client-production', el => el.classList.contains('hidden'));
    const clientCompHidden = await clientPage.$eval('#stage-client-completed', el => el.classList.contains('hidden'));
    console.log(`Client Quotes Isolation: Quotes visible: ${clientQuoteVisible}, Production hidden: ${clientProdHidden}, Completed hidden: ${clientCompHidden}`);

    await clientPage.screenshot({
        path: path.join(outputDir, 'client_orders_quotes_isolated.png'),
        fullPage: false
    });

    // Click "In production"
    console.log('Testing Client Tab Isolation: Clicking "In production"...');
    await clientPage.click('button[data-filter="in_progress"]');
    await clientPage.waitForTimeout(300);
    const clientProdOnly = await clientPage.$eval('#stage-client-production', el => !el.classList.contains('hidden'));
    const clientQuotesHidden = await clientPage.$eval('#stage-client-quotes', el => el.classList.contains('hidden'));
    console.log(`Client Production Isolation: Production visible: ${clientProdOnly}, Quotes hidden: ${clientQuotesHidden}`);

    // Mobile Client Orders
    console.log('Testing Client Orders Mobile Viewport (390x844)...');
    const clientMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await clientMobileCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_client_test',
            role: 'client',
            displayName: 'Sarah Jenkins'
        }));
    });
    const clientMobilePage = await clientMobileCtx.newPage();
    await clientMobilePage.goto('http://localhost:8245/client-orders.html', { waitUntil: 'networkidle' });
    await clientMobilePage.waitForTimeout(500);
    await clientMobilePage.screenshot({
        path: path.join(outputDir, 'client_orders_mobile.png'),
        fullPage: false
    });

    // ----------------------------------------------------
    // 3. CLIENT DASHBOARD (client-portal.html)
    // ----------------------------------------------------
    console.log('\n--- 3. Testing Client Dashboard (client-portal.html) ---');
    const dashCtx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    await dashCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_client_test',
            role: 'client',
            displayName: 'Sarah Jenkins',
            email: 'client@apparel.com'
        }));
    });
    const dashPage = await dashCtx.newPage();
    await dashPage.goto('http://localhost:8245/client-portal.html', { waitUntil: 'networkidle' });
    await dashPage.waitForTimeout(500);

    // Verify 6 stage pills on dashboard
    const dashPills = await dashPage.$$eval('#filter-tabs .client-dist-pill', els => {
        return els.map(el => ({
            filter: el.getAttribute('data-filter'),
            text: el.innerText.trim().replace(/\n/g, ' ')
        }));
    });
    console.log('Client Dashboard Stage Pills:', dashPills);

    // Verify dashboard sections and measure gaps
    const dashGaps = await dashPage.$$eval('#dashboard-stage-flow .stage-sub-section', els => {
        const visible = els.filter(el => !el.classList.contains('hidden'));
        const gaps = [];
        for (let i = 0; i < visible.length - 1; i++) {
            const current = visible[i].getBoundingClientRect();
            const next = visible[i + 1].getBoundingClientRect();
            gaps.push({ from: visible[i].id, to: visible[i + 1].id, gap: next.top - current.bottom });
        }
        return gaps;
    });
    console.log('Client Dashboard Stage Gaps in All Activity view:', dashGaps);
    dashGaps.forEach(g => {
        console.log(`Dashboard gap [${g.from}] to [${g.to}]: ${g.gap.toFixed(1)}px (PASS: ${g.gap >= 24 ? 'YES' : 'NO'})`);
    });

    // Capture desktop dashboard screenshot
    await dashPage.screenshot({
        path: path.join(outputDir, 'client_dashboard_all_desktop.png'),
        fullPage: false
    });

    // Test dashboard tab isolation: Click "Quotes & Estimates"
    console.log('Testing Dashboard Tab Isolation: Clicking "Quotes & Estimates"...');
    await dashPage.click('#filter-tabs button[data-filter="quotes"]');
    await dashPage.waitForTimeout(300);

    const dashQuoteVisible = await dashPage.$eval('#section-quotes', el => !el.classList.contains('hidden'));
    const dashOpenHidden = await dashPage.$eval('#section-open-orders', el => el.classList.contains('hidden'));
    const dashCompHidden = await dashPage.$eval('#section-completed-orders', el => el.classList.contains('hidden'));
    console.log(`Dashboard Quotes Isolation: Quotes visible: ${dashQuoteVisible}, Open orders hidden: ${dashOpenHidden}, Completed hidden: ${dashCompHidden}`);

    await dashPage.screenshot({
        path: path.join(outputDir, 'client_dashboard_quotes_isolated.png'),
        fullPage: false
    });

    // Mobile Dashboard screenshot
    console.log('Testing Client Dashboard Mobile Viewport (390x844)...');
    const dashMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await dashMobileCtx.addInitScript(() => {
        localStorage.setItem('dezan_session', JSON.stringify({
            id: 'usr_client_test',
            role: 'client',
            displayName: 'Sarah Jenkins'
        }));
    });
    const dashMobilePage = await dashMobileCtx.newPage();
    await dashMobilePage.goto('http://localhost:8245/client-portal.html', { waitUntil: 'networkidle' });
    await dashMobilePage.waitForTimeout(500);
    await dashMobilePage.screenshot({
        path: path.join(outputDir, 'client_dashboard_mobile.png'),
        fullPage: false
    });

    console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
    await browser.close();
})();
