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

});
