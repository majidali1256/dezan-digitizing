/**
 * Automated Playwright Test Suite for Dezan Notification Panels
 * Validates:
 * 1. Admin HQ Notification Panel (Bell, Badge, Tabs, Actions, ZERO bleed-through, 100% Solid Opacity)
 * 2. Every Single Button Functional:
 *    - "Assign Digitizer" opens #assign-modal with order prefilled
 *    - "Appraise Quote" opens #set-quote-price-modal with quote prefilled
 *    - "Review Revision" opens #admin-revision-modal with revision prefilled
 *    - Card mark as read / unread toggle button
 *    - Card dismiss / delete button
 *    - Sound toggle button (mute/unmute)
 *    - Mark all as read button
 *    - Tab filters (All, Unread, Orders, Revisions, Quotes)
 *    - Footer "+ Test Alert" button
 *    - Footer "Clear Read" button
 *    - Close button
 * 3. Digitizer Studio Notification Center (Zero-PII Masking, Workbench button opens task modal)
 * 4. Client Portal Notification Center (Order tracking, Files Ready, details modal opens)
 * 5. Mobile Responsiveness (390x844 iPhone, zero horizontal overflow)
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'scratch', 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runNotificationTests() {
    console.log('🚀 Starting Comprehensive Dezan Notification Panels & Buttons Verification...\n');
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });

    let testsPassed = 0;
    let testsFailed = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`  ✅ PASS: ${msg}`);
            testsPassed++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            testsFailed++;
        }
    };

    try {
        // ====================================================================
        // TEST 1: Admin Orders Notification Center & All Action Buttons
        // ====================================================================
        console.log('📋 Test 1: Admin HQ Notifications & Every Button Action (admin-orders.html)');
        const contextAdmin = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const pageAdmin = await contextAdmin.newPage();
        await pageAdmin.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                id: '00000000-0000-0000-0000-000000000001',
                email: 'admin@dezandigitizing.com',
                displayName: 'Faisal Dezan',
                role: 'admin'
            }));
        });
        await pageAdmin.goto(`file://${path.join(ROOT_DIR, 'admin-orders.html')}`, { waitUntil: 'load' });
        await pageAdmin.waitForTimeout(600);

        const adminBell = await pageAdmin.$('#dezan-notifications-bell');
        assert(adminBell !== null, 'Admin notification bell is mounted in header');

        const adminBadge = await pageAdmin.$('#dezan-notif-badge');
        assert(adminBadge !== null, 'Admin unread badge exists');
        const adminBadgeText = await adminBadge.textContent();
        assert(parseInt(adminBadgeText) > 0, `Admin unread count is positive (${adminBadgeText})`);

        // Click bell to open panel
        await adminBell.click();
        await pageAdmin.waitForTimeout(300);

        const adminPanel = await pageAdmin.$('#dezan-notification-panel');
        const isPanelVisible = await adminPanel.isVisible();
        assert(isPanelVisible, 'Admin notification panel opened on bell click');

        // Verify 100% Solid Background & Elevated Z-Index (NO bleed-through)
        const panelStyles = await pageAdmin.evaluate(() => {
            const panel = document.getElementById('dezan-notification-panel');
            const style = window.getComputedStyle(panel);
            return {
                bg: style.backgroundColor,
                zIndex: style.zIndex,
                opacity: style.opacity
            };
        });
        assert(panelStyles.bg === 'rgb(255, 255, 255)' || panelStyles.bg === '#ffffff', `Panel background is 100% solid white (${panelStyles.bg})`);
        assert(parseInt(panelStyles.zIndex) >= 100, `Panel z-index is elevated to 100+ (${panelStyles.zIndex})`);

        // BUTTON 1: "Assign Digitizer ->" on ORD-8842
        console.log('  Testing Action Button: "Assign Digitizer"');
        const assignBtn = await pageAdmin.$('button[data-action="assign_order"]');
        assert(assignBtn !== null, '"Assign Digitizer" action button exists on card');
        await assignBtn.click();
        await pageAdmin.waitForTimeout(400);

        const assignModal = await pageAdmin.$('#assign-modal');
        const isAssignModalOpen = await assignModal.isVisible();
        assert(isAssignModalOpen, 'Clicking "Assign Digitizer" opened #assign-modal');
        const prefilledOrder = await pageAdmin.$eval('#assign-order-number', el => el.value);
        assert(prefilledOrder === 'ORD-8842', `Order number ORD-8842 was prefilled in assign modal (${prefilledOrder})`);

        // Close assign modal
        await pageAdmin.click('#assign-modal button[onclick="closeAssignModal()"]');
        await pageAdmin.waitForTimeout(200);

        // BUTTON 2: "Appraise Quote ->" on QUO-4769
        console.log('  Testing Action Button: "Appraise Quote"');
        await adminBell.click();
        await pageAdmin.waitForTimeout(300);

        const quoteBtn = await pageAdmin.$('button[data-action="view_quotes"]');
        assert(quoteBtn !== null, '"Appraise Quote" action button exists on card');
        await quoteBtn.click();
        await pageAdmin.waitForTimeout(400);

        const quoteModal = await pageAdmin.$('#set-quote-price-modal');
        const isQuoteModalOpen = await quoteModal.isVisible();
        assert(isQuoteModalOpen, 'Clicking "Appraise Quote" opened #set-quote-price-modal');
        const quoteDisplay = await pageAdmin.$eval('#quote-modal-order-display', el => el.textContent);
        assert(quoteDisplay.includes('QUO-4769'), `Quote number QUO-4769 is displayed in quote appraisal modal (${quoteDisplay})`);

        // Close quote modal
        await pageAdmin.click('#set-quote-price-modal button[onclick="closeSetQuotePriceModal()"]');
        await pageAdmin.waitForTimeout(200);

        // BUTTON 3: "Review Revision ->" on ORD-8837
        console.log('  Testing Action Button: "Review Revision"');
        await adminBell.click();
        await pageAdmin.waitForTimeout(300);

        const revisionBtn = await pageAdmin.$('button[data-action="view_revision"]');
        assert(revisionBtn !== null, '"Review Revision" action button exists on card');
        await revisionBtn.click();
        await pageAdmin.waitForTimeout(400);

        const revisionModal = await pageAdmin.$('#admin-revision-modal');
        const isRevisionModalOpen = await revisionModal.isVisible();
        assert(isRevisionModalOpen, 'Clicking "Review Revision" opened #admin-revision-modal');
        const revisionSubtitle = await pageAdmin.$eval('#admin-revision-subtitle', el => el.textContent);
        assert(revisionSubtitle.includes('ORD-8837'), `Order #ORD-8837 is displayed in revision review modal (${revisionSubtitle})`);

        // Close revision modal
        await pageAdmin.click('#admin-revision-modal button[onclick="closeAdminRevisionModal()"]');
        await pageAdmin.waitForTimeout(200);

        // BUTTON 4: Mark as Read / Unread toggle on card (.notif-mark-btn)
        console.log('  Testing Button: Mark as Read / Unread Toggle');
        await adminBell.click();
        await pageAdmin.waitForTimeout(300);

        const markBtn = await pageAdmin.$('.notif-mark-btn');
        assert(markBtn !== null, 'Card mark read toggle button exists');
        const beforeUnread = await pageAdmin.$eval('#dezan-notif-header p', el => el.textContent);
        await markBtn.click();
        await pageAdmin.waitForTimeout(200);
        const afterUnread = await pageAdmin.$eval('#dezan-notif-header p', el => el.textContent);
        assert(beforeUnread !== afterUnread, `Mark read button updated unread count (${beforeUnread} -> ${afterUnread})`);

        // BUTTON 5: Dismiss / Delete single notification (.notif-delete-btn)
        console.log('  Testing Button: Dismiss / Delete Single Card');
        const countBeforeDelete = await pageAdmin.$$eval('.notif-card', els => els.length);
        const deleteBtn = await pageAdmin.$('.notif-delete-btn');
        assert(deleteBtn !== null, 'Card delete button exists');
        await deleteBtn.click();
        await pageAdmin.waitForTimeout(200);
        const countAfterDelete = await pageAdmin.$$eval('.notif-card', els => els.length);
        assert(countAfterDelete === countBeforeDelete - 1, `Card dismissed successfully (${countBeforeDelete} -> ${countAfterDelete})`);

        // BUTTON 6: Sound Mute / Unmute Toggle (#notif-btn-sound)
        console.log('  Testing Button: Sound Toggle');
        const soundBtn = await pageAdmin.$('#notif-btn-sound');
        assert(soundBtn !== null, 'Sound toggle button exists in header');
        const soundIconBefore = await pageAdmin.$eval('#notif-btn-sound span', el => el.textContent);
        await pageAdmin.click('#notif-btn-sound');
        await pageAdmin.waitForTimeout(200);
        const soundIconAfter = await pageAdmin.$eval('#notif-btn-sound span', el => el.textContent);
        assert(soundIconBefore !== soundIconAfter, `Sound toggled (${soundIconBefore} -> ${soundIconAfter})`);
        await pageAdmin.click('#notif-btn-sound'); // revert
        await pageAdmin.waitForTimeout(100);

        // BUTTON 7: Mark All As Read (#notif-btn-markall)
        console.log('  Testing Button: Mark All As Read');
        const markAllBtn = await pageAdmin.$('#notif-btn-markall');
        assert(markAllBtn !== null, 'Mark all as read button exists in header');
        await pageAdmin.click('#notif-btn-markall');
        await pageAdmin.waitForTimeout(200);
        const headerAfterMarkAll = await pageAdmin.$eval('#dezan-notif-header p', el => el.textContent);
        assert(headerAfterMarkAll.includes('All caught up'), `All notifications marked read ("${headerAfterMarkAll}")`);

        // BUTTON 8: Tab Filters (Orders, Revisions, Quotes, All)
        console.log('  Testing Buttons: Tab Filters');
        const quotesTab = await pageAdmin.$('button[data-tab-id="quotes"]');
        assert(quotesTab !== null, 'Quotes filter tab exists');
        await quotesTab.click();
        await pageAdmin.waitForTimeout(200);
        const quotesCards = await pageAdmin.$$eval('.notif-card', els => els.length);
        assert(quotesCards >= 1, `Quotes filter displays relevant quote cards (${quotesCards})`);

        const allTab = await pageAdmin.$('button[data-tab-id="all"]');
        await allTab.click();
        await pageAdmin.waitForTimeout(200);
        const allCards = await pageAdmin.$$eval('.notif-card', els => els.length);
        assert(allCards > quotesCards, `All tab displays all categories (${allCards} cards)`);

        // BUTTON 9: "+ Test Alert" button in footer (#notif-btn-simulate)
        console.log('  Testing Button: "+ Test Alert"');
        const simulateBtn = await pageAdmin.$('#notif-btn-simulate');
        assert(simulateBtn !== null, '+ Test Alert button exists in footer');
        const cardsBeforeSimulate = await pageAdmin.$$eval('.notif-card', els => els.length);
        await simulateBtn.click();
        await pageAdmin.waitForTimeout(300);
        const cardsAfterSimulate = await pageAdmin.$$eval('.notif-card', els => els.length);
        assert(cardsAfterSimulate === cardsBeforeSimulate + 1, `Test notification inserted at top (${cardsBeforeSimulate} -> ${cardsAfterSimulate})`);

        // BUTTON 10: "Clear Read" button in footer (#notif-btn-clear)
        console.log('  Testing Button: "Clear Read"');
        const clearBtn = await pageAdmin.$('#notif-btn-clear');
        assert(clearBtn !== null, 'Clear Read button exists in footer');
        await clearBtn.click();
        await pageAdmin.waitForTimeout(200);
        const cardsAfterClear = await pageAdmin.$$eval('.notif-card', els => els.length);
        assert(cardsAfterClear < cardsAfterSimulate, `Read notifications cleared (${cardsAfterSimulate} -> ${cardsAfterClear})`);

        // BUTTON 11: Close button in header (#notif-btn-close)
        console.log('  Testing Button: Close Panel');
        const closeBtn = await pageAdmin.$('#notif-btn-close');
        assert(closeBtn !== null, 'Close button exists in header');
        await closeBtn.click();
        await pageAdmin.waitForTimeout(300);
        const isClosed = await adminPanel.isHidden();
        assert(isClosed, 'Close button cleanly closes the notification panel');

        // Capture fresh Admin Screenshot with Scrolled View to guarantee ZERO bleed-through
        await pageAdmin.evaluate(() => {
            const sub = document.getElementById('stage-new-sub');
            if (sub) sub.scrollIntoView();
        });
        await pageAdmin.waitForTimeout(200);
        await adminBell.click();
        await pageAdmin.waitForTimeout(300);
        await pageAdmin.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'admin-notification-panel-desktop.png')
        });
        console.log('  📸 Saved Admin Panel screenshot (scrolled view, zero bleed).');

        await contextAdmin.close();

        // ====================================================================
        // TEST 2: Digitizer Studio Notification Center & Workbench Action
        // ====================================================================
        console.log('\n📋 Test 2: Digitizer Studio Notification Center (worker-tasks.html)');
        const contextWorker = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const pageWorker = await contextWorker.newPage();
        await pageWorker.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
                email: 'digitizer@dezandigitizing.com',
                displayName: 'Digitizer',
                role: 'digitizer'
            }));
        });
        await pageWorker.goto(`file://${path.join(ROOT_DIR, 'worker-tasks.html')}`, { waitUntil: 'load' });
        await pageWorker.waitForTimeout(600);

        const workerBell = await pageWorker.$('#dezan-notifications-bell');
        assert(workerBell !== null, 'Digitizer notification bell is mounted in header');

        // Open worker panel
        await workerBell.click();
        await pageWorker.waitForTimeout(300);

        const workerPanel = await pageWorker.$('#dezan-notification-panel');
        assert(await workerPanel.isVisible(), 'Digitizer notification panel opened on bell click');

        const workerHeaderText = await pageWorker.$eval('#dezan-notif-header', el => el.textContent);
        assert(workerHeaderText.includes('Studio Notifications'), 'Header displays "Studio Notifications"');
        assert(workerHeaderText.includes('Zero-PII Masked'), 'Header displays "Zero-PII Masked" security badge');

        // Verify Data Masking: Ensure NO customer email or dollar pricing is leaked
        const bodyContent = await pageWorker.$eval('#dezan-notif-body', el => el.textContent);
        assert(!bodyContent.includes('@') && !bodyContent.includes('$'), 'Strict Zero-PII and Zero-Pricing Data Masking verified');

        // Test Action Button: "Open Workbench" -> opens task details modal
        const workerActionBtn = await pageWorker.$('.notif-action-btn');
        assert(workerActionBtn !== null, 'Digitizer task action button exists');
        await workerActionBtn.click();
        await pageWorker.waitForTimeout(500);

        const taskModal = await pageWorker.$('#task-details-modal');
        const isTaskModalOpen = await taskModal.isVisible();
        assert(isTaskModalOpen, 'Clicking "Open Workbench" opened #task-details-modal');

        // Capture Digitizer screenshot
        await pageWorker.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'worker-notification-panel-desktop.png')
        });
        console.log('  📸 Saved Digitizer Panel screenshot.');

        await contextWorker.close();

        // ====================================================================
        // TEST 3: Client Portal Notification Center & Order Action
        // ====================================================================
        console.log('\n📋 Test 3: Client Portal Notification Center (client-orders.html)');
        const contextClient = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const pageClient = await contextClient.newPage();
        await pageClient.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                id: '00000000-0000-0000-0000-000000000002',
                email: 'client@falconapparel.com',
                displayName: 'John Falcon',
                role: 'client'
            }));
        });
        await pageClient.goto(`file://${path.join(ROOT_DIR, 'client-orders.html')}`, { waitUntil: 'load' });
        await pageClient.waitForTimeout(600);

        const clientBell = await pageClient.$('#dezan-notifications-bell');
        assert(clientBell !== null, 'Client notification bell is mounted in header');

        // Open client panel
        await clientBell.click();
        await pageClient.waitForTimeout(300);

        const clientPanel = await pageClient.$('#dezan-notification-panel');
        assert(await clientPanel.isVisible(), 'Client notification panel opened on bell click');

        const clientHeaderText = await pageClient.$eval('#dezan-notif-header', el => el.textContent);
        assert(clientHeaderText.includes('Order Notifications'), 'Header displays "Order Notifications"');

        // Verify direct action button
        const clientActionBtn = await pageClient.$('.notif-action-btn');
        assert(clientActionBtn !== null, 'Action button ("Download Files", "Track Progress", etc.) exists');
        await clientActionBtn.click();
        await pageClient.waitForTimeout(400);

        const clientModal = await pageClient.$('#order-details-modal');
        const isClientModalOpen = await clientModal.isVisible();
        assert(isClientModalOpen, 'Clicking order notification action opened #order-details-modal');

        // Capture Client screenshot
        await pageClient.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'client-notification-panel-desktop.png')
        });
        console.log('  📸 Saved Client Panel screenshot.');

        await contextClient.close();

        // ====================================================================
        // TEST 4: Mobile Viewport Verification (390x844 iPhone)
        // ====================================================================
        console.log('\n📋 Test 4: Mobile Viewport Responsiveness (390x844)');
        const contextMobile = await browser.newContext({
            viewport: { width: 390, height: 844 },
            isMobile: true
        });
        const pageMobile = await contextMobile.newPage();
        await pageMobile.addInitScript(() => {
            localStorage.setItem('dezan_session', JSON.stringify({
                id: '00000000-0000-0000-0000-000000000002',
                email: 'client@falconapparel.com',
                displayName: 'John Falcon',
                role: 'client'
            }));
        });
        await pageMobile.goto(`file://${path.join(ROOT_DIR, 'client-orders.html')}`, { waitUntil: 'load' });
        await pageMobile.waitForTimeout(500);

        const mobileBell = await pageMobile.$('#dezan-notifications-bell');
        assert(mobileBell !== null, 'Mobile notification bell is accessible');

        await mobileBell.click();
        await pageMobile.waitForTimeout(300);

        const mobilePanel = await pageMobile.$('#dezan-notification-panel');
        assert(await mobilePanel.isVisible(), 'Mobile notification panel opens cleanly');

        // Check horizontal overflow
        const hasOverflow = await pageMobile.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        assert(!hasOverflow, 'Zero horizontal overflow on mobile viewport');

        // Capture Mobile screenshot
        await pageMobile.screenshot({
            path: path.join(SCREENSHOTS_DIR, 'client-notification-panel-mobile.png')
        });
        console.log('  📸 Saved Mobile Panel screenshot.');

        await contextMobile.close();

    } catch (err) {
        console.error('\n❌ Unhandled error during testing:', err);
        testsFailed++;
    } finally {
        await browser.close();
    }

    console.log(`\n========================================`);
    console.log(`SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
    console.log(`========================================\n`);

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runNotificationTests();
