/**
 * Dezan Digitizing - Web Analytics & Google Ads Conversion Tracking Engine
 * 
 * Manages Google Tag Manager (GTM), Google Ads Conversion Tracking,
 * GA4 Ecommerce Purchase Events, Google Consent Mode v2, and Ad-Click Attribution (gclid/wbraid).
 */
(function (global) {
    'use strict';

    // 1. Load or initialize configuration
    const config = global.DEZAN_TRACKING_CONFIG || {
        gtmId: 'GTM-5K8L9W2',
        googleAdsId: 'AW-16892345678',
        googleAdsPurchaseLabel: 'AbCdEfGhIjKlMnOpQr',
        googleAdsLeadLabel: 'ZyXwVuTsRqPoNmLkJi',
        gaMeasurementId: 'G-XXXXXXXXXX',
        currency: 'USD',
        affiliation: 'Dezan Digitizing Online Store',
        debug: true
    };

    // 2. Initialize dataLayer & gtag
    global.dataLayer = global.dataLayer || [];
    function gtag() {
        global.dataLayer.push(arguments);
    }
    global.gtag = global.gtag || gtag;

    // 3. Google Consent Mode v2 Initialization
    const consentChoice = typeof localStorage !== 'undefined' ? localStorage.getItem('dezan_cookie_consent') : null;
    const isGranted = consentChoice === 'accepted';

    gtag('consent', 'default', {
        'ad_storage': isGranted ? 'granted' : 'denied',
        'analytics_storage': isGranted ? 'granted' : 'denied',
        'ad_user_data': isGranted ? 'granted' : 'denied',
        'ad_personalization': isGranted ? 'granted' : 'denied',
        'wait_for_update': 500
    });

    // Listen for cookie consent updates from cookie-consent.js
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', function (e) {
            if (e.key === 'dezan_cookie_consent') {
                const granted = e.newValue === 'accepted';
                gtag('consent', 'update', {
                    'ad_storage': granted ? 'granted' : 'denied',
                    'analytics_storage': granted ? 'granted' : 'denied',
                    'ad_user_data': granted ? 'granted' : 'denied',
                    'ad_personalization': granted ? 'granted' : 'denied'
                });
                if (config.debug) {
                    console.log('[Tracking Consent Updated]', e.newValue);
                }
            }
        });
    }

    // 4. Capture and preserve Google Ad Click & Campaign Attribution Parameters
    function captureAdAttribution() {
        if (typeof window === 'undefined' || !window.location) return {};
        const params = new URLSearchParams(window.location.search);
        const attribution = {};
        const keys = [
            'gclid', 'gbraid', 'wbraid', 
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
        ];

        let hasNewData = false;
        keys.forEach(function (k) {
            const val = params.get(k);
            if (val) {
                attribution[k] = val;
                hasNewData = true;
            }
        });

        if (hasNewData) {
            attribution.landing_page = window.location.pathname;
            attribution.captured_at = new Date().toISOString();
            try {
                sessionStorage.setItem('dezan_ad_attribution', JSON.stringify(attribution));
                localStorage.setItem('dezan_ad_attribution_persistent', JSON.stringify(attribution));
            } catch (_) {}
            if (config.debug) {
                console.log('%c[Tracking] Google Ad Attribution captured:', 'color: #3b82f6; font-weight: bold;', attribution);
            }
        }

        // Return current or previously preserved attribution
        try {
            const stored = sessionStorage.getItem('dezan_ad_attribution') || 
                           localStorage.getItem('dezan_ad_attribution_persistent');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (_) {}

        return attribution;
    }

    const currentAttribution = captureAdAttribution();

    // 5. Inject GTM Container Script if configured and not already present
    if (typeof document !== 'undefined' && config.gtmId && !config.gtmId.includes('XXXXXXX')) {
        if (!document.querySelector(`script[src*="googletagmanager.com/gtm.js?id=${config.gtmId}"]`)) {
            (function (w, d, s, l, i) {
                w[l] = w[l] || [];
                w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                var f = d.getElementsByTagName(s)[0],
                    j = d.createElement(s),
                    dl = l !== 'dataLayer' ? '&l=' + l : '';
                j.async = true;
                j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
                if (f && f.parentNode) {
                    f.parentNode.insertBefore(j, f);
                } else if (d.head) {
                    d.head.appendChild(j);
                }
            })(window, document, 'script', 'dataLayer', config.gtmId);
        }
    }

    // 6. Direct Google Ads & GA4 Configuration if present
    if (typeof document !== 'undefined' && config.googleAdsId && !config.googleAdsId.includes('XXXXXXX')) {
        const gtagScriptUrl = `https://www.googletagmanager.com/gtag/js?id=${config.googleAdsId}`;
        if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${config.googleAdsId}"]`)) {
            const s = document.createElement('script');
            s.async = true;
            s.src = gtagScriptUrl;
            document.head.appendChild(s);
        }

        gtag('js', new Date());
        gtag('config', config.googleAdsId, {
            allow_enhanced_conversions: true,
            cookie_flags: 'SameSite=None;Secure'
        });
        if (config.gaMeasurementId && !config.gaMeasurementId.includes('XXXXXXX')) {
            gtag('config', config.gaMeasurementId, {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
            });
        }
    }

    // 7. Deduplication Manager: Prevent duplicate conversion fires on page refreshes
    function getConvertedOrders() {
        try {
            const raw = localStorage.getItem('dezan_converted_orders');
            return raw ? JSON.parse(raw) : [];
        } catch (_) {
            return [];
        }
    }

    function markOrderConverted(orderId) {
        try {
            const list = getConvertedOrders();
            if (!list.includes(orderId)) {
                list.push(orderId);
                // Keep only the latest 100 orders to avoid unbounded storage
                if (list.length > 100) list.shift();
                localStorage.setItem('dezan_converted_orders', JSON.stringify(list));
            }
        } catch (_) {}
    }

    function isOrderAlreadyConverted(orderId) {
        if (!orderId) return false;
        const list = getConvertedOrders();
        return list.includes(orderId);
    }

    // 8. Public Conversion Tracking Methods
    const DezanTracker = {
        config: config,

        /**
         * Track a successful paid order conversion.
         * Fired on the Thank You / Order Confirmed page (order-success.html).
         * 
         * @param {Object} details
         * @param {string} details.orderId - Unique Order ID (e.g. 'DZ-1048')
         * @param {string} [details.txnId] - Payment Transaction ID
         * @param {number|string} details.amount - Order amount paid in USD (e.g. 15.00)
         * @param {string} [details.service] - Service name (e.g. 'Embroidery Digitizing')
         * @param {string} [details.plan] - Plan name (e.g. 'Left Chest / Hat')
         * @param {string} [details.project] - Project title / artwork title
         * @param {string} [details.email] - Client email for Google Ads Enhanced Conversions
         * @returns {boolean} Whether the conversion was fired (false if deduplicated)
         */
        trackOrderPurchase: function (details) {
            details = details || {};
            const orderId = (details.orderId || '').trim();
            const numAmount = parseFloat(details.amount) || 0;
            const txnId = details.txnId || ('TXN-' + Math.floor(100000 + Math.random() * 900000));
            const email = (details.email || '').trim();
            const service = details.service || 'Embroidery Digitizing';
            const plan = details.plan || service;

            if (!orderId) {
                if (config.debug) console.warn('[Tracking] Cannot fire conversion without an orderId.');
                return false;
            }

            // Deduplication check
            if (isOrderAlreadyConverted(orderId)) {
                if (config.debug) {
                    console.log(
                        `%c[Tracking Safeguard] Order #${orderId} has already fired a conversion. Skipping duplicate fire to protect ROAS accuracy.`,
                        'color: #f59e0b; font-weight: bold;'
                    );
                }
                return false;
            }

            const attribution = captureAdAttribution();

            // 1. Google Ads Direct Conversion Tag
            const sendTo = `${config.googleAdsId}/${config.googleAdsPurchaseLabel}`;
            gtag('event', 'conversion', {
                send_to: sendTo,
                value: numAmount,
                currency: config.currency,
                transaction_id: orderId
            });

            // 2. GA4 / GTM E-commerce Standard Purchase Event
            const purchasePayload = {
                event: 'purchase',
                ecommerce: {
                    transaction_id: orderId,
                    affiliation: config.affiliation,
                    value: numAmount,
                    currency: config.currency,
                    tax: 0.00,
                    shipping: 0.00,
                    items: [{
                        item_id: orderId,
                        item_name: plan,
                        item_category: service,
                        price: numAmount,
                        quantity: 1
                    }]
                },
                user_data: email ? {
                    email: email.toLowerCase()
                } : undefined,
                ad_attribution: attribution,
                transaction_meta: {
                    txn_id: txnId,
                    timestamp: new Date().toISOString()
                }
            };

            global.dataLayer.push(purchasePayload);

            // 3. Custom GTM event for custom triggers
            global.dataLayer.push({
                event: 'conversion_order_paid',
                order_id: orderId,
                order_value: numAmount,
                currency: config.currency,
                service_type: service,
                plan_name: plan,
                client_email: email,
                gclid: attribution.gclid || null
            });

            // Mark order as converted to prevent duplicates on refresh
            markOrderConverted(orderId);

            if (config.debug) {
                console.log(
                    `%c[Google Ads Conversion Tracking] Purchase Conversion Successfully Fired!`,
                    'color: #10b981; font-weight: bold; font-size: 13px;',
                    {
                        orderId: orderId,
                        amount: numAmount,
                        currency: config.currency,
                        send_to: sendTo,
                        attribution: attribution,
                        enhanced_conversions_email: email ? email.replace(/(?<=.{2}).(?=.*@)/g, '*') : 'None'
                    }
                );
            }

            return true;
        },

        /**
         * Track a custom quote request ($0 estimation lead).
         * Fires 'generate_lead' instead of 'purchase' so $0 requests never distort paid purchase ROAS.
         * 
         * @param {Object} details
         */
        trackQuoteLead: function (details) {
            details = details || {};
            const quoteId = (details.quoteId || details.orderId || '').trim();
            const email = (details.email || '').trim();
            const service = details.service || 'Embroidery Digitizing';
            const project = details.project || 'Custom Embroidery Design';

            if (!quoteId) return false;

            const attribution = captureAdAttribution();

            // Optional Google Ads Lead Conversion Tag
            if (config.googleAdsLeadLabel) {
                gtag('event', 'conversion', {
                    send_to: `${config.googleAdsId}/${config.googleAdsLeadLabel}`,
                    transaction_id: quoteId
                });
            }

            // GA4 / GTM Lead Generation Event
            global.dataLayer.push({
                event: 'generate_lead',
                lead_type: 'free_quote_request',
                quote_id: quoteId,
                service: service,
                project: project,
                user_data: email ? { email: email.toLowerCase() } : undefined,
                ad_attribution: attribution
            });

            global.dataLayer.push({
                event: 'conversion_quote_requested',
                quote_id: quoteId,
                client_email: email,
                gclid: attribution.gclid || null
            });

            if (config.debug) {
                console.log(
                    `%c[Tracking] Free Quote Lead Tracked (#${quoteId})`,
                    'color: #0ea5e9; font-weight: bold;',
                    { quoteId, service, email, attribution }
                );
            }

            return true;
        },

        /**
         * Get the current or preserved Google Ads click & campaign attribution
         */
        getAttribution: function () {
            return captureAdAttribution();
        },

        /**
         * Generic event helper
         */
        trackEvent: function (eventName, params) {
            gtag('event', eventName, params);
            global.dataLayer.push(Object.assign({ event: eventName }, params || {}));
        }
    };

    global.dezanTracker = DezanTracker;

})(typeof window !== 'undefined' ? window : this);
