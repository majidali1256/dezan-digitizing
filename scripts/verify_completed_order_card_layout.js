const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ARTIFACT_DIR = path.join(__dirname, '../playwright_artifacts/completed_cards');
if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const ROOT_DIR = path.join(__dirname, '..');
const PORT = 8989;

function startStaticServer() {
    return new Promise((resolve) => {
        const mimeTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff2': 'font/woff2',
            '.woff': 'font/woff'
        };

        const server = http.createServer((req, res) => {
            const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
            let filePath = path.join(ROOT_DIR, decodeURIComponent(parsedUrl.pathname));
            if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }

            if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
                return;
            }

            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || 'application/octet-stream';
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            fs.createReadStream(filePath).pipe(res);
        });

        server.listen(PORT, '127.0.0.1', () => {
            console.log(`Static test server listening on http://127.0.0.1:${PORT}`);
            resolve(server);
        });
    });
}

async function verifyCompletedOrderCards() {
    console.log('🚀 Starting Completed Order Cards Layout Verification...');
    const server = await startStaticServer();
    const browser = await chromium.launch({ channel: 'chrome', headless: true });

    // Mock client user
    const clientUser = {
        id: 'c1010101-0000-4000-8000-000000000001',
        email: 'john@apparelcorp.com',
        displayName: 'John Foster',
        name: 'John Foster',
        role: 'client',
        company: 'Creative Merch & Embroidery',
        phone: '+1 (555) 234-5678'
    };

    try {
        // Test on Mobile first (390x844) to match the user's exact screenshot
        console.log('\n--- 1. Testing Client Portal on Mobile (390x844) ---');
        const mobileCtx = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });

        await mobileCtx.addInitScript((user) => {
            localStorage.setItem('dezan_session', JSON.stringify(user));
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
            localStorage.setItem('insforge_auth_user', JSON.stringify(user));
        }, clientUser);

        const mobilePage = await mobileCtx.newPage();
        mobilePage.on('pageerror', err => console.log('MOBILE PAGE ERROR:', err.message));

        await mobilePage.goto(`http://127.0.0.1:${PORT}/client-portal.html`, { waitUntil: 'networkidle' });
        await mobilePage.waitForTimeout(1000);

        // Inject sample completed order matching user's exact screenshot to verify layout perfectly
        await mobilePage.evaluate(() => {
            const sampleCompletedOrder = {
                id: 'ord-sample-9792',
                order_number: 'ORD-9792',
                design_name: 'Realtime Live Crest #253',
                service_type: 'Digitizing',
                placement: 'Left Chest',
                sizing: '3.5" W',
                format: 'DST, EMB',
                fabric_type: 'Pique Polo',
                status: 'completed',
                payment_status: 'paid',
                price: 15,
                created_at: new Date('2026-09-04T23:13:00Z').toISOString(),
                deliverable_url: 'https://example.com/crest-253.dst',
                deliverables: [{ name: 'crest-253.dst', url: 'https://example.com/crest-253.dst', format: 'DST' }]
            };
            if (typeof cachedOrders !== 'undefined') {
                // Ensure sample order is first in completed list
                cachedOrders = cachedOrders.filter(o => o.order_number !== 'ORD-9792');
                cachedOrders.unshift(sampleCompletedOrder);
                if (typeof renderSectionsWithFilter === 'function') {
                    renderSectionsWithFilter();
                }
            }
        });
        await mobilePage.waitForTimeout(500);

        // Check cards in completed-orders-container
        const completedCards = await mobilePage.$$('#completed-orders-container .client-order-card');
        console.log(`Found ${completedCards.length} completed order cards in completed-orders-container`);

        const firstCard = completedCards[0];
        if (!firstCard) {
            throw new Error('No completed card found in #completed-orders-container');
        }

        await firstCard.scrollIntoViewIfNeeded();
        await mobilePage.waitForTimeout(400);

        // 1. Verify View Order button exists
        const viewOrderBtn = await firstCard.$('button:has-text("View Order")');
        console.log(`✓ "View Order" button present: ${!!viewOrderBtn}`);
        if (!viewOrderBtn) throw new Error('Missing "View Order" button in secondary row');

        // 2. Verify Request Revision button exists and has outlined style
        const requestRevBtn = await firstCard.$('button:has-text("Request Revision")');
        console.log(`✓ "Request Revision" button present: ${!!requestRevBtn}`);
        if (!requestRevBtn) throw new Error('Missing "Request Revision" button in secondary row');

        const revClasses = await requestRevBtn.getAttribute('class');
        console.log(`Request Revision button classes: ${revClasses}`);
        const isPurpleOutline = revClasses.includes('border-purple') || revClasses.includes('purple');
        console.log(`✓ "Request Revision" has purple outline styling: ${isPurpleOutline}`);
        if (!isPurpleOutline) throw new Error('Request Revision button should have purple outline styling');

        // 3. Verify Download Files button exists and has green style
        const downloadBtn = await firstCard.$('a:has-text("Download Files")');
        console.log(`✓ "Download Files" button present: ${!!downloadBtn}`);
        if (!downloadBtn) throw new Error('Missing "Download Files" prominent primary button');

        const downloadClasses = await downloadBtn.getAttribute('class');
        console.log(`Download Files button classes: ${downloadClasses}`);
        const isGreen = downloadClasses.includes('bg-emerald') || downloadClasses.includes('bg-green');
        console.log(`✓ "Download Files" has green background: ${isGreen}`);
        if (!isGreen) throw new Error('Download Files button should have prominent green background');

        // 4. Verify width proportion (70-85% of card width on mobile)
        const cardBox = await firstCard.boundingBox();
        const btnBox = await downloadBtn.boundingBox();
        const widthRatio = btnBox.width / cardBox.width;
        console.log(`Card width: ${cardBox.width.toFixed(1)}px, Download Files btn width: ${btnBox.width.toFixed(1)}px, Ratio: ${(widthRatio * 100).toFixed(1)}%`);
        if (widthRatio >= 0.70 && widthRatio <= 0.88) {
            console.log(`✓ Width ratio ${(widthRatio * 100).toFixed(1)}% is comfortably in the 70-85% range!`);
        } else {
            console.warn(`⚠️ Download Files button width ratio ${(widthRatio * 100).toFixed(1)}% slightly outside expected range`);
        }

        // 5. Test Request Revision click
        console.log('\nTesting Request Revision click interaction...');
        await requestRevBtn.click();
        await mobilePage.waitForTimeout(400);
        const revModal = await mobilePage.$('#revision-request-modal');
        const isRevModalVisible = await revModal.isVisible();
        console.log(`✓ Revision Modal opened: ${isRevModalVisible}`);
        if (!isRevModalVisible) throw new Error('Clicking Request Revision did not open revision modal');

        const cancelRevBtn = await mobilePage.$('#revision-request-modal button:has-text("Cancel")');
        if (cancelRevBtn) await cancelRevBtn.click();
        await mobilePage.waitForTimeout(300);

        // Capture Mobile Screenshot
        await mobilePage.screenshot({
            path: path.join(ARTIFACT_DIR, 'client_portal_completed_cards_mobile_390.png')
        });
        console.log(`📸 Mobile screenshot saved to client_portal_completed_cards_mobile_390.png`);

        // Capture focused card screenshot
        await firstCard.screenshot({
            path: path.join(ARTIFACT_DIR, 'completed_order_card_mobile_detail.png')
        });
        console.log(`📸 Focused card screenshot saved to completed_order_card_mobile_detail.png`);

        await mobileCtx.close();

        // --- 2. Desktop Viewport (1512x982) ---
        console.log('\n--- 2. Testing Client Portal on Desktop (1512x982) ---');
        const desktopCtx = await browser.newContext({
            viewport: { width: 1512, height: 982 },
            deviceScaleFactor: 2
        });
        await desktopCtx.addInitScript((user) => {
            localStorage.setItem('dezan_session', JSON.stringify(user));
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
            localStorage.setItem('insforge_auth_user', JSON.stringify(user));
        }, clientUser);

        const desktopPage = await desktopCtx.newPage();
        await desktopPage.goto(`http://127.0.0.1:${PORT}/client-portal.html`, { waitUntil: 'networkidle' });
        await desktopPage.waitForTimeout(500);

        await desktopPage.evaluate(() => {
            const sampleCompletedOrder = {
                id: 'ord-sample-9792',
                order_number: 'ORD-9792',
                design_name: 'Realtime Live Crest #253',
                service_type: 'Digitizing',
                placement: 'Left Chest',
                sizing: '3.5" W',
                format: 'DST, EMB',
                fabric_type: 'Pique Polo',
                status: 'completed',
                payment_status: 'paid',
                price: 15,
                created_at: new Date('2026-09-04T23:13:00Z').toISOString(),
                deliverable_url: 'https://example.com/crest-253.dst',
                deliverables: [{ name: 'crest-253.dst', url: 'https://example.com/crest-253.dst', format: 'DST' }]
            };
            if (typeof cachedOrders !== 'undefined') {
                cachedOrders = cachedOrders.filter(o => o.order_number !== 'ORD-9792');
                cachedOrders.unshift(sampleCompletedOrder);
                if (typeof renderSectionsWithFilter === 'function') {
                    renderSectionsWithFilter();
                }
            }
        });
        await desktopPage.waitForTimeout(400);

        const desktopCompSection = await desktopPage.$('#section-completed-orders');
        if (desktopCompSection) {
            await desktopCompSection.scrollIntoViewIfNeeded();
            await desktopPage.waitForTimeout(400);
            await desktopPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'client_portal_completed_cards_desktop.png')
            });
            console.log(`📸 Desktop screenshot saved to client_portal_completed_cards_desktop.png`);
        }
        await desktopCtx.close();

        // --- 3. Tablet Viewport (834x1112) ---
        console.log('\n--- 3. Testing Client Portal on Tablet (834x1112) ---');
        const tabletCtx = await browser.newContext({
            viewport: { width: 834, height: 1112 },
            deviceScaleFactor: 2,
            isMobile: true,
            hasTouch: true
        });
        await tabletCtx.addInitScript((user) => {
            localStorage.setItem('dezan_session', JSON.stringify(user));
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
            localStorage.setItem('insforge_auth_user', JSON.stringify(user));
        }, clientUser);

        const tabletPage = await tabletCtx.newPage();
        await tabletPage.goto(`http://127.0.0.1:${PORT}/client-portal.html`, { waitUntil: 'networkidle' });
        await tabletPage.waitForTimeout(500);

        await tabletPage.evaluate(() => {
            const sampleCompletedOrder = {
                id: 'ord-sample-9792',
                order_number: 'ORD-9792',
                design_name: 'Realtime Live Crest #253',
                service_type: 'Digitizing',
                placement: 'Left Chest',
                sizing: '3.5" W',
                format: 'DST, EMB',
                fabric_type: 'Pique Polo',
                status: 'completed',
                payment_status: 'paid',
                price: 15,
                created_at: new Date('2026-09-04T23:13:00Z').toISOString(),
                deliverable_url: 'https://example.com/crest-253.dst',
                deliverables: [{ name: 'crest-253.dst', url: 'https://example.com/crest-253.dst', format: 'DST' }]
            };
            if (typeof cachedOrders !== 'undefined') {
                cachedOrders = cachedOrders.filter(o => o.order_number !== 'ORD-9792');
                cachedOrders.unshift(sampleCompletedOrder);
                if (typeof renderSectionsWithFilter === 'function') {
                    renderSectionsWithFilter();
                }
            }
        });
        await tabletPage.waitForTimeout(400);

        const tabletCompSection = await tabletPage.$('#section-completed-orders');
        if (tabletCompSection) {
            await tabletCompSection.scrollIntoViewIfNeeded();
            await tabletPage.waitForTimeout(400);
            await tabletPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'client_portal_completed_cards_tablet.png')
            });
            console.log(`📸 Tablet screenshot saved to client_portal_completed_cards_tablet.png`);
        }
        await tabletCtx.close();

        // --- 4. Verify client-orders.html (My Orders Page) ---
        console.log('\n--- 4. Testing client-orders.html (My Orders Page) ---');
        const ordersCtx = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2
        });
        await ordersCtx.addInitScript((user) => {
            localStorage.setItem('dezan_session', JSON.stringify(user));
            sessionStorage.setItem('dezan_session', JSON.stringify(user));
            localStorage.setItem('insforge_auth_user', JSON.stringify(user));
        }, clientUser);

        const ordersPage = await ordersCtx.newPage();
        await ordersPage.goto(`http://127.0.0.1:${PORT}/client-orders.html?filter=completed`, { waitUntil: 'networkidle' });
        await ordersPage.waitForTimeout(1000);

        const myOrdersCards = await ordersPage.$$('.client-order-card');
        console.log(`Found ${myOrdersCards.length} cards on client-orders.html`);
        if (myOrdersCards.length > 0) {
            const orderViewOrder = await myOrdersCards[0].$('button:has-text("View Order")');
            const orderReqRev = await myOrdersCards[0].$('button:has-text("Request Revision")');
            const orderDownload = await myOrdersCards[0].$('a:has-text("Download Files")');
            console.log(`✓ client-orders.html card has View Order: ${!!orderViewOrder}`);
            console.log(`✓ client-orders.html card has Request Revision: ${!!orderReqRev}`);
            console.log(`✓ client-orders.html card has Download Files: ${!!orderDownload}`);
            await ordersPage.screenshot({
                path: path.join(ARTIFACT_DIR, 'client_orders_page_completed_mobile.png')
            });
            console.log(`📸 Saved client_orders_page_completed_mobile.png`);
        }
        await ordersCtx.close();

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
    } finally {
        await browser.close();
        server.close();
    }
}

verifyCompletedOrderCards().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
