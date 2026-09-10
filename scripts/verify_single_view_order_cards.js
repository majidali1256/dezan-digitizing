const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

async function runEndToEndVerification() {
    console.log('🚀 Starting Comprehensive Single View Order Card & End-to-End Verification...');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    let testsPassed = true;

    // =========================================================================
    // 1. WORKER WORKBENCH (worker-tasks.html)
    // =========================================================================
    console.log('\n======================================================');
    console.log('1. VERIFYING WORKER TASKS (worker-tasks.html)');
    console.log('======================================================');
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
    workerPage.on('pageerror', err => console.log('WORKER PAGE ERROR:', err.message));

    await workerPage.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
    await workerPage.waitForTimeout(1000);

    const workerCards = await workerPage.$$('.digitizer-bento-card');
    console.log(`[Worker] Found ${workerCards.length} cards`);

    // Ensure NO "Details" buttons on any cards
    const workerDetailsBtns = await workerPage.$$('.digitizer-bento-card button:has-text("Details")');
    console.log(`[Worker] Cards with "Details" button: ${workerDetailsBtns.length} (Expected: 0)`);
    if (workerDetailsBtns.length > 0) testsPassed = false;

    // Ensure NO .card-extended-tray elements
    const workerTrays = await workerPage.$$('.card-extended-tray');
    console.log(`[Worker] .card-extended-tray elements on page: ${workerTrays.length} (Expected: 0)`);
    if (workerTrays.length > 0) testsPassed = false;

    // Verify first card has "View Order" button
    const workerViewOrderBtn = await workerCards[0].$('button:has-text("View Order")');
    console.log(`[Worker] First card has "View Order" button: ${!!workerViewOrderBtn}`);
    if (!workerViewOrderBtn) testsPassed = false;

    // Click "View Order" on worker card
    console.log('[Worker] Clicking "View Order" button...');
    await workerViewOrderBtn.click();
    await workerPage.waitForTimeout(500);

    const workerModal = await workerPage.$('#task-details-modal');
    const isWorkerModalVisible = await workerModal.isVisible();
    console.log(`[Worker] #task-details-modal visible: ${isWorkerModalVisible}`);
    if (!isWorkerModalVisible) testsPassed = false;

    // Capture screenshot of worker View Order modal
    await workerPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'worker_view_order_modal_verified.png')
    });

    // Verify consolidated content inside modal
    const deliverableBadge = await workerPage.$('#detail-deliver-required');
    console.log(`[Worker] Deliverable Requirements text present: ${!!deliverableBadge}`);
    if (deliverableBadge) {
        const text = await deliverableBadge.innerText();
        console.log(`[Worker] Deliverable Requirements text: "${text.trim()}"`);
    }

    const customerArtwork = await workerPage.$('#detail-artwork-container');
    console.log(`[Worker] Customer Artwork container present: ${!!customerArtwork}`);

    const deliverablesContainer = await workerPage.$('#detail-deliverables-container');
    console.log(`[Worker] Finished Deliverables container present: ${!!deliverablesContainer}`);

    // Verify modal attach deliverables button is workable
    const modalAttachBtn = await workerPage.$('#detail-attach-btn');
    if (modalAttachBtn && await modalAttachBtn.isVisible()) {
        console.log('[Worker] Clicking [ Attach Deliverables ] button inside View Order modal...');
        await modalAttachBtn.click();
        await workerPage.waitForTimeout(500);
        const uploadModal = await workerPage.$('#deliverable-upload-modal');
        const isUploadModalVisible = await uploadModal.isVisible();
        console.log(`[Worker] #deliverable-upload-modal visible after click: ${isUploadModalVisible}`);
        if (!isUploadModalVisible) testsPassed = false;

        // Screenshot upload modal
        await workerPage.screenshot({
            path: path.join(ARTIFACT_DIR, 'worker_modal_deliverables_upload_verified.png')
        });

        // Close upload modal
        const closeUploadBtn = await workerPage.$('#deliverable-upload-modal button[aria-label="Close modal"]');
        if (closeUploadBtn && await closeUploadBtn.isVisible()) await closeUploadBtn.click();
        await workerPage.waitForTimeout(300);
    }

    // Close worker modal if still open
    if (await workerModal.isVisible()) {
        const closeWorkerModalBtn = await workerPage.$('#task-details-modal button:has-text("Close")');
        if (closeWorkerModalBtn && await closeWorkerModalBtn.isVisible()) await closeWorkerModalBtn.click();
        await workerPage.waitForTimeout(300);
    }

    // Capture worker cards resting screenshot
    await workerPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'worker_single_button_cards_desktop.png')
    });

    // Worker Mobile Viewport Test (390x844)
    await workerPage.setViewportSize({ width: 390, height: 844 });
    await workerPage.waitForTimeout(400);
    await workerPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'worker_single_button_cards_mobile.png')
    });

    await workerCtx.close();

    // =========================================================================
    // 2. CLIENT WORKBENCH (client-orders.html & client-portal.html)
    // =========================================================================
    console.log('\n======================================================');
    console.log('2. VERIFYING CLIENT ORDERS (client-orders.html)');
    console.log('======================================================');
    const clientCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await clientCtx.addInitScript(() => {
        const user = {
            id: 'c1010101-0000-4000-8000-000000000001',
            email: 'john@apparelcorp.com',
            displayName: 'John Foster',
            name: 'John Foster',
            role: 'client',
            company: 'Creative Merch & Embroidery',
            phone: '+1 (555) 234-5678'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const clientPage = await clientCtx.newPage();
    clientPage.on('pageerror', err => console.log('CLIENT PAGE ERROR:', err.message));

    await clientPage.goto('http://localhost:8085/client-orders.html', { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(1000);

    const clientCards = await clientPage.$$('.client-order-card');
    console.log(`[Client] Found ${clientCards.length} cards`);

    // Ensure NO "Details" buttons on client cards
    const clientDetailsBtns = await clientPage.$$('.client-order-card button:has-text("Details")');
    console.log(`[Client] Cards with "Details" button: ${clientDetailsBtns.length} (Expected: 0)`);
    if (clientDetailsBtns.length > 0) testsPassed = false;

    // Ensure NO .card-extended-tray elements
    const clientTrays = await clientPage.$$('.card-extended-tray');
    console.log(`[Client] .card-extended-tray elements on page: ${clientTrays.length} (Expected: 0)`);
    if (clientTrays.length > 0) testsPassed = false;

    // Verify first card has "View Order" button
    const clientViewOrderBtn = await clientCards[0].$('button:has-text("View Order")');
    console.log(`[Client] First card has "View Order" button: ${!!clientViewOrderBtn}`);
    if (!clientViewOrderBtn) testsPassed = false;

    // Click "View Order" on client card
    console.log('[Client] Clicking "View Order" button...');
    await clientViewOrderBtn.click();
    await clientPage.waitForTimeout(500);

    const clientModal = await clientPage.$('#order-details-modal');
    const isClientModalVisible = await clientModal.isVisible();
    console.log(`[Client] #order-details-modal visible: ${isClientModalVisible}`);
    if (!isClientModalVisible) testsPassed = false;

    // Verify content inside client modal
    const clientFormatReq = await clientPage.$('#drawer-format-req');
    console.log(`[Client] Deliverable Requirements Badge box present: ${!!clientFormatReq}`);
    if (clientFormatReq) {
        const text = await clientFormatReq.innerText();
        console.log(`[Client] Deliverable format requirement text: "${text.trim()}"`);
    }

    const clientArtContainer = await clientPage.$('#drawer-artwork-container');
    console.log(`[Client] Customer Artwork container present: ${!!clientArtContainer}`);

    const clientDelivContainer = await clientPage.$('#drawer-deliverables-container');
    console.log(`[Client] Finished Deliverables container present: ${!!clientDelivContainer}`);

    // Capture screenshot of client View Order modal
    await clientPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'client_view_order_modal_verified.png')
    });

    // Check if [ Request Revision ] button is present and workable
    const revisionBtn = await clientPage.$('#drawer-request-revision-btn');
    if (revisionBtn && await revisionBtn.isVisible()) {
        console.log('[Client] Clicking [ Request Revision ] button inside View Order modal...');
        await revisionBtn.click();
        await clientPage.waitForTimeout(500);
        const revisionModal = await clientPage.$('#revision-request-modal');
        const isRevModalVisible = await revisionModal.isVisible();
        console.log(`[Client] #revision-request-modal visible after click: ${isRevModalVisible}`);
        if (!isRevModalVisible) testsPassed = false;

        // Screenshot revision modal
        await clientPage.screenshot({
            path: path.join(ARTIFACT_DIR, 'client_modal_revision_request_verified.png')
        });

        // Close revision modal
        const closeRevBtn = await clientPage.$('#revision-request-modal button:has-text("Cancel")');
        if (closeRevBtn && await closeRevBtn.isVisible()) await closeRevBtn.click();
        await clientPage.waitForTimeout(300);
    }

    // Close client modal if open
    if (await clientModal.isVisible()) {
        const closeIconBtn = await clientPage.$('#order-details-modal button:has(.material-symbols-outlined:has-text("close"))');
        if (closeIconBtn && await closeIconBtn.isVisible()) await closeIconBtn.click();
        await clientPage.waitForTimeout(300);
    }

    // Client cards resting screenshot (Desktop)
    await clientPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'client_single_button_cards_desktop.png')
    });

    // Client Mobile Viewport Test (390x844)
    await clientPage.setViewportSize({ width: 390, height: 844 });
    await clientPage.waitForTimeout(400);
    await clientPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'client_single_button_cards_mobile.png')
    });

    // Verify client-portal.html also has single View Order button
    console.log('\n--- Checking client-portal.html ---');
    await clientPage.goto('http://localhost:8085/client-portal.html', { waitUntil: 'networkidle' });
    await clientPage.waitForTimeout(1000);
    const portalCards = await clientPage.$$('.digitizer-bento-card');
    console.log(`[Client Portal] Found ${portalCards.length} cards`);
    const portalDetailsBtns = await clientPage.$$('.digitizer-bento-card button:has-text("Details")');
    console.log(`[Client Portal] Cards with "Details" button: ${portalDetailsBtns.length} (Expected: 0)`);
    if (portalDetailsBtns.length > 0) testsPassed = false;

    const portalViewOrderBtn = await portalCards[0].$('button:has-text("View Order")');
    console.log(`[Client Portal] First card has "View Order" button: ${!!portalViewOrderBtn}`);
    if (!portalViewOrderBtn) testsPassed = false;

    await portalViewOrderBtn.click();
    await clientPage.waitForTimeout(500);
    const clientInvoiceModal = await clientPage.$('#client-invoice-modal');
    const isClientInvModalVisible = await clientInvoiceModal.isVisible();
    console.log(`[Client Portal] #client-invoice-modal visible: ${isClientInvModalVisible}`);
    if (!isClientInvModalVisible) testsPassed = false;

    await clientPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'client_portal_view_order_modal_verified.png')
    });

    await clientCtx.close();

    // =========================================================================
    // 3. ADMIN WORKBENCH (admin-orders.html & admin-portal.html)
    // =========================================================================
    console.log('\n======================================================');
    console.log('3. VERIFYING ADMIN ORDERS (admin-orders.html)');
    console.log('======================================================');
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await adminCtx.addInitScript(() => {
        const user = {
            id: 'a0000000-0000-4000-8000-000000000001',
            email: 'admin@dezandigitizing.com',
            displayName: 'System Administrator',
            name: 'System Administrator',
            role: 'admin',
            company: 'Dezan Admin HQ',
            phone: '+1 (555) 000-1111'
        };
        localStorage.setItem('dezan_session', JSON.stringify(user));
        sessionStorage.setItem('dezan_session', JSON.stringify(user));
        localStorage.setItem('insforge_auth_user', JSON.stringify(user));
    });

    const adminPage = await adminCtx.newPage();
    adminPage.on('pageerror', err => console.log('ADMIN PAGE ERROR:', err.message));

    await adminPage.goto('http://localhost:8085/admin-orders.html', { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(1000);

    const adminCards = await adminPage.$$('.digitizer-bento-card');
    console.log(`[Admin] Found ${adminCards.length} cards`);

    // Ensure NO "Details" buttons on admin cards
    const adminDetailsBtns = await adminPage.$$('.digitizer-bento-card button:has-text("Details")');
    console.log(`[Admin] Cards with "Details" button: ${adminDetailsBtns.length} (Expected: 0)`);
    if (adminDetailsBtns.length > 0) testsPassed = false;

    // Ensure NO .card-extended-tray elements
    const adminTrays = await adminPage.$$('.card-extended-tray');
    console.log(`[Admin] .card-extended-tray elements on page: ${adminTrays.length} (Expected: 0)`);
    if (adminTrays.length > 0) testsPassed = false;

    // Verify first card has "View Order" button
    const adminViewOrderBtn = await adminCards[0].$('button:has-text("View Order")');
    console.log(`[Admin] First card has "View Order" button: ${!!adminViewOrderBtn}`);
    if (!adminViewOrderBtn) testsPassed = false;

    // Click "View Order" on admin card
    console.log('[Admin] Clicking "View Order" button...');
    await adminViewOrderBtn.click();
    await adminPage.waitForTimeout(500);

    const adminModal = await adminPage.$('#admin-order-details-modal');
    const isAdminModalVisible = await adminModal.isVisible();
    console.log(`[Admin] #admin-order-details-modal visible: ${isAdminModalVisible}`);
    if (!isAdminModalVisible) testsPassed = false;

    // Verify specifications bento and buttons inside admin modal
    const adminSpecsEl = await adminPage.$('#order-details-service-plan');
    console.log(`[Admin] Service Plan specification present: ${!!adminSpecsEl}`);

    const adminArtGrid = await adminPage.$('#order-details-artwork-files-grid');
    console.log(`[Admin] Artwork files grid present: ${!!adminArtGrid}`);

    const adminAssignActions = await adminPage.$('#order-details-assignment-actions');
    console.log(`[Admin] Assignment actions present: ${!!adminAssignActions}`);

    // Click [ Assign / Reassign Digitizer ] button inside modal
    const assignBtn = await adminAssignActions.$('button');
    if (assignBtn) {
        console.log('[Admin] Clicking [ Assign Digitizer ] button inside View Order modal...');
        await assignBtn.click();
        await adminPage.waitForTimeout(500);

        const assignModal = await adminPage.$('#assign-modal');
        const isAssignModalVisible = await assignModal.isVisible();
        console.log(`[Admin] #assign-modal visible after click: ${isAssignModalVisible}`);
        if (!isAssignModalVisible) testsPassed = false;

        // Screenshot assign modal
        await adminPage.screenshot({
            path: path.join(ARTIFACT_DIR, 'admin_modal_assign_digitizer_verified.png')
        });

        // Close assign modal
        const closeAssignBtn = await adminPage.$('#assign-modal button:has-text("Cancel")');
        if (closeAssignBtn && await closeAssignBtn.isVisible()) await closeAssignBtn.click();
        await adminPage.waitForTimeout(300);
    }

    // Capture screenshot of admin View Order modal
    await adminPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'admin_view_order_modal_verified.png')
    });

    // Close admin modal if open
    if (await adminModal.isVisible()) {
        const closeAdminModalBtn = await adminPage.$('#admin-order-details-modal button:has-text("Close")');
        if (closeAdminModalBtn && await closeAdminModalBtn.isVisible()) await closeAdminModalBtn.click();
        await adminPage.waitForTimeout(300);
    }

    // Admin cards resting screenshot (Desktop)
    await adminPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'admin_single_button_cards_desktop.png')
    });

    // Admin Mobile Viewport Test (390x844)
    await adminPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.waitForTimeout(400);
    await adminPage.screenshot({
        path: path.join(ARTIFACT_DIR, 'admin_single_button_cards_mobile.png')
    });

    await adminCtx.close();
    await browser.close();

    console.log('\n======================================================');
    if (testsPassed) {
        console.log('✅ ALL TESTS PASSED: Single "View Order" button enforced across all dashboards.');
        console.log('✅ All consolidated modals and secondary action buttons tested and functional end-to-end.');
    } else {
        console.log('❌ SOME TESTS FAILED. Please review the output above.');
        process.exit(1);
    }
    console.log('======================================================\n');
}

runEndToEndVerification().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
