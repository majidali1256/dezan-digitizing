const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyDigitizerTaskCards() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const artifactsDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

    try {
        console.log('--- 1. Testing Worker Tasks (worker-tasks.html) on Desktop (1440x900) ---');
        const contextDesktop = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const page = await contextDesktop.newPage();

        const user = {
            id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
            email: 'digitizer@dezandigitizing.com',
            displayName: 'Digitizer',
            name: 'Master Digitizer',
            role: 'digitizer',
            company: 'Dezan Digitizing Studio',
            phone: '+1 (555) 987-6543'
        };

        // Seed digitizer auth session
        await page.addInitScript((u) => {
            localStorage.setItem('dezan_session', JSON.stringify(u));
            sessionStorage.setItem('dezan_session', JSON.stringify(u));
            localStorage.setItem('insforge_auth_user', JSON.stringify(u));
        }, user);

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        await page.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // Verify task cards exist
        const cards = await page.$$('.digitizer-bento-card');
        console.log(`Found ${cards.length} digitizer cards on worker-tasks.html`);
        if (cards.length === 0) throw new Error('No digitizer bento cards found on worker-tasks.html');

        // Check first card details
        const firstCard = cards[0];
        const cardText = await firstCard.innerText();
        console.log('First card preview snippet:\n', cardText.slice(0, 300));

        // Verify Placement is present and uppercase
        const placementEl = await firstCard.$('.uppercase.text-lg, .uppercase.text-xl, .font-black.uppercase');
        if (!placementEl) throw new Error('Placement element not found on card');
        const placementText = await placementEl.innerText();
        console.log('Card placement text:', placementText);

        // Verify SIZE label is present
        if (!cardText.includes('SIZE:')) throw new Error('SIZE label missing from card');

        // Verify FORMAT label is present
        if (!cardText.includes('FORMAT:')) throw new Error('FORMAT label missing from card');

        // Verify TYPE label is present
        if (!cardText.includes('TYPE:')) throw new Error('TYPE label missing from card');

        // Verify Customer Notes is present
        if (!cardText.includes('Customer Notes:')) throw new Error('Customer Notes missing from card');

        // Verify Artwork thumbnail is present
        const artThumb = await firstCard.$('img[alt="Artwork thumbnail"], div[title*="view artwork"]');
        if (!artThumb) throw new Error('Artwork thumbnail missing from card');

        // Verify download button is present
        const downloadBtn = await firstCard.$('a[download]');
        if (!downloadBtn) throw new Error('Artwork download button missing from card');

        // Verify View Order and Attach Files buttons
        const viewOrderBtn = await firstCard.$('button:has-text("View Order")');
        if (!viewOrderBtn) throw new Error('View Order button missing from card');

        const attachBtn = await firstCard.$('button:has-text("Attach Files"), button:has-text("Files")');
        if (!attachBtn) throw new Error('Attach Files / Files button missing from card');

        // Verify NO Details button
        const detailsBtn = await firstCard.$('button:has-text("Details")');
        if (detailsBtn) throw new Error('Details button should NOT be on card');

        // Take Desktop screenshot
        await page.screenshot({ path: path.join(artifactsDir, 'digitizer_prominent_cards_desktop.png'), fullPage: false });
        console.log('Captured desktop cards screenshot');

        // Test Lightbox Opening from Thumbnail Click
        console.log('--- Testing Artwork Lightbox Opening ---');
        await artThumb.click();
        await page.waitForTimeout(600);

        const lightboxModal = await page.$('#digitizer-artwork-preview-modal');
        const isLightboxVisible = lightboxModal ? await lightboxModal.isVisible() : false;
        console.log('Lightbox modal visible:', isLightboxVisible);
        if (!isLightboxVisible) throw new Error('Artwork lightbox failed to open when tapping thumbnail');

        await page.screenshot({ path: path.join(artifactsDir, 'digitizer_card_lightbox_verified.png'), fullPage: false });
        console.log('Captured lightbox screenshot');

        // Close lightbox
        const closeLightboxBtn = await page.$('#digitizer-artwork-preview-modal button[title*="Close"]');
        if (closeLightboxBtn) await closeLightboxBtn.click();
        await page.waitForTimeout(400);

        // Test View Order Modal
        console.log('--- Testing View Order Modal ---');
        await viewOrderBtn.click();
        await page.waitForTimeout(600);
        const orderModal = await page.$('#task-details-modal');
        const isOrderModalVisible = orderModal ? await orderModal.isVisible() : false;
        console.log('View Order modal visible:', isOrderModalVisible);
        if (!isOrderModalVisible) throw new Error('View Order modal failed to open');

        await page.screenshot({ path: path.join(artifactsDir, 'digitizer_view_order_modal_verified.png'), fullPage: false });
        const closeOrderModalBtn = await page.$('#task-details-modal button:has-text("Close")');
        if (closeOrderModalBtn) await closeOrderModalBtn.click();
        await page.waitForTimeout(400);

        // Test Mobile Viewport (390x844)
        console.log('--- 2. Testing Worker Tasks on Mobile (390x844) ---');
        const contextMobile = await browser.newContext({
            viewport: { width: 390, height: 844 },
            isMobile: true
        });
        const mobilePage = await contextMobile.newPage();
        await mobilePage.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                user: { id: 'usr-dig-001', name: 'Master Digitizer Tariq', role: 'worker', email: 'tariq@dezan.com' }
            }));
            localStorage.setItem('insforge_auth_user', JSON.stringify({
                id: 'usr-dig-001', name: 'Master Digitizer Tariq', role: 'worker', email: 'tariq@dezan.com'
            }));
        });

        await mobilePage.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'domcontentloaded' });
        await mobilePage.waitForTimeout(1000);

        await mobilePage.screenshot({ path: path.join(artifactsDir, 'digitizer_prominent_cards_mobile.png'), fullPage: false });
        console.log('Captured mobile cards screenshot');

        // Test worker-portal.html as well
        console.log('--- 3. Testing Worker Portal (worker-portal.html) ---');
        await page.goto('http://localhost:8085/worker-portal.html', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        const portalCards = await page.$$('.digitizer-bento-card');
        console.log(`Found ${portalCards.length} digitizer cards on worker-portal.html`);
        if (portalCards.length === 0) throw new Error('No digitizer cards on worker-portal.html');

        const portalCardText = await portalCards[0].innerText();
        if (!portalCardText.includes('SIZE:')) throw new Error('SIZE label missing from worker-portal.html card');
        if (!portalCardText.includes('FORMAT:')) throw new Error('FORMAT label missing from worker-portal.html card');
        if (!portalCardText.includes('TYPE:')) throw new Error('TYPE label missing from worker-portal.html card');

        await page.screenshot({ path: path.join(artifactsDir, 'digitizer_portal_prominent_cards_desktop.png'), fullPage: false });
        console.log('Captured worker-portal.html screenshot');

        console.log('✅ ALL DIGITIZER TASK CARD VERIFICATIONS PASSED PERFECTLY!');
    } catch (err) {
        console.error('❌ Verification Error:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verifyDigitizerTaskCards();
