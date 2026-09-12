const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('Google Tag Manager & Conversion Tracking Architecture Tests', async (t) => {

    await t.test('1. tracking-config.js creates expected DEZAN_TRACKING_CONFIG structure', () => {
        const configCode = fs.readFileSync(path.join(__dirname, '../js/tracking-config.js'), 'utf-8');
        const mockWindow = {};
        const fn = new Function('window', 'global', configCode + '; return window.DEZAN_TRACKING_CONFIG;');
        const config = fn(mockWindow, mockWindow);

        assert.ok(config, 'DEZAN_TRACKING_CONFIG must exist');
        assert.ok(config.gtmId, 'gtmId should be defined');
        assert.ok(config.googleAdsId, 'googleAdsId should be defined');
        assert.ok(config.googleAdsPurchaseLabel, 'googleAdsPurchaseLabel should be defined');
        assert.strictEqual(config.currency, 'USD');
    });

    await t.test('2. analytics.js initializes dataLayer and handles purchase conversion event', () => {
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        
        // Setup mock browser window environment
        const mockStorage = {};
        const mockWindow = {
            DEZAN_TRACKING_CONFIG: {
                gtmId: 'GTM-TEST123',
                googleAdsId: 'AW-999999999',
                googleAdsPurchaseLabel: 'TEST_PURCHASE_LABEL',
                googleAdsLeadLabel: 'TEST_LEAD_LABEL',
                currency: 'USD',
                debug: false
            },
            location: {
                pathname: '/order-success.html',
                search: '?orderId=DZ-4581&amount=25.00&plan=Jacket%20Back&service=Embroidery%20Digitizing&email=customer@example.com&gclid=Cj0KCQ_TEST_CLICK_ID'
            },
            addEventListener: () => {},
            localStorage: {
                getItem: (k) => mockStorage[k] || null,
                setItem: (k, v) => { mockStorage[k] = v; }
            },
            sessionStorage: {
                getItem: (k) => mockStorage[k] || null,
                setItem: (k, v) => { mockStorage[k] = v; }
            }
        };

        const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
        const tracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);

        assert.ok(tracker, 'dezanTracker should be initialized');
        assert.ok(Array.isArray(mockWindow.dataLayer), 'window.dataLayer must be an array');

        // Check attribution capture
        const attribution = tracker.getAttribution();
        assert.strictEqual(attribution.gclid, 'Cj0KCQ_TEST_CLICK_ID', 'gclid must be captured');

        // Test purchase conversion firing
        const fired = tracker.trackOrderPurchase({
            orderId: 'DZ-4581',
            txnId: 'TXN-777888',
            amount: 25.00,
            plan: 'Jacket Back',
            service: 'Embroidery Digitizing',
            email: 'customer@example.com'
        });

        assert.strictEqual(fired, true, 'First purchase track call should return true');

        // Find the 'purchase' event in dataLayer
        const purchaseEvent = mockWindow.dataLayer.find(item => item && item.event === 'purchase');
        assert.ok(purchaseEvent, 'A purchase event must be present in dataLayer');
        assert.strictEqual(purchaseEvent.ecommerce.transaction_id, 'DZ-4581');
        assert.strictEqual(purchaseEvent.ecommerce.value, 25.00);
        assert.strictEqual(purchaseEvent.ecommerce.currency, 'USD');
        assert.strictEqual(purchaseEvent.ecommerce.items[0].item_name, 'Jacket Back');
        assert.strictEqual(purchaseEvent.user_data.email, 'customer@example.com');
        assert.strictEqual(purchaseEvent.ad_attribution.gclid, 'Cj0KCQ_TEST_CLICK_ID');

        // Check deduplication: A second purchase tracking call with same orderId MUST be prevented
        const duplicateFired = tracker.trackOrderPurchase({
            orderId: 'DZ-4581',
            amount: 25.00
        });

        assert.strictEqual(duplicateFired, false, 'Duplicate conversion call on same orderId must be rejected');
    });

    await t.test('3. analytics.js handles quote lead separately from purchase ($0 lead safety)', () => {
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        
        const mockStorage = {};
        const mockWindow = {
            DEZAN_TRACKING_CONFIG: {
                gtmId: 'GTM-TEST123',
                googleAdsId: 'AW-999999999',
                googleAdsPurchaseLabel: 'PURCHASE_LABEL',
                googleAdsLeadLabel: 'LEAD_LABEL',
                currency: 'USD',
                debug: false
            },
            location: {
                pathname: '/order-success.html',
                search: '?orderId=QUO-9912&quote=true&amount=0.00&email=quote@example.com'
            },
            addEventListener: () => {},
            localStorage: {
                getItem: (k) => mockStorage[k] || null,
                setItem: (k, v) => { mockStorage[k] = v; }
            },
            sessionStorage: {
                getItem: (k) => mockStorage[k] || null,
                setItem: (k, v) => { mockStorage[k] = v; }
            }
        };

        const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
        const tracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);

        tracker.trackQuoteLead({
            quoteId: 'QUO-9912',
            email: 'quote@example.com',
            service: 'Vector Art'
        });

        const purchaseEvents = mockWindow.dataLayer.filter(item => item && item.event === 'purchase');
        assert.strictEqual(purchaseEvents.length, 0, 'No purchase event should be generated for a quote request');

        const leadEvent = mockWindow.dataLayer.find(item => item && item.event === 'generate_lead');
        assert.ok(leadEvent, 'A generate_lead event must be pushed for quote requests');
        assert.strictEqual(leadEvent.quote_id, 'QUO-9912');
        assert.strictEqual(leadEvent.service, 'Vector Art');
    });

    await t.test('4. GTM container tags exist in order-success.html and marketing pages', () => {
        const pagesToCheck = [
            'order-success.html',
            'index.html',
            'pricing.html',
            'services.html',
            'contact.html',
            'portfolio.html',
            'about.html',
            'embroidery-digitizing/index.html',
            'vector-art-conversion/index.html'
        ];

        for (const page of pagesToCheck) {
            const content = fs.readFileSync(path.join(__dirname, '..', page), 'utf-8');
            assert.ok(
                content.includes('googletagmanager.com/gtm.js?id='),
                `${page} must contain the Google Tag Manager script in <head>`
            );
            assert.ok(
                content.includes('googletagmanager.com/ns.html?id='),
                `${page} must contain the Google Tag Manager noscript iframe in <body>`
            );
        }
    });

    await t.test('5. GA4 Funnel: All 10 required events exist and dispatch correct payloads', () => {
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        const mockStorage = {};
        const mockWindow = {
            DEZAN_TRACKING_CONFIG: { gtmId: 'GTM-TEST', currency: 'USD' },
            location: { pathname: '/pricing.html', search: '' },
            addEventListener: () => {},
            localStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } },
            sessionStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } }
        };

        const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
        const tracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);

        // 1. service page view
        tracker.trackServicePageView({ name: 'Cap Digitizing', category: 'Caps', price: 15.00 });
        // 2. order started
        tracker.trackOrderStarted({ source: 'hero_cta', placement: 'Left Chest' });
        // 3. service selected
        tracker.trackServiceSelected('Jacket Back Digitizing', { category: 'Jackets', price: 30.00 });
        // 4. artwork uploaded
        tracker.trackArtworkUploaded({ name: 'company_logo.png', size: 1048576, format: 'PNG' });
        // 5. begin checkout
        tracker.trackBeginCheckout({ service: 'Embroidery Digitizing', plan: 'Left Chest', amount: 20.00 });
        // 6. add payment info
        tracker.trackAddPaymentInfo('PayPal', { plan: 'Left Chest', amount: 20.00 });
        // 7. purchase
        tracker.trackOrderPurchase({ orderId: 'DZ-TEST-100', amount: 20.00, plan: 'Left Chest', service: 'Embroidery Digitizing', email: 'test@example.com', placement: 'Left Chest', turnaround: 'rush' });
        // 8. quote submitted
        tracker.trackQuoteLead({ quoteId: 'QUO-TEST-200', service: 'Vector Art', project: 'Logo Cleanup', email: 'quote@example.com' });
        // 9. revision requested
        tracker.trackRevisionRequested({ orderId: 'DZ-TEST-100', reason: 'Density adjustment' });
        // 10. files downloaded
        tracker.trackFilesDownloaded({ orderId: 'DZ-TEST-100', fileName: 'DZ-TEST-100.DST', format: 'DST' });

        const events = mockWindow.dataLayer.map(item => item && item.event).filter(Boolean);
        const requiredEvents = [
            'view_item',
            'order_started',
            'service_selected',
            'artwork_uploaded',
            'begin_checkout',
            'add_payment_info',
            'purchase',
            'generate_lead',
            'revision_requested',
            'files_downloaded'
        ];

        for (const req of requiredEvents) {
            assert.ok(events.includes(req), `dataLayer must contain event: ${req}`);
        }

        const purchaseItem = mockWindow.dataLayer.find(item => item && item.event === 'purchase');
        assert.strictEqual(purchaseItem.ecommerce.transaction_id, 'DZ-TEST-100');
        assert.strictEqual(purchaseItem.ecommerce.value, 20.00);
        assert.strictEqual(purchaseItem.ecommerce.currency, 'USD');
        assert.strictEqual(purchaseItem.placement, 'Left Chest');
        assert.strictEqual(purchaseItem.rush_or_standard, 'rush');
    });

    await t.test('6. Google Ads Auto-Tagging: Preserves gclid, gbraid, wbraid, and UTMs across navigation', () => {
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        const mockStorage = {};
        const mockWindow = {
            DEZAN_TRACKING_CONFIG: { gtmId: 'GTM-TEST', currency: 'USD' },
            location: {
                pathname: '/embroidery-digitizing/',
                search: '?gclid=Cj0KCQ_AUTO_TAG_123&utm_source=google_ads&utm_medium=cpc&utm_campaign=summer_promo&utm_content=banner_a&utm_term=hat+digitizing'
            },
            addEventListener: () => {},
            localStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } },
            sessionStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } }
        };

        const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
        const tracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);

        const attr = tracker.getAttribution();
        assert.strictEqual(attr.gclid, 'Cj0KCQ_AUTO_TAG_123');
        assert.strictEqual(attr.utm_source, 'google_ads');
        assert.strictEqual(attr.utm_medium, 'cpc');
        assert.strictEqual(attr.utm_campaign, 'summer_promo');
        assert.strictEqual(attr.utm_content, 'banner_a');
        assert.strictEqual(attr.utm_term, 'hat digitizing');
        assert.strictEqual(attr.original_source, 'google_ads');

        // Verify saved to local storage
        assert.ok(mockStorage['dezan_first_touch_attribution'], 'first touch must be saved to localStorage');
        assert.ok(mockStorage['dezan_last_touch_attribution'], 'last touch must be saved to localStorage');

        // Now simulate user navigating to order-success without query params
        mockWindow.location.search = '';
        const secondTracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);
        const preservedAttr = secondTracker.getAttribution();

        assert.strictEqual(preservedAttr.gclid, 'Cj0KCQ_AUTO_TAG_123', 'gclid must be preserved without query params');
        assert.strictEqual(preservedAttr.utm_campaign, 'summer_promo', 'utm_campaign must be preserved');
    });

    await t.test('7. Enhanced Conversions: SHA-256 hashed customer email matches cryptographic standard', () => {
        const crypto = require('crypto');
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        const mockStorage = {};
        const mockWindow = {
            DEZAN_TRACKING_CONFIG: { gtmId: 'GTM-TEST', currency: 'USD' },
            location: { pathname: '/', search: '' },
            addEventListener: () => {},
            localStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } },
            sessionStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } }
        };

        const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
        const tracker = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);

        const rawEmail = '  John.Doe@Business.COM  ';
        const normalized = rawEmail.trim().toLowerCase();
        const expectedHash = crypto.createHash('sha256').update(normalized).digest('hex');

        // Test purchase with untrimmed, mixed-case email
        tracker.trackOrderPurchase({
            orderId: 'DZ-ENHANCED-TEST',
            amount: 50.00,
            email: rawEmail
        });

        const purchaseEvent = mockWindow.dataLayer.find(item => item && item.event === 'conversion_order_paid');
        assert.ok(purchaseEvent, 'conversion_order_paid event must exist');
        assert.strictEqual(purchaseEvent.hashed_email, expectedHash, 'hashed_email must match exact SHA-256 hex');
        assert.strictEqual(purchaseEvent.client_email, normalized, 'client_email must be normalized');
    });

    await t.test('8. Database Migration: All attribution columns exist in public.orders table', async () => {
        const pool = require('../server/config/db');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
              AND column_name IN (
                'original_source', 'last_source', 'landing_page', 'referral_source',
                'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
                'gclid', 'gbraid', 'wbraid', 'attribution_data'
              );
        `);

        const foundCols = res.rows.map(r => r.column_name);
        const expectedCols = [
            'original_source', 'last_source', 'landing_page', 'referral_source',
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
            'gclid', 'gbraid', 'wbraid', 'attribution_data'
        ];

        for (const col of expectedCols) {
            assert.ok(foundCols.includes(col), `Column '${col}' must exist in public.orders`);
        }
    });

    await t.test('9. Admin Analytics: Correct CPA and ROAS formula verification', () => {
        const adSpend = 200; // $200 ad spend
        const googleAdsPaidOrders = 8;
        const googleAdsRevenue = 850; // $850 revenue

        const cpa = (adSpend / googleAdsPaidOrders).toFixed(2);
        const roas = (googleAdsRevenue / adSpend).toFixed(2);
        const roasPct = Math.round((googleAdsRevenue / adSpend) * 100);

        assert.strictEqual(cpa, '25.00', 'CPA must equal adSpend / paidOrders ($25.00)');
        assert.strictEqual(roas, '4.25', 'ROAS must equal revenue / adSpend (4.25x)');
        assert.strictEqual(roasPct, 425, 'ROAS % must equal 425%');
    });

    await t.test('10. Clean Vanity Tracking Links: File assets and immediate attribution redirect scripts exist', () => {
        const cleanFiles = [
            { file: 'tiktok.html', channel: 'tiktok' },
            { file: 'instagram.html', channel: 'instagram' },
            { file: 'facebook.html', channel: 'facebook' },
            { file: 'fb.html', channel: 'facebook' },
            { file: 'ig.html', channel: 'instagram' },
            { file: 'youtube.html', channel: 'youtube' },
            { file: 'yt.html', channel: 'youtube' },
            { file: 'pinterest.html', channel: 'pinterest' }
        ];

        cleanFiles.forEach(({ file, channel }) => {
            const filePath = path.join(__dirname, '..', file);
            assert.ok(fs.existsSync(filePath), `${file} must exist`);
            const content = fs.readFileSync(filePath, 'utf-8');

            assert.ok(content.includes("var channel = '" + channel + "'"), `${file} must configure channel '${channel}'`);
            assert.ok(content.includes("var defaultMedium = 'organic_social'"), `${file} must set defaultMedium to 'organic_social'`);
            assert.ok(content.includes("var defaultCampaign = 'profile_bio'"), `${file} must set defaultCampaign to 'profile_bio'`);
            assert.ok(content.includes('localStorage.setItem'), `${file} must store attribution to localStorage`);
            assert.ok(content.includes('document.cookie'), `${file} must store attribution to cookies`);
            assert.ok(content.includes('window.location.replace'), `${file} must redirect using window.location.replace`);
            assert.ok(content.includes('GTM-5K8L9W2'), `${file} must include GTM container`);
        });

        // Verify subdirectories with index.html exist
        ['tiktok', 'instagram', 'facebook', 'fb', 'ig', 'youtube', 'yt', 'pinterest'].forEach(dir => {
            const dirIndex = path.join(__dirname, '..', dir, 'index.html');
            assert.ok(fs.existsSync(dirIndex), `${dir}/index.html must exist for directory routing`);
        });
    });

    await t.test('11. Clean Vanity Link Attribution Simulation: /tiktok preserves tracking across full buyer journey', () => {
        const analyticsCode = fs.readFileSync(path.join(__dirname, '../js/analytics.js'), 'utf-8');
        const mockStorage = {};
        const mockCookies = {};

            const mockWindow = {
                DEZAN_TRACKING_CONFIG: { gtmId: 'GTM-TEST', currency: 'USD' },
                location: { pathname: '/tiktok', search: '' },
                addEventListener: () => {},
                localStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } },
                sessionStorage: { getItem: (k) => mockStorage[k] || null, setItem: (k, v) => { mockStorage[k] = v; } }
            };

            const runner = new Function('window', 'global', 'localStorage', 'sessionStorage', 'document', analyticsCode + '; return window.dezanTracker;');
            
            // Step 1: User hits clean link /tiktok
            const trackerStep1 = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);
            const attr1 = trackerStep1.getAttribution();

            assert.strictEqual(attr1.original_source, 'tiktok');
            assert.strictEqual(attr1.last_source, 'tiktok');
            assert.strictEqual(attr1.utm_source, 'tiktok');
            assert.strictEqual(attr1.utm_medium, 'organic_social');
            assert.strictEqual(attr1.utm_campaign, 'profile_bio');

            // Step 2: User is redirected to clean homepage '/' without query parameters
            mockWindow.location.pathname = '/';
            mockWindow.location.search = '';
            const trackerStep2 = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);
            const attr2 = trackerStep2.getAttribution();

            assert.strictEqual(attr2.original_source, 'tiktok', 'Original source must remain tiktok on homepage');
            assert.strictEqual(attr2.last_source, 'tiktok', 'Last source must remain tiktok on homepage');
            assert.strictEqual(attr2.utm_campaign, 'profile_bio', 'UTM campaign must remain profile_bio on homepage');

            // Step 3: User navigates to pricing and checkout
            mockWindow.location.pathname = '/pricing.html';
            const trackerStep3 = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);
            const attr3 = trackerStep3.getAttribution();
            assert.strictEqual(attr3.original_source, 'tiktok');

            // Step 4: User completes order and lands on order confirmation step
            mockWindow.location.pathname = '/order-success.html';
            mockWindow.location.search = '?order=DZ-TIKTOK-ORDER';
            const trackerStep4 = runner(mockWindow, mockWindow, mockWindow.localStorage, mockWindow.sessionStorage, undefined);
            
            trackerStep4.trackOrderPurchase({
                orderId: 'DZ-TIKTOK-ORDER',
                amount: 35.00,
                service: 'Cap / Hat Digitizing',
                email: 'client@example.com'
            });

            const purchaseEvt = mockWindow.dataLayer.find(e => e && e.event === 'purchase');
            assert.ok(purchaseEvt, 'Purchase event must be fired on order-success');
            assert.strictEqual(purchaseEvt.ecommerce.transaction_id, 'DZ-TIKTOK-ORDER');

            const conversionEvt = mockWindow.dataLayer.find(e => e && e.event === 'conversion_order_paid');
            assert.ok(conversionEvt, 'Google Ads conversion_order_paid must be fired');
            assert.strictEqual(conversionEvt.ad_attribution.original_source, 'tiktok');
            assert.strictEqual(conversionEvt.ad_attribution.utm_campaign, 'profile_bio');
    });

    t.after(async () => {
        try {
            const pool = require('../server/config/db');
            await pool.end();
        } catch (e) {}
    });

});

