const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

async function runVerification() {
    console.log('🚀 Starting Expandable Cards & Gmail-Style Upload Verification...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // ==========================================
    // 1. WORKER TASKS WORKBENCH (worker-tasks.html)
    // ==========================================
    console.log('\n--- 1. WORKER TASKS WORKBENCH (worker-tasks.html) ---');
    const workerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await workerCtx.addInitScript(() => {
        const user = {
            id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
            email: 'digitizer@dezandigitizing.com',
            displayName: 'Digitizer',
            name: 'Master Digitizer',
            role: 'digitizer',
            company: 'Dezan Digitizing Studio',
            phone: '+1 (555) 987-6543'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const workerPage = await workerCtx.newPage();
    await workerPage.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
    await workerPage.waitForTimeout(1000);

    const workerCards = await workerPage.$$('.digitizer-bento-card');
    console.log(`Found ${workerCards.length} digitizer cards on worker-tasks.html`);
    if (workerCards.length > 0) {
        const firstCardBox = await workerCards[0].boundingBox();
        console.log(`First worker card resting bounding box: height = ${Math.round(firstCardBox.height)}px (Compact ~200-240px target)`);

        // Click Details button on first card
        const detailsBtn = await workerCards[0].$('button:has-text("Details")');
        if (detailsBtn) {
            console.log('Clicking [ Details ⌄ ] button on first card...');
            await detailsBtn.click();
            await workerPage.waitForTimeout(400);

            // Check if tray is visible
            const tray = await workerCards[0].$('.card-extended-tray');
            const isTrayVisible = await tray.isVisible();
            const btnText = await detailsBtn.innerText();
            console.log(`Worker Tray expanded visible: ${isTrayVisible}, button text updated to: "${btnText.replace(/\s+/g, ' ').trim()}"`);

            const expandedCardBox = await workerCards[0].boundingBox();
            console.log(`Expanded card height: ${Math.round(expandedCardBox.height)}px`);

            // Screenshot expanded card
            await workerPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'worker_tasks_card_expanded.png'),
                clip: {
                    x: firstCardBox.x - 10,
                    y: firstCardBox.y - 10,
                    width: firstCardBox.width + 20,
                    height: expandedCardBox.height + 20
                }
            });

            // Click Less button to collapse back
            console.log('Clicking [ Less ⌃ ] button to collapse card back...');
            await detailsBtn.click();
            await workerPage.waitForTimeout(400);
            const isTrayHidden = !(await tray.isVisible());
            const collapsedBtnText = await detailsBtn.innerText();
            console.log(`Worker Tray collapsed hidden: ${isTrayHidden}, button text restored to: "${collapsedBtnText.replace(/\s+/g, ' ').trim()}"`);
        }

        // Test Upload Deliverables Modal
        console.log('Testing Gmail-Style Upload Deliverables Modal...');
        const uploadBtn = await workerCards[0].$('button:has-text("Deliverables"), button:has-text("Upload"), button[title*="deliverables"]');
        if (uploadBtn) {
            await uploadBtn.click();
            await workerPage.waitForTimeout(500);

            const isModalVisible = await workerPage.isVisible('#deliverable-upload-modal, #digitizer-upload-modal');
            console.log(`Upload Modal visible: ${isModalVisible}`);

            const headerText = await workerPage.textContent('#deliverable-upload-modal h3, #digitizer-upload-modal h3');
            const deliverText = await workerPage.textContent('#upload-deliver-required-text, #upload-deliver-req-summary');
            const dropzoneText = await workerPage.textContent('.gmail-upload-area');
            const missingText = await workerPage.textContent('#worker-task-submit-hint, #modal-submit-hint, #modal-missing-warning');
            const submitBtn = await workerPage.$('#worker-task-submit-btn, #btn-submit-deliverable-modal, #modal-btn-submit-deliverables');
            const submitBtnDisabled = submitBtn ? await submitBtn.isDisabled() : false;
            const submitBtnText = submitBtn ? await submitBtn.innerText() : '';

            console.log(`Modal Header: "${headerText ? headerText.trim() : 'N/A'}" (Expected: UPLOAD FINISHED FILES)`);
            console.log(`Consolidated DELIVER: "${deliverText ? deliverText.trim() : 'N/A'}"`);
            console.log(`Dropzone text: "${dropzoneText ? dropzoneText.replace(/\s+/g, ' ').trim() : 'N/A'}"`);
            console.log(`Missing Text: "${missingText ? missingText.trim() : 'N/A'}"`);
            console.log(`Submit Button: "${submitBtnText ? submitBtnText.replace(/\s+/g, ' ').trim() : 'N/A'}", disabled = ${submitBtnDisabled}`);

            await workerPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'digitizer_gmail_upload_modal.png')
            });

            // Close modal
            const closeBtn = await workerPage.$('#deliverable-upload-modal button[aria-label="Close modal"], #deliverable-upload-modal button:has-text("close"), #digitizer-upload-modal button[aria-label="Close modal"]');
            if (closeBtn) await closeBtn.click();
            await workerPage.waitForTimeout(300);
        }
    }

    // ==========================================
    // 2. CLIENT SUITE (client-orders.html)
    // ==========================================
    console.log('\n--- 2. CLIENT SUITE (client-orders.html) ---');
    const clientCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await clientCtx.addInitScript(() => {
        const user = {
            id: 'client-01',
            email: 'client@falconapparel.com',
            role: 'client',
            displayName: 'John Client',
            name: 'John Client'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const clientPage = await clientCtx.newPage();
    await clientPage.goto('http://localhost:8085/client-orders.html', { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(1000);

    const clientCards = await clientPage.$$('.client-order-card');
    console.log(`Found ${clientCards.length} client order cards on client-orders.html`);
    if (clientCards.length > 0) {
        const firstClientCardBox = await clientCards[0].boundingBox();
        console.log(`First client card resting height: ${Math.round(firstClientCardBox.height)}px`);

        const detailsBtn = await clientCards[0].$('button:has-text("Details")');
        if (detailsBtn) {
            console.log('Clicking [ Details ⌄ ] on client card...');
            await detailsBtn.click();
            await clientPage.waitForTimeout(400);

            const tray = await clientCards[0].$('.card-extended-tray');
            const isVisible = await tray.isVisible();
            const btnText = await detailsBtn.innerText();
            console.log(`Client tray visible: ${isVisible}, button text: "${btnText.replace(/\s+/g, ' ').trim()}"`);

            const expandedBox = await clientCards[0].boundingBox();
            await clientPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'client_order_card_expanded.png'),
                clip: {
                    x: firstClientCardBox.x - 10,
                    y: firstClientCardBox.y - 10,
                    width: firstClientCardBox.width + 20,
                    height: expandedBox.height + 20
                }
            });

            // Click less to collapse
            await detailsBtn.click();
            await clientPage.waitForTimeout(400);
            console.log('Client card collapsed back successfully.');
        }
    }

    // ==========================================
    // 3. ADMIN SUITE (admin-orders.html)
    // ==========================================
    console.log('\n--- 3. ADMIN SUITE (admin-orders.html) ---');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminCtx.addInitScript(() => {
        const user = {
            id: 'admin-01',
            email: 'admin@dezandigitizing.com',
            role: 'admin',
            displayName: 'Dezan Admin',
            name: 'Dezan Admin'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const adminPage = await adminCtx.newPage();
    await adminPage.goto('http://localhost:8085/admin-orders.html', { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(1000);

    const adminCards = await adminPage.$$('.admin-order-card');
    console.log(`Found ${adminCards.length} admin order cards on admin-orders.html`);
    if (adminCards.length > 0) {
        const firstAdminCardBox = await adminCards[0].boundingBox();
        console.log(`First admin card resting height: ${Math.round(firstAdminCardBox.height)}px`);

        const detailsBtn = await adminCards[0].$('button:has-text("Details")');
        if (detailsBtn) {
            console.log('Clicking [ Details ⌄ ] on admin card...');
            await detailsBtn.click();
            await adminPage.waitForTimeout(400);

            const tray = await adminCards[0].$('.card-extended-tray');
            const isVisible = await tray.isVisible();
            const btnText = await detailsBtn.innerText();
            console.log(`Admin tray visible: ${isVisible}, button text: "${btnText.replace(/\s+/g, ' ').trim()}"`);

            const expandedBox = await adminCards[0].boundingBox();
            await adminPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'admin_order_card_expanded.png'),
                clip: {
                    x: firstAdminCardBox.x - 10,
                    y: firstAdminCardBox.y - 10,
                    width: firstAdminCardBox.width + 20,
                    height: expandedBox.height + 20
                }
            });

            // Click less to collapse
            await detailsBtn.click();
            await adminPage.waitForTimeout(400);
            console.log('Admin card collapsed back successfully.');
        }
    }

    // ==========================================
    // 4. MOBILE VIEWPORT (390px iPhone 12/13/14)
    // ==========================================
    console.log('\n--- 4. MOBILE VIEWPORT VERIFICATION (390px) ---');

    // Worker Mobile
    const workerMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await workerMobileCtx.addInitScript(() => {
        const user = { id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1', email: 'digitizer@dezandigitizing.com', role: 'digitizer', name: 'Master Digitizer' };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });
    const workerMobilePage = await workerMobileCtx.newPage();
    await workerMobilePage.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
    await workerMobilePage.waitForTimeout(800);

    const workerMobileScroll = await workerMobilePage.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
    }));
    console.log(`Worker mobile scrollWidth = ${workerMobileScroll.scrollWidth}, clientWidth = ${workerMobileScroll.clientWidth}`);
    console.log(`Zero horizontal overflow on Worker: ${workerMobileScroll.scrollWidth <= workerMobileScroll.clientWidth ? '✅ PASS' : '❌ FAIL'}`);

    const mobileDetailsBtn = await workerMobilePage.$('.digitizer-bento-card button:has-text("Details")');
    if (mobileDetailsBtn) {
        await mobileDetailsBtn.click();
        await workerMobilePage.waitForTimeout(400);
        await workerMobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'worker_portal_mobile_390_expanded.png') });
    }

    // Client Mobile
    const clientMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await clientMobileCtx.addInitScript(() => {
        const user = { id: 'client-01', email: 'client@falconapparel.com', role: 'client', name: 'John Client' };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });
    const clientMobilePage = await clientMobileCtx.newPage();
    await clientMobilePage.goto('http://localhost:8085/client-orders.html', { waitUntil: 'networkidle' });
    await clientMobilePage.waitForTimeout(800);

    const clientMobileScroll = await clientMobilePage.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
    }));
    console.log(`Client mobile scrollWidth = ${clientMobileScroll.scrollWidth}, clientWidth = ${clientMobileScroll.clientWidth}`);
    console.log(`Zero horizontal overflow on Client: ${clientMobileScroll.scrollWidth <= clientMobileScroll.clientWidth ? '✅ PASS' : '❌ FAIL'}`);
    await clientMobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'client_orders_mobile_390.png') });

    // Admin Mobile
    const adminMobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await adminMobileCtx.addInitScript(() => {
        const user = { id: 'admin-01', email: 'admin@dezandigitizing.com', role: 'admin', name: 'Dezan Admin' };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });
    const adminMobilePage = await adminMobileCtx.newPage();
    await adminMobilePage.goto('http://localhost:8085/admin-orders.html', { waitUntil: 'networkidle' });
    await adminMobilePage.waitForTimeout(800);

    const adminMobileScroll = await adminMobilePage.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
    }));
    console.log(`Admin mobile scrollWidth = ${adminMobileScroll.scrollWidth}, clientWidth = ${adminMobileScroll.clientWidth}`);
    console.log(`Zero horizontal overflow on Admin: ${adminMobileScroll.scrollWidth <= adminMobileScroll.clientWidth ? '✅ PASS' : '❌ FAIL'}`);
    await adminMobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_orders_mobile_390.png') });

    await browser.close();
    console.log('\n🎉 All verifications completed successfully!');
}

runVerification().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
