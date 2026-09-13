const { chromium } = require('playwright');
const emailService = require('../server/services/emailService');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function run() {
    console.log('--- Step 1: Verify Email Service Functions ---');

    // 1. Verify sendAccountInviteEmail
    const inviteRes = await emailService.sendAccountInviteEmail({
        email: 'test.invite@example.com',
        customerName: 'Alice Artisan',
        orderNumber: 'ORD-77492'
    });
    console.log('sendAccountInviteEmail result:', inviteRes);
    if (!inviteRes || !inviteRes.success) throw new Error('sendAccountInviteEmail failed');

    const logs = emailService.getSentEmailsLog();
    const lastEmail = logs[0];
    console.log('Last email logged:', lastEmail);
    if (!lastEmail.to.includes('test.invite@example.com')) throw new Error('Email recipient mismatch');
    if (!lastEmail.subject.includes('ORD-77492')) throw new Error('Subject should include order number');

    // 2. Verify sendOrderConfirmation
    const orderRes = await emailService.sendOrderConfirmation({
        order_number: 'ORD-99120',
        service_type: 'Cap / Hat Embroidery Digitizing',
        design_name: 'Apex Mountain Logo',
        placement: 'Cap / Hat Front',
        target_size: '2.5 in width',
        price: 15.00,
        payment_status: 'Paid',
        customer_name: 'Bob Builder'
    }, 'test.order@example.com');
    console.log('sendOrderConfirmation result:', orderRes);
    if (!orderRes || !orderRes.success) throw new Error('sendOrderConfirmation failed');

    // 3. Verify sendQuoteEstimationAlert
    const quoteRes = await emailService.sendQuoteEstimationAlert({
        quote_number: 'QUO-55201',
        design_name: 'Eagle Shield',
        customer_name: 'Charlie Craft'
    }, 'test.quote@example.com');
    console.log('sendQuoteEstimationAlert result:', quoteRes);
    if (!quoteRes || !quoteRes.success) throw new Error('sendQuoteEstimationAlert failed');

    console.log('--- Step 2: Playwright Verification on order-success.html ---');
    const browser = await chromium.launch({
        headless: true,
        channel: 'chrome'
    });

    const scratchDir = path.resolve(__dirname, '../scratch');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

    // Desktop Context
    const contextDesktop = await browser.newContext({ viewport: { width: 1512, height: 982 } });
    const pageDesktop = await contextDesktop.newPage();
    await pageDesktop.goto('http://localhost:5001/order-success.html?order=ORD-77492&email=test.invite@example.com&amount=15.00&service=Hat%20Digitizing', { waitUntil: 'networkidle' });

    // Verify claim notice email text
    const claimNoticeText = await pageDesktop.locator('#claim-notice-email').textContent();
    console.log('Claim notice email on page:', claimNoticeText);
    if (!claimNoticeText.includes('test.invite@example.com')) {
        throw new Error(`Expected claim notice email to show test.invite@example.com, got: ${claimNoticeText}`);
    }

    // Verify resend email button
    const resendBtn = pageDesktop.locator('#resend-invite-btn');
    await resendBtn.click();
    await pageDesktop.waitForSelector('#resend-invite-feedback:not(.hidden)', { timeout: 10000 });
    const feedbackText = await pageDesktop.locator('#resend-invite-feedback').textContent();
    console.log('Resend feedback:', feedbackText);
    if (!feedbackText.includes('Account creation email sent') && !feedbackText.includes('Account creation link sent') && !feedbackText.includes('sent')) {
        throw new Error(`Unexpected resend feedback: ${feedbackText}`);
    }

    const cardPng = path.join(scratchDir, 'order_success_card.png');
    await pageDesktop.locator('#guest-claim-account-card').screenshot({ path: cardPng });

    console.log('--- Step 3: Playwright Verification on portal-login.html from Order Link ---');
    await pageDesktop.goto('http://localhost:5001/portal-login.html?tab=register&email=test.invite@example.com&order=ORD-77492&name=Alice%20Artisan', { waitUntil: 'networkidle' });
    await pageDesktop.waitForTimeout(500);

    // Verify signup tab is active
    const isSignupVisible = await pageDesktop.locator('#signup-form').isVisible();
    console.log('Is signup form visible:', isSignupVisible);
    if (!isSignupVisible) throw new Error('Signup form should be visible with ?tab=register');

    // Verify prefilled email
    const prefilledEmail = await pageDesktop.locator('#signup-email').inputValue();
    console.log('Prefilled email:', prefilledEmail);
    if (prefilledEmail !== 'test.invite@example.com') throw new Error(`Expected prefilled email to be test.invite@example.com, got: ${prefilledEmail}`);

    // Verify prefilled name
    const prefilledName = await pageDesktop.locator('#signup-name').inputValue();
    console.log('Prefilled name:', prefilledName);
    if (prefilledName !== 'Alice Artisan') throw new Error(`Expected prefilled name to be Alice Artisan, got: ${prefilledName}`);

    // Verify claim banner
    const isClaimNoticeVisible = await pageDesktop.locator('#order-claim-notice').isVisible();
    const claimRefText = await pageDesktop.locator('#order-claim-ref').textContent();
    console.log('Claim notice visible:', isClaimNoticeVisible, 'Ref:', claimRefText);
    if (!isClaimNoticeVisible || claimRefText !== 'ORD-77492') throw new Error('Order claim banner should be visible with ORD-77492');

    const portalDesktopPng = path.join(scratchDir, 'portal_register_desktop.png');
    await pageDesktop.screenshot({ path: portalDesktopPng, fullPage: false });

    console.log('--- Step 4: Playwright Verification on portal-login.html from Quote Link ---');
    await pageDesktop.goto('http://localhost:5001/portal-login.html?tab=register&email=test.quote@example.com&quote=QUO-55201&name=Charlie%20Craft', { waitUntil: 'networkidle' });
    await pageDesktop.waitForTimeout(500);

    const quoteClaimType = await pageDesktop.locator('#order-claim-type').textContent();
    const quoteClaimRef = await pageDesktop.locator('#order-claim-ref').textContent();
    console.log('Quote claim type:', quoteClaimType, 'Ref:', quoteClaimRef);
    if (!quoteClaimType.includes('quote') || quoteClaimRef !== 'QUO-55201') {
        throw new Error(`Quote claim banner not matching: type=${quoteClaimType}, ref=${quoteClaimRef}`);
    }

    // Mobile check
    console.log('--- Step 5: Mobile Viewport (390x844) ---');
    const contextMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const pageMobile = await contextMobile.newPage();
    await pageMobile.goto('http://localhost:5001/portal-login.html?tab=register&email=test.invite@example.com&order=ORD-77492&name=Alice%20Artisan', { waitUntil: 'networkidle' });
    await pageMobile.waitForTimeout(400);

    const portalMobilePng = path.join(scratchDir, 'portal_register_mobile.png');
    await pageMobile.screenshot({ path: portalMobilePng, fullPage: false });

    await browser.close();

    // Universal WebP Image Optimization Standard conversion
    const artifactDir = '/Users/macbookair/.gemini/antigravity-ide/brain/bcf04134-9365-4ca7-bca3-a10662ec0e96';
    const cardWebp = path.join(artifactDir, 'order_success_email_invite_desktop.webp');
    const portalDesktopWebp = path.join(artifactDir, 'portal_register_prefilled_order_desktop.webp');
    const portalMobileWebp = path.join(artifactDir, 'portal_register_prefilled_order_mobile.webp');

    execSync(`python3 -c "
from PIL import Image
im1 = Image.open('${cardPng}')
im1.save('${cardWebp}', 'WEBP', quality=95, method=6)
im2 = Image.open('${portalDesktopPng}')
im2.save('${portalDesktopWebp}', 'WEBP', quality=90, method=6)
im3 = Image.open('${portalMobilePng}')
im3.save('${portalMobileWebp}', 'WEBP', quality=90, method=6)
print('Successfully encoded WebP verification media!')
"`);

    console.log('✅ ALL VERIFICATIONS PASSED WITH FLYING COLORS!');
}

run().catch(err => {
    console.error('Verification failed:', err);
    process.exit(1);
});
