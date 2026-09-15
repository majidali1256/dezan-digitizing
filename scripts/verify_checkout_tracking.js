const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('🚀 Starting Comprehensive Checkout + Google Ads Tracking Verification...\n');

    const browser = await chromium.launch({
        headless: true,
        channel: 'chrome'
    });
    const context = await browser.newContext({
        viewport: { width: 1512, height: 982 }
    });
    const page = await context.newPage();

    const trackedGtagEvents = [];
    const trackedDataLayerEvents = [];

    // Expose binding to intercept gtag calls and dataLayer pushes
    await page.exposeFunction('onGtagCall', (type, eventName, params) => {
        trackedGtagEvents.push({ type, eventName, params });
    });

    await page.exposeFunction('onDataLayerPush', (item) => {
        trackedDataLayerEvents.push(item);
    });

    await page.addInitScript(() => {
        window.dataLayer = window.dataLayer || [];
        const originalPush = window.dataLayer.push;
        window.dataLayer.push = function(...args) {
            args.forEach(arg => {
                if (window.onDataLayerPush) window.onDataLayerPush(arg);
            });
            return originalPush.apply(this, args);
        };

        window.gtag = function(...args) {
            if (window.onGtagCall) window.onGtagCall(args[0], args[1], args[2]);
            originalPush.call(window.dataLayer, args);
        };
    });

    const testUrl = 'http://localhost:5001/?gclid=EAIaIQobChMI_test_gclid_12345&gbraid=test_gbraid_999&wbraid=test_wbraid_888&utm_source=google&utm_medium=cpc&utm_campaign=embroidery_digitizing_us&utm_term=embroidery%20digitizing%20service&utm_content=ad_copy_1';
    
    console.log(`1. Navigating to Landing Page with Ad Parameters:`);
    console.log(`   ${testUrl}\n`);
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // =========================================================================
    // Test 1: Traffic Attribution Capture & Persistence
    // =========================================================================
    console.log('--- Test 1: Traffic Attribution Capture & Persistence ---');
    const attribution = await page.evaluate(() => {
        return window.dezanTracker ? window.dezanTracker.getAttribution() : null;
    });

    console.log('Captured Attribution:', JSON.stringify(attribution, null, 2));
    if (!attribution) throw new Error('dezanTracker.getAttribution() returned null');
    if (attribution.gclid !== 'EAIaIQobChMI_test_gclid_12345') throw new Error(`gclid mismatch: ${attribution.gclid}`);
    if (attribution.gbraid !== 'test_gbraid_999') throw new Error(`gbraid mismatch: ${attribution.gbraid}`);
    if (attribution.wbraid !== 'test_wbraid_888') throw new Error(`wbraid mismatch: ${attribution.wbraid}`);
    if (attribution.utm_source !== 'google') throw new Error(`utm_source mismatch: ${attribution.utm_source}`);
    if (attribution.utm_campaign !== 'embroidery_digitizing_us') throw new Error(`utm_campaign mismatch: ${attribution.utm_campaign}`);
    console.log('✅ Test 1 Passed: gclid, gbraid, wbraid, and UTM parameters preserved accurately.\n');

    // =========================================================================
    // Test 2: Funnel Steps Fire ZERO Conversions / Purchases
    // =========================================================================
    console.log('--- Test 2: Verify Funnel Steps NEVER Fire Conversion or Purchase ---');

    // Step 2a: Open Modal
    console.log('  2a. Opening Order Modal...');
    await page.evaluate(() => {
        window.openOrderQuoteModal({ service: 'Digitizing' });
    });
    await page.waitForTimeout(400);

    // Step 2b: Select Service & Fill Details
    console.log('  2b. Selecting Service & entering details...');
    await page.evaluate(() => {
        const modal = document.getElementById('new-order-modal');
        const jobInput = modal.querySelector('#dig-job-name');
        if (jobInput) jobInput.value = 'Apex Athletic Logo';
        const placement = modal.querySelector('#dig-placement');
        if (placement) placement.value = 'Cap / Hat Front — $15';
        const notes = modal.querySelector('#order-notes');
        if (notes) notes.value = 'Keep 3D puff underlay clean and tight on curved seams.';
        const email = modal.querySelector('#order-client-email');
        if (email) email.value = 'coach.davis@apexathletics.com';
        const name = modal.querySelector('#order-client-name');
        if (name) name.value = 'Coach Davis';

        // Trigger input event to test draft auto-saving
        if (jobInput) jobInput.dispatchEvent(new Event('input', { bubbles: true }));
        if (notes) notes.dispatchEvent(new Event('input', { bubbles: true }));
        if (email) email.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Step 2c: Proceed to Step 3 Review & Pay
    console.log('  2c. Proceeding to Step 3 Review & Pay...');
    await page.evaluate(() => {
        window.goToOrderReviewStep();
    });
    await page.waitForTimeout(400);

    // Step 2d: Choose PayPal Payment Method
    console.log('  2d. Clicking PayPal Payment Option...');
    await page.evaluate(() => {
        window.setModalPaymentMethod('PayPal');
    });
    await page.waitForTimeout(300);

    // Verify tracked events so far
    const purchaseGtag = trackedGtagEvents.filter(e => e.eventName === 'purchase' || e.eventName === 'conversion');
    const purchaseDataLayer = trackedDataLayerEvents.filter(e => e.event === 'purchase' || e.event === 'conversion_order_paid');

    console.log(`  Gtag purchase/conversion events fired during funnel: ${purchaseGtag.length}`);
    console.log(`  DataLayer purchase/conversion events fired during funnel: ${purchaseDataLayer.length}`);

    if (purchaseGtag.length > 0 || purchaseDataLayer.length > 0) {
        throw new Error('FAILED: Purchase or conversion event fired prematurely during the funnel!');
    }
    console.log('✅ Test 2 Passed: Modal open, service selection, checkout begin, and payment button clicks fired ZERO conversions.\n');

    // =========================================================================
    // Test 3: Checkout State Preservation Between Steps
    // =========================================================================
    console.log('--- Test 3: Checkout State Preservation Between Steps ---');
    console.log('  Going back from Step 3 -> Step 2...');
    await page.evaluate(() => {
        window.backToOrderDetailsStep();
    });
    await page.waitForTimeout(300);

    let stateValues = await page.evaluate(() => {
        const modal = document.getElementById('new-order-modal');
        return {
            jobName: modal.querySelector('#dig-job-name')?.value,
            placement: modal.querySelector('#dig-placement')?.value,
            notes: modal.querySelector('#order-notes')?.value,
            email: modal.querySelector('#order-client-email')?.value,
            name: modal.querySelector('#order-client-name')?.value
        };
    });
    console.log('State in Step 2 after back navigation:', stateValues);
    if (stateValues.jobName !== 'Apex Athletic Logo') throw new Error('Job name was lost going back to Step 2');
    if (!stateValues.notes.includes('3D puff')) throw new Error('Notes were lost going back to Step 2');
    if (stateValues.email !== 'coach.davis@apexathletics.com') throw new Error('Email was lost going back to Step 2');

    console.log('  Going from Step 2 -> Step 1 (Service Choice)...');
    await page.evaluate(() => {
        window.switchOrderServiceChoice();
    });
    await page.waitForTimeout(300);

    console.log('  Returning from Step 1 -> Step 2 (Digitizing)...');
    await page.evaluate(() => {
        window.selectOrderService('Digitizing');
    });
    await page.waitForTimeout(300);

    stateValues = await page.evaluate(() => {
        const modal = document.getElementById('new-order-modal');
        return {
            jobName: modal.querySelector('#dig-job-name')?.value,
            notes: modal.querySelector('#order-notes')?.value,
            email: modal.querySelector('#order-client-email')?.value
        };
    });
    console.log('State after re-entering Step 2:', stateValues);
    if (stateValues.jobName !== 'Apex Athletic Logo') throw new Error('Job name lost after returning to Step 2');
    if (stateValues.email !== 'coach.davis@apexathletics.com') throw new Error('Email lost after returning to Step 2');

    console.log('✅ Test 3 Passed: State perfectly preserved across Step 1 <-> Step 2 <-> Step 3 transitions.\n');

    // =========================================================================
    // Test 4: Finalize Order, In-Modal Confirmation, and Conversion Tracking
    // =========================================================================
    console.log('--- Test 4: Finalize Order & Purchase Event Tracking ---');
    console.log('  Advancing back to Step 3 Review & Pay...');
    await page.evaluate(() => {
        window.goToOrderReviewStep();
    });
    await page.waitForTimeout(300);

    console.log('  Simulating successful payment and finalizing order...');
    const orderResult = await page.evaluate(async () => {
        return await window.finalizeModalOrder({
            paymentStatus: 'paid',
            paymentMethod: 'PayPal',
            transactionId: 'TXN-TEST-PAYPAL-998811'
        });
    });
    console.log('Finalized Order Record:', JSON.stringify(orderResult, null, 2));

    await page.waitForTimeout(500);

    // Verify in-modal Step 4 view is visible and modal is NOT closed
    const step4Status = await page.evaluate(() => {
        const modal = document.getElementById('new-order-modal');
        const step4View = modal.querySelector('#order-step-4-confirmation-view');
        const orderNum = modal.querySelector('#modal-success-order-num')?.textContent;
        const txnId = modal.querySelector('#modal-success-txn-id')?.textContent;
        const service = modal.querySelector('#modal-success-service')?.textContent;
        const placement = modal.querySelector('#modal-success-placement')?.textContent;
        const email = modal.querySelector('#modal-success-email')?.textContent;
        const amount = modal.querySelector('#modal-success-amount')?.textContent;
        return {
            modalVisible: !modal.classList.contains('hidden'),
            step4Visible: !step4View.classList.contains('hidden'),
            orderNum,
            txnId,
            service,
            placement,
            email,
            amount
        };
    });

    console.log('Modal Step 4 Status:', step4Status);
    if (!step4Status.modalVisible) throw new Error('Modal was unexpectedly closed instead of staying in confirmation state!');
    if (!step4Status.step4Visible) throw new Error('Step 4 confirmation view is not visible!');
    if (!step4Status.orderNum || !step4Status.orderNum.includes('DZ-')) throw new Error(`Invalid order number rendered: ${step4Status.orderNum}`);
    if (!step4Status.txnId.includes('TXN-TEST-PAYPAL-998811')) throw new Error(`Transaction ID not rendered properly: ${step4Status.txnId}`);

    // Verify GA4 and Google Ads purchase events
    const allPurchasesGtag = trackedGtagEvents.filter(e => e.eventName === 'purchase');
    const allConversionsGtag = trackedGtagEvents.filter(e => e.eventName === 'conversion');
    const allPurchasesDL = trackedDataLayerEvents.filter(e => e.event === 'purchase');

    console.log('\nTracking Events Summary:');
    console.log(`- gtag purchase events: ${allPurchasesGtag.length}`);
    console.log(`- gtag conversion events: ${allConversionsGtag.length}`);
    console.log(`- dataLayer purchase events: ${allPurchasesDL.length}`);

    if (allPurchasesGtag.length !== 1) throw new Error(`Expected exactly 1 gtag purchase event, got ${allPurchasesGtag.length}`);
    if (allConversionsGtag.length !== 1) throw new Error(`Expected exactly 1 gtag conversion event, got ${allConversionsGtag.length}`);
    if (allPurchasesDL.length !== 1) throw new Error(`Expected exactly 1 dataLayer purchase event, got ${allPurchasesDL.length}`);

    const purchasePayload = allPurchasesGtag[0].params;
    console.log('\nCaptured GA4 purchase payload:');
    console.log(JSON.stringify(purchasePayload, null, 2));

    if (!purchasePayload.transaction_id) throw new Error('purchase event missing transaction_id');
    if (!purchasePayload.value || purchasePayload.value < 10) throw new Error(`purchase event invalid value: ${purchasePayload.value}`);
    if (purchasePayload.currency !== 'USD') throw new Error(`purchase event currency mismatch: ${purchasePayload.currency}`);
    if (!purchasePayload.service_type) throw new Error('purchase event missing service_type');
    if (!purchasePayload.placement) throw new Error('purchase event missing placement');
    if (!purchasePayload.rush_status) throw new Error('purchase event missing rush_status');
    if (!purchasePayload.items || purchasePayload.items.length === 0) throw new Error('purchase event missing items array');
    if (purchasePayload.gclid !== 'EAIaIQobChMI_test_gclid_12345') throw new Error(`purchase event gclid mismatch: ${purchasePayload.gclid}`);
    if (purchasePayload.gbraid !== 'test_gbraid_999') throw new Error(`purchase event gbraid mismatch: ${purchasePayload.gbraid}`);
    if (purchasePayload.wbraid !== 'test_wbraid_888') throw new Error(`purchase event wbraid mismatch: ${purchasePayload.wbraid}`);

    console.log('✅ Test 4 Passed: Purchase conversion fired exactly once after payment with full required parameters.\n');

    // =========================================================================
    // Test 5: Idempotency & Duplicate Prevention
    // =========================================================================
    console.log('--- Test 5: Duplicate Prevention Safeguard ---');
    console.log('  Attempting duplicate finalizeModalOrder invocation with same transaction ID...');
    const duplicateRes = await page.evaluate(async () => {
        return await window.finalizeModalOrder({
            paymentStatus: 'paid',
            paymentMethod: 'PayPal',
            transactionId: 'TXN-TEST-PAYPAL-998811'
        });
    });

    const purchasesAfterDup = trackedGtagEvents.filter(e => e.eventName === 'purchase');
    console.log(`Duplicate call result: ${duplicateRes}`);
    console.log(`Purchase events after duplicate attempt: ${purchasesAfterDup.length}`);
    if (purchasesAfterDup.length !== 1) {
        throw new Error('FAILED: Duplicate finalizeModalOrder fired a second purchase event!');
    }
    console.log('✅ Test 5 Passed: Idempotency guard safely blocked duplicate conversion.\n');

    // =========================================================================
    // Test 6: Multi-Viewport Visual Verification & WebP Screenshots
    // =========================================================================
    console.log('--- Test 6: Capturing Multi-Viewport Screenshots ---');
    const screenshotsDir = path.join(__dirname, '..', 'artifacts');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

    // Desktop Screenshot
    const desktopPng = path.join(screenshotsDir, 'modal_step4_desktop.png');
    const desktopWebp = path.join(screenshotsDir, 'modal_step4_desktop.webp');
    await page.screenshot({ path: desktopPng });
    execSync(`python3 -c "from PIL import Image; im=Image.open('${desktopPng}'); im.save('${desktopWebp}', 'WEBP', quality=90)"`);
    console.log(`  Saved Desktop WebP screenshot: ${desktopWebp}`);

    // Mobile Screenshot (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);
    const mobilePng = path.join(screenshotsDir, 'modal_step4_mobile.png');
    const mobileWebp = path.join(screenshotsDir, 'modal_step4_mobile.webp');
    await page.screenshot({ path: mobilePng });
    execSync(`python3 -c "from PIL import Image; im=Image.open('${mobilePng}'); im.save('${mobileWebp}', 'WEBP', quality=90)"`);
    console.log(`  Saved Mobile WebP screenshot: ${mobileWebp}`);

    // Clean up temporary PNGs
    if (fs.existsSync(desktopPng)) fs.unlinkSync(desktopPng);
    if (fs.existsSync(mobilePng)) fs.unlinkSync(mobilePng);

    console.log('✅ Test 6 Passed: Multi-viewport WebP screenshots captured successfully.\n');

    await browser.close();
    console.log('🎉 ALL TESTS PASSED! Checkout & Tracking verification is 100% complete.');
})().catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
