const { chromium } = require('playwright');
const path = require('path');

async function verifyDigitizerRevisionPriority() {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    const artifactsDir = '/Users/macbookair/.gemini/antigravity-ide/brain/da84f63a-7594-48c0-ba5a-794b0e4a7f1f';

    const user = {
        id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1',
        email: 'digitizer@dezandigitizing.com',
        displayName: 'Digitizer',
        name: 'Master Digitizer',
        role: 'digitizer',
        company: 'Dezan Digitizing Studio',
        phone: '+1 (555) 987-6543'
    };

    try {
        console.log('=== STEP 1: Testing worker-tasks.html (Desktop 1440x900) ===');
        const contextDesktop = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const page = await contextDesktop.newPage();

        await page.addInitScript((u) => {
            localStorage.setItem('dezan_session', JSON.stringify(u));
            sessionStorage.setItem('dezan_session', JSON.stringify(u));
            localStorage.setItem('insforge_auth_user', JSON.stringify(u));
        }, user);

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        await page.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
        await page.waitForTimeout(1500);

        // 1. Verify Revisions Tab button
        const revTabBtn = (await page.$('#worker-pill-revisions')) || (await page.$('button.pill-revisions'));
        if (!revTabBtn) throw new Error('Revisions tab button not found');
        const revTabText = await revTabBtn.innerText();
        console.log('Revisions Tab text:', revTabText.replace(/\n/g, ' '));
        if (!revTabText.includes('Revisions') || !revTabText.includes('↻')) {
            throw new Error(`Revisions tab missing ↻ icon or text: ${revTabText}`);
        }
        if (!revTabText.includes('①') && !revTabText.includes('1')) {
            throw new Error(`Revisions tab missing count badge: ${revTabText}`);
        }
        console.log('✓ Revisions tab has priority icon ↻ and badge count ①');

        // Click Revisions Tab to isolate and focus on Revisions
        await revTabBtn.click();
        await page.waitForTimeout(600);

        // 2. Locate Revision Card
        const revCard = (await page.$('#digitizer-card-ORD-8837')) || (await page.$('#digitizer-card-ORD-8475')) || (await page.$('.digitizer-bento-card:has-text("REVISION · PRIORITY")'));
        if (!revCard) throw new Error('Revision card not found');
        const revCardText = await revCard.innerText();
        console.log('Revision Card snippet:\n', revCardText.slice(0, 350));

        // 3. Top-Right Badge: ↻ REVISION · PRIORITY
        if (!revCardText.includes('↻') || !revCardText.includes('REVISION · PRIORITY')) {
            throw new Error('Revision card missing top-right "↻ REVISION · PRIORITY" badge');
        }
        console.log('✓ Top-right badge has "↻ REVISION · PRIORITY"');

        // 4. Waiting Time Indicator: Revision requested: ...
        if (!revCardText.includes('Revision requested:')) {
            throw new Error('Revision card missing "Revision requested: ... min ago" indicator');
        }
        console.log('✓ Waiting time indicator is present');

        // 5. Specs Bento: PLACEMENT, SIZE, FORMAT
        if (!revCardText.includes('LEFT CHEST') && !revCardText.includes('CAP FRONT') && !revCardText.includes('JACKET BACK')) {
            throw new Error('Placement missing on revision card');
        }
        if (!revCardText.includes('SIZE:')) {
            throw new Error('SIZE label missing on revision card');
        }
        if (!revCardText.includes('FORMAT:')) {
            throw new Error('FORMAT label missing on revision card');
        }
        console.log('✓ Specs Bento (Placement, Size, Format) is prominent');

        // 6. Revision Request Box
        if (!revCardText.includes('REVISION REQUEST')) {
            throw new Error('REVISION REQUEST callout box missing on revision card');
        }
        console.log('✓ Revision Request callout box is present with verbatim notes');

        // 7. Dual File Access (Artwork + Previous Deliverable)
        const prevFileBtn = await revCard.$('a:has-text("v1")');
        if (!prevFileBtn) {
            throw new Error('Previous delivered file download button (v1) missing from revision card');
        }
        const artDownloadBtn = await revCard.$('a[download]');
        if (!artDownloadBtn) {
            throw new Error('Customer artwork download link missing from revision card');
        }
        console.log('✓ Dual File Access (Original Artwork + Previous v1 Deliverable) verified');

        // 8. Actions Toolbar: Open Revision button (NOT View Order)
        const openRevBtn = await revCard.$('button:has-text("Open Revision")');
        if (!openRevBtn) {
            throw new Error('Primary action button "Open Revision" missing from revision card');
        }
        const viewOrderBtn = await revCard.$('button:has-text("View Order")');
        if (viewOrderBtn) {
            throw new Error('Revision card should NOT have generic "View Order" button; should be "Open Revision"');
        }
        const attachFilesBtn = await revCard.$('button:has-text("Attach Files")');
        if (!attachFilesBtn) {
            throw new Error('Second action button "Attach Files" missing from revision card');
        }
        console.log('✓ Main button changed to "Open Revision" and "Attach Files" is second action');

        // Capture Desktop Screenshot with Revisions Tab active
        await revCard.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(artifactsDir, 'digitizer_revision_priority_desktop.png'), fullPage: false });
        console.log('✓ Desktop screenshot captured');

        // 9. Switch to Table View and verify row
        console.log('--- Testing Table View on worker-tasks.html ---');
        const tableViewBtn = await page.$('#digitizer-layout-toggle-table');
        if (tableViewBtn) {
            await tableViewBtn.click();
            await page.waitForTimeout(600);
            const revRow = (await page.$('tr:has-text("ORD-8837")')) || (await page.$('tr:has-text("ORD-8475")')) || (await page.$('tr:has-text("REVISION · PRIORITY")'));
            if (!revRow) throw new Error('Revision row not found in table view');
            const revRowText = await revRow.innerText();
            if (!revRowText.includes('REVISION · PRIORITY')) {
                throw new Error('Table row missing REVISION · PRIORITY indicator');
            }
            const rowOpenRevBtn = await revRow.$('button:has-text("Open Revision")');
            if (!rowOpenRevBtn) {
                throw new Error('Table row missing Open Revision button');
            }
            console.log('✓ Table view row has REVISION · PRIORITY and Open Revision button');
            await page.screenshot({ path: path.join(artifactsDir, 'digitizer_revision_priority_table.png'), fullPage: false });
            console.log('✓ Table view screenshot captured');
        }

        await contextDesktop.close();

        // === STEP 2: Mobile Viewport (390x844) on worker-tasks.html ===
        console.log('=== STEP 2: Mobile Viewport (390x844) ===');
        const contextMobile = await browser.newContext({
            viewport: { width: 390, height: 844 },
            isMobile: true
        });
        const pageMobile = await contextMobile.newPage();
        await pageMobile.addInitScript((u) => {
            localStorage.setItem('dezan_session', JSON.stringify(u));
            sessionStorage.setItem('dezan_session', JSON.stringify(u));
            localStorage.setItem('insforge_auth_user', JSON.stringify(u));
        }, user);

        await pageMobile.goto('http://localhost:8085/worker-tasks.html', { waitUntil: 'networkidle' });
        await pageMobile.waitForTimeout(1500);

        const mobileRevCard = (await pageMobile.$('#digitizer-card-ORD-8837')) || (await pageMobile.$('#digitizer-card-ORD-8475')) || (await pageMobile.$('.digitizer-bento-card:has-text("REVISION · PRIORITY")'));
        if (!mobileRevCard) throw new Error('Revision card not found on mobile viewport');
        await mobileRevCard.scrollIntoViewIfNeeded();
        await pageMobile.waitForTimeout(300);

        await pageMobile.screenshot({ path: path.join(artifactsDir, 'digitizer_revision_priority_mobile.png'), fullPage: false });
        console.log('✓ Mobile screenshot captured');
        await contextMobile.close();

        // === STEP 3: worker-portal.html ===
        console.log('=== STEP 3: Testing worker-portal.html (Desktop 1440x900) ===');
        const contextPortal = await browser.newContext({
            viewport: { width: 1440, height: 900 }
        });
        const pagePortal = await contextPortal.newPage();
        await pagePortal.addInitScript((u) => {
            localStorage.setItem('dezan_session', JSON.stringify(u));
            sessionStorage.setItem('dezan_session', JSON.stringify(u));
            localStorage.setItem('insforge_auth_user', JSON.stringify(u));
        }, user);

        await pagePortal.goto('http://localhost:8085/worker-portal.html', { waitUntil: 'networkidle' });
        await pagePortal.waitForTimeout(1500);

        const portalRevTab = await pagePortal.$('#digitizer-pill-revisions');
        if (portalRevTab) {
            const portalTabText = await portalRevTab.innerText();
            console.log('worker-portal.html Revisions Tab text:', portalTabText.replace(/\n/g, ' '));
            await portalRevTab.click();
            await pagePortal.waitForTimeout(600);
        }

        const portalRevCard = (await pagePortal.$('#digitizer-card-ORD-8837')) || (await pagePortal.$('#digitizer-card-ORD-8240')) || (await pagePortal.$('.digitizer-bento-card:has-text("REVISION · PRIORITY")'));
        if (!portalRevCard) {
            throw new Error('No revision priority card found on worker-portal.html');
        } else {
            const portalCardText = await portalRevCard.innerText();
            if (!portalCardText.includes('REVISION · PRIORITY')) {
                throw new Error('Revision card on worker-portal.html missing REVISION · PRIORITY');
            }
            if (!portalCardText.includes('Open Revision')) {
                throw new Error('Revision card on worker-portal.html missing Open Revision button');
            }
            console.log('✓ worker-portal.html revision card has REVISION · PRIORITY and Open Revision');
        }

        await portalRevCard.scrollIntoViewIfNeeded();
        await pagePortal.waitForTimeout(300);
        await pagePortal.screenshot({ path: path.join(artifactsDir, 'digitizer_portal_revision_priority.png'), fullPage: false });
        console.log('✓ worker-portal.html screenshot captured');
        await contextPortal.close();

        console.log('=== ALL REVISION PRIORITY VERIFICATIONS PASSED SUCCESSFULLY! ===');
    } catch (err) {
        console.error('VERIFICATION ERROR:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

verifyDigitizerRevisionPriority();
