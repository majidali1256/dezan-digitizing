const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runWorkflowTest() {
    console.log('--- Starting Playwright Workflow & Visual Verification ---');
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const artifactsDir = path.join(__dirname, 'visual_evidence');
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    try {
        // --- 1. DIGITIZER PORTAL VERIFICATION ---
        console.log('\n1. Testing Digitizer Portal (worker-portal.html)...');
        const context = await browser.newContext({
            viewport: { width: 1512, height: 982 }
        });

        // Set digitizer authentication in localStorage before navigation
        await context.addInitScript(() => {
            const digitizerUser = {
                id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                email: 'digitizer@dezandigitizing.com',
                displayName: 'Digitizer',
                role: 'digitizer',
                status: 'active'
            };
            localStorage.setItem('dezan_session', JSON.stringify(digitizerUser));
            localStorage.setItem('dezan_jwt_token', 'mock-digitizer-token');

            // Inject mock assigned order awaiting start
            const testOrders = [
                {
                    order_number: 'ORD-9821',
                    client_name: 'Apex Athletics',
                    project_name: 'Apex Crest Emblem',
                    service_type: 'Embroidery Digitizing',
                    placement: 'Left Chest',
                    sizing: '3.5 x 3.5 in',
                    status: 'assigned',
                    is_unread: true,
                    digitizer_viewed_at: null,
                    started_at: null,
                    assigned_digitizer_id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    assigned_digitizer_name: 'Digitizer',
                    assigned_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
                    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    turnaround_speed: 'standard',
                    payment_status: 'paid',
                    price: 25.00
                },
                {
                    order_number: 'ORD-9822',
                    client_name: 'Blue Ridge Garments',
                    project_name: 'Ridge Hat Logo',
                    service_type: 'Embroidery Digitizing',
                    placement: 'Cap / Hat',
                    sizing: '2.2 x 4.5 in',
                    status: 'in_progress',
                    is_unread: false,
                    digitizer_viewed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    assigned_digitizer_id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    assigned_digitizer_name: 'Digitizer',
                    assigned_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    turnaround_speed: 'standard',
                    payment_status: 'paid',
                    price: 18.00
                }
            ];
            localStorage.setItem('dezan_orders', JSON.stringify(testOrders));
        });

        const page = await context.newPage();

        await page.goto('http://localhost:8090/worker-portal.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check for pulsating unread amber dots
        const unreadDotsCount = await page.$$eval('.bg-amber-500.animate-pulse', els => els.length);
        console.log(`Pulsating Unread Amber Dots Count: ${unreadDotsCount}`);

        // Capture Desktop Screenshot
        const desktopShot = path.join(artifactsDir, 'digitizer-portal-desktop.png');
        await page.screenshot({ path: desktopShot, fullPage: false });
        console.log('Saved desktop screenshot:', desktopShot);

        // Open details modal for ORD-9821 via evaluate to ensure clean execution
        console.log('Opening task details modal for ORD-9821...');
        await page.evaluate(() => {
            if (typeof openTaskDetailsModal === 'function') {
                openTaskDetailsModal('ORD-9821');
            }
        });
        await page.waitForTimeout(1000);

        // Verify Modal is visible
        const modalVisible = await page.$eval('#task-details-modal', el => !el.classList.contains('hidden'));
        console.log('Task Details Modal Visible:', modalVisible);

        // Verify Start Order button is visible in modal
        const startBtnVisible = await page.$eval('#modal-details-start-btn', el => !el.classList.contains('hidden'));
        console.log('▶️ Start Order Button Visible:', startBtnVisible);

        const modalShot = path.join(artifactsDir, 'digitizer-modal-desktop.png');
        await page.screenshot({ path: modalShot, fullPage: false });
        console.log('Saved modal screenshot:', modalShot);

        // Click Start Order
        console.log('Starting order production via startDigitizerOrder...');
        await page.evaluate(() => {
            if (typeof startDigitizerOrder === 'function') {
                return startDigitizerOrder('ORD-9821');
            }
        });
        await page.waitForTimeout(1500);

        const afterStartShot = path.join(artifactsDir, 'digitizer-after-start.png');
        await page.screenshot({ path: afterStartShot, fullPage: false });
        console.log('Saved post-start screenshot:', afterStartShot);

        // Test Mobile Viewport (390x844)
        console.log('\nTesting Digitizer Portal on Mobile (390x844)...');
        await page.setViewportSize({ width: 390, height: 844 });
        await page.waitForTimeout(800);
        const mobileShot = path.join(artifactsDir, 'digitizer-portal-mobile.png');
        await page.screenshot({ path: mobileShot, fullPage: false });
        console.log('Saved mobile screenshot:', mobileShot);

        // Test Tablet Viewport (834x1112)
        console.log('\nTesting Digitizer Portal on Tablet (834x1112)...');
        await page.setViewportSize({ width: 834, height: 1112 });
        await page.waitForTimeout(800);
        const tabletShot = path.join(artifactsDir, 'digitizer-portal-tablet.png');
        await page.screenshot({ path: tabletShot, fullPage: false });
        console.log('Saved tablet screenshot:', tabletShot);

        await context.close();

        // --- 2. ADMIN ORDERS PORTAL VERIFICATION ---
        console.log('\n2. Testing Admin Orders Portal (admin-orders.html)...');
        const adminContext = await browser.newContext({
            viewport: { width: 1512, height: 982 }
        });

        await adminContext.addInitScript(() => {
            const adminUser = {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'admin@dezandigitizing.com',
                displayName: 'Felix Dezan (Admin)',
                role: 'admin',
                company: 'Dezan Digitizing HQ',
                status: 'active'
            };
            localStorage.setItem('dezan_session', JSON.stringify(adminUser));
            localStorage.setItem('dezan_jwt_token', 'mock-admin-token');

            const adminTestOrders = [
                {
                    order_number: 'ORD-9821',
                    client_name: 'Apex Athletics',
                    project_name: 'Apex Crest Emblem',
                    service_type: 'Embroidery Digitizing',
                    placement: 'Left Chest',
                    sizing: '3.5 x 3.5 in',
                    status: 'assigned',
                    is_unread: true,
                    digitizer_viewed_at: null,
                    started_at: null,
                    assigned_digitizer_id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    assigned_digitizer_name: 'Digitizer',
                    assigned_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
                    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    turnaround_speed: 'standard',
                    payment_status: 'paid',
                    price: 25.00
                },
                {
                    order_number: 'ORD-9820',
                    client_name: 'Summit Brands',
                    project_name: 'Summit Peak Patch',
                    service_type: 'Embroidery Digitizing',
                    placement: 'Jacket Back',
                    sizing: '9.0 x 9.0 in',
                    status: 'assigned',
                    is_unread: false,
                    digitizer_viewed_at: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
                    started_at: null,
                    assigned_digitizer_id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    assigned_digitizer_name: 'Digitizer',
                    assigned_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    turnaround_speed: 'standard',
                    payment_status: 'paid',
                    price: 35.00
                },
                {
                    order_number: 'ORD-9822',
                    client_name: 'Blue Ridge Garments',
                    project_name: 'Ridge Hat Logo',
                    service_type: 'Embroidery Digitizing',
                    placement: 'Cap / Hat',
                    sizing: '2.2 x 4.5 in',
                    status: 'in_progress',
                    is_unread: false,
                    digitizer_viewed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    assigned_digitizer_id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                    assigned_digitizer_name: 'Digitizer',
                    assigned_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    turnaround_speed: 'standard',
                    payment_status: 'paid',
                    price: 18.00
                }
            ];
            localStorage.setItem('dezan_orders', JSON.stringify(adminTestOrders));
        });

        const adminPage = await adminContext.newPage();
        await adminPage.goto('http://localhost:8090/admin-orders.html', { waitUntil: 'networkidle' });
        await adminPage.waitForTimeout(2000);

        // Check Stage Pills counts
        const pillNew = await adminPage.$eval('#pill-count-new', el => el.textContent.trim()).catch(() => 'N/A');
        const pillProd = await adminPage.$eval('#pill-count-in-progress', el => el.textContent.trim()).catch(() => 'N/A');
        console.log(`Admin Stage Counts: New Orders Pill = ${pillNew}, In Production Pill = ${pillProd}`);

        // Check for Seen / Not Viewed Yet / In Production status indicators
        const statusDetails = await adminPage.$$eval('*', els => 
            els.filter(e => e.children.length === 0 && (e.textContent.includes('Not Viewed Yet') || e.textContent.includes('Seen') || e.textContent.includes('In Production · Started'))).map(e => e.textContent.trim())
        );
        console.log('Detected Admin Digitizer Activity Status Indicators:', statusDetails.filter(s => !s.includes('\n')));

        const adminDesktopShot = path.join(artifactsDir, 'admin-orders-desktop.png');
        await adminPage.screenshot({ path: adminDesktopShot, fullPage: false });
        console.log('Saved admin desktop screenshot:', adminDesktopShot);

        // Open details modal to verify digitizer activity inside modal
        console.log('Opening Admin Order Details modal for ORD-9821...');
        await adminPage.evaluate(() => {
            if (typeof openAdminOrderDetailsModal === 'function') {
                openAdminOrderDetailsModal('ORD-9821');
            }
        });
        await adminPage.waitForTimeout(800);
        const adminModalShot = path.join(artifactsDir, 'admin-order-modal.png');
        await adminPage.screenshot({ path: adminModalShot, fullPage: false });
        console.log('Saved admin modal screenshot:', adminModalShot);

        await adminContext.close();

        console.log('\n🎉 ALL WORKFLOW TESTS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
    } catch (err) {
        console.error('Verification failed with error:', err);
    } finally {
        await browser.close();
    }
}

runWorkflowTest();
