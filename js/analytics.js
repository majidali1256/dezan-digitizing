/**
 * Dezan Digitizing - Web Analytics & Google Ads Conversion Tracking Engine
 * 
 * Manages:
 * 1. Google Tag Manager (GTM) Container Injection & DataLayer Events
 * 2. Google Ads Conversion Tracking with Enhanced Conversions (SHA-256 Hashed Email)
 * 3. GA4 Ecommerce Lifecycle Funnel Events (view_item, order_started, begin_checkout, purchase, etc.)
 * 4. Dual-Touch Traffic Attribution (Original Source & Last Source, gclid, gbraid, wbraid, UTMs)
 * 5. Google Consent Mode v2 & Order Deduplication Safeguards
 */
(function (global) {
    'use strict';

    // 1. Load or initialize tracking configuration
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

    // 2. Initialize dataLayer & gtag function
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

    // 4. SHA-256 Hash Helper for Google Ads Enhanced Conversions
    function sha256Hex(str) {
        if (!str) return Promise.resolve('');
        const normalized = str.trim().toLowerCase();
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(normalized);
            return window.crypto.subtle.digest('SHA-256', data).then(function (buffer) {
                const hashArray = Array.from(new Uint8Array(buffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            }).catch(function () {
                return fallbackSha256(normalized);
            });
        }
        return Promise.resolve(fallbackSha256(normalized));
    }

    function fallbackSha256(ascii) {
        // Pure JS SHA-256 implementation fallback for offline/test environments
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }
        const mathPow = Math.pow;
        const maxWord = mathPow(2, 32);
        let result = '';
        const words = [];
        const asciiBitLength = ascii.length * 8;
        let hash = [];
        const k = [];
        let primeCounter = 0;
        const isComposite = {};
        for (let candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (let i = candidate * candidate; i < 312; i += candidate) {
                    isComposite[i] = true;
                }
                if (primeCounter < 8) {
                    hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
                }
                k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
                primeCounter++;
            }
        }
        ascii += '\x80';
        while (ascii.length % 64 - 56) ascii += '\x00';
        for (let i = 0; i < ascii.length; i++) {
            const j = ascii.charCodeAt(i);
            words[i >> 2] |= j << ((3 - (i % 4)) * 8);
        }
        words[words.length] = (asciiBitLength / maxWord) | 0;
        words[words.length] = asciiBitLength | 0;
        for (let j = 0; j < words.length;) {
            const w = words.slice(j, j += 16);
            const oldHash = hash.slice(0);
            for (let i = 0; i < 64; i++) {
                const w15 = w[i - 15], w2 = w[i - 2];
                const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
                const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
                const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
                const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
                const temp1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
                const temp2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
                hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
            }
            for (let i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }
        for (let i = 0; i < 8; i++) {
            for (let j = 3; j >= 0; j--) {
                const b = (hash[i] >> (8 * j)) & 255;
                result += (b < 16 ? '0' : '') + b.toString(16);
            }
        }
        return result;
    }

    // 5. Cookie Utilities for cross-session/cross-redirect attribution persistence
    function setAttributionCookie(name, val, days) {
        if (typeof document === 'undefined') return;
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = '; expires=' + d.toUTCString();
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(val)) + expires + '; path=/; SameSite=Lax';
    }

    function getAttributionCookie(name) {
        if (typeof document === 'undefined') return null;
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                try {
                    return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
                } catch (_) {
                    return null;
                }
            }
        }
        return null;
    }

    // 6. Channel & Source Categorization Engine
    function classifySource(params, referrer) {
        const gclid = params.gclid || params.gbraid || params.wbraid;
        const utmSource = (params.utm_source || '').toLowerCase();
        const utmMedium = (params.utm_medium || '').toLowerCase();
        const ref = (referrer || '').toLowerCase();

        // 1. Paid Google Ads
        if (gclid || utmMedium === 'cpc' || utmMedium === 'ppc' || utmMedium === 'paidsearch' || (utmSource === 'google' && utmMedium.includes('ad'))) {
            return 'google_ads';
        }

        // 2. TikTok
        if (utmSource.includes('tiktok') || ref.includes('tiktok.com')) {
            return 'tiktok';
        }

        // 3. Instagram
        if (utmSource.includes('instagram') || ref.includes('instagram.com') || ref.includes('l.instagram.com')) {
            return 'instagram';
        }

        // 4. Facebook
        if (utmSource.includes('facebook') || utmSource.includes('fb') || ref.includes('facebook.com') || ref.includes('fb.com') || ref.includes('l.facebook.com')) {
            return 'facebook';
        }

        // 5. Organic Google
        if (ref.includes('google.') && !gclid && utmMedium !== 'cpc') {
            return 'google_organic';
        }

        // 6. Other Organic Search (Bing, Yahoo, DuckDuckGo)
        if (ref.includes('bing.com') || ref.includes('yahoo.com') || ref.includes('duckduckgo.com') || utmMedium === 'organic') {
            return 'organic_search';
        }

        // 7. General External Referral
        if (ref && !ref.includes('dezandigitizing.com') && !ref.includes('localhost') && !ref.includes('127.0.0.1')) {
            return 'referral';
        }

        // 8. Custom UTM Source
        if (utmSource) {
            return utmSource;
        }

        // 9. Direct Traffic
        return 'direct';
    }

    // 7. Capture and Preserve Dual-Touch Google Ad & Campaign Attribution Parameters
    function captureTrafficAttribution() {
        if (typeof window === 'undefined' || !window.location) return {};

        const search = window.location.search;
        const params = new URLSearchParams(search);
        const ref = (typeof document !== 'undefined' ? document.referrer : '') || '';
        const currentPath = window.location.pathname || '/';

        const keys = [
            'gclid', 'gbraid', 'wbraid', 
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
        ];

        const queryData = {};
        let hasAdParams = false;
        keys.forEach(function (k) {
            const val = params.get(k);
            if (val) {
                queryData[k] = val.trim();
                hasAdParams = true;
            }
        });

        // Clean Vanity Social / Profile Links Mapping (e.g. dezandigitizing.com/tiktok, /instagram, /facebook)
        const CLEAN_VANITY_ROUTES = {
            '/tiktok': {
                source: 'tiktok',
                utm_source: 'tiktok',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/instagram': {
                source: 'instagram',
                utm_source: 'instagram',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/facebook': {
                source: 'facebook',
                utm_source: 'facebook',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/fb': {
                source: 'facebook',
                utm_source: 'facebook',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/ig': {
                source: 'instagram',
                utm_source: 'instagram',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/youtube': {
                source: 'youtube',
                utm_source: 'youtube',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/yt': {
                source: 'youtube',
                utm_source: 'youtube',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            },
            '/pinterest': {
                source: 'pinterest',
                utm_source: 'pinterest',
                utm_medium: 'organic_social',
                utm_campaign: 'profile_bio'
            }
        };

        const cleanPathKey = (currentPath || '/').replace(/\/+$/, '').replace(/\.html$/, '').toLowerCase();
        const vanityPreset = CLEAN_VANITY_ROUTES[cleanPathKey];
        if (vanityPreset) {
            queryData.utm_source = queryData.utm_source || vanityPreset.utm_source;
            queryData.utm_medium = queryData.utm_medium || vanityPreset.utm_medium;
            queryData.utm_campaign = queryData.utm_campaign || vanityPreset.utm_campaign;
            hasAdParams = true;
        }

        const nowIso = new Date().toISOString();
        const detectedSource = vanityPreset ? vanityPreset.source : classifySource(queryData, ref);

        // A. Load existing first-touch & last-touch
        let firstTouch = null;
        let lastTouch = null;

        try {
            const storedFirst = localStorage.getItem('dezan_first_touch_attribution');
            if (storedFirst) firstTouch = JSON.parse(storedFirst);
        } catch (_) {}
        if (!firstTouch) firstTouch = getAttributionCookie('dezan_first_touch');

        try {
            const storedLast = localStorage.getItem('dezan_last_touch_attribution');
            if (storedLast) lastTouch = JSON.parse(storedLast);
        } catch (_) {}
        if (!lastTouch) lastTouch = getAttributionCookie('dezan_last_touch');

        // B. If first-touch does not exist, record current visit as first-touch
        if (!firstTouch) {
            firstTouch = {
                source: detectedSource,
                landing_page: currentPath,
                referral_source: ref,
                gclid: queryData.gclid || null,
                gbraid: queryData.gbraid || null,
                wbraid: queryData.wbraid || null,
                utm_source: queryData.utm_source || null,
                utm_medium: queryData.utm_medium || null,
                utm_campaign: queryData.utm_campaign || null,
                utm_content: queryData.utm_content || null,
                utm_term: queryData.utm_term || null,
                captured_at: nowIso
            };
            try {
                localStorage.setItem('dezan_first_touch_attribution', JSON.stringify(firstTouch));
            } catch (_) {}
            setAttributionCookie('dezan_first_touch', firstTouch, 90);
        }

        // C. If new ad parameters or an external referrer arrived, update last-touch
        const isExternalReferrer = ref && !ref.includes('dezandigitizing.com') && !ref.includes('localhost') && !ref.includes('127.0.0.1');
        if (hasAdParams || isExternalReferrer || !lastTouch) {
            lastTouch = {
                source: detectedSource,
                landing_page: currentPath,
                referral_source: ref,
                gclid: queryData.gclid || (lastTouch ? lastTouch.gclid : null) || null,
                gbraid: queryData.gbraid || (lastTouch ? lastTouch.gbraid : null) || null,
                wbraid: queryData.wbraid || (lastTouch ? lastTouch.wbraid : null) || null,
                utm_source: queryData.utm_source || (lastTouch ? lastTouch.utm_source : null) || null,
                utm_medium: queryData.utm_medium || (lastTouch ? lastTouch.utm_medium : null) || null,
                utm_campaign: queryData.utm_campaign || (lastTouch ? lastTouch.utm_campaign : null) || null,
                utm_content: queryData.utm_content || (lastTouch ? lastTouch.utm_content : null) || null,
                utm_term: queryData.utm_term || (lastTouch ? lastTouch.utm_term : null) || null,
                captured_at: nowIso
            };
            try {
                localStorage.setItem('dezan_last_touch_attribution', JSON.stringify(lastTouch));
                sessionStorage.setItem('dezan_current_session_attribution', JSON.stringify(lastTouch));
            } catch (_) {}
            setAttributionCookie('dezan_last_touch', lastTouch, 30);
        }

        // Build active unified attribution payload
        const effective = lastTouch || firstTouch;
        const activeAttribution = {
            original_source: firstTouch ? firstTouch.source : 'direct',
            last_source: effective ? effective.source : 'direct',
            landing_page: firstTouch ? firstTouch.landing_page : currentPath,
            referral_source: firstTouch ? firstTouch.referral_source : ref,
            gclid: (effective && effective.gclid) || (firstTouch && firstTouch.gclid) || null,
            gbraid: (effective && effective.gbraid) || (firstTouch && firstTouch.gbraid) || null,
            wbraid: (effective && effective.wbraid) || (firstTouch && firstTouch.wbraid) || null,
            utm_source: (effective && effective.utm_source) || (firstTouch && firstTouch.utm_source) || null,
            utm_medium: (effective && effective.utm_medium) || (firstTouch && firstTouch.utm_medium) || null,
            utm_campaign: (effective && effective.utm_campaign) || (firstTouch && firstTouch.utm_campaign) || null,
            utm_content: (effective && effective.utm_content) || (firstTouch && firstTouch.utm_content) || null,
            utm_term: (effective && effective.utm_term) || (firstTouch && firstTouch.utm_term) || null,
            first_touch: firstTouch,
            last_touch: lastTouch
        };

        if (config.debug && hasAdParams) {
            console.log('%c[Tracking] Traffic Attribution Updated:', 'color: #3b82f6; font-weight: bold;', activeAttribution);
        }

        return activeAttribution;
    }

    const currentAttribution = captureTrafficAttribution();

    // 8. Inject GTM Container Script if configured and not already present
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

    // 9. Direct Google Ads & GA4 Configuration
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

    // 10. Deduplication Manager: Prevent duplicate conversion fires on page refreshes
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

    // 11. Public Tracking API Implementation
    const DezanTracker = {
        config: config,

        /**
         * Return active dual-touch attribution
         */
        getAttribution: function () {
            return captureTrafficAttribution();
        },

        /**
         * 1. Google Ads Conversion Tracking (Strictly Paid Orders)
         * Fires ONLY after successful payment and order creation on confirmation step.
         * Includes order ID, value, USD currency, service name, placement, rush/standard.
         * Supports Google Ads Enhanced Conversions with hashed email.
         * 
         * @param {Object} details
         * @param {string} details.orderId - Unique Order ID / Order Number (e.g. 'ORD-2026-1048')
         * @param {string} [details.txnId] - Payment Transaction ID
         * @param {number|string} details.amount - Order amount paid in USD (e.g. 15.00)
         * @param {string} [details.service] - Service name (e.g. 'Embroidery Digitizing')
         * @param {string} [details.plan] - Plan name (e.g. 'Left Chest / Hat')
         * @param {string} [details.placement] - Target placement (e.g. 'Cap / Hat', 'Left Chest')
         * @param {string} [details.turnaround] - 'rush' or 'standard'
         * @param {string} [details.email] - Client email for Enhanced Conversions
         * @returns {boolean} Whether conversion fired (false if deduplicated)
         */
        trackOrderPurchase: function (details) {
            details = details || {};
            const orderId = (details.orderId || details.orderNumber || '').trim();
            const numAmount = parseFloat(details.amount) || 0;
            const txnId = details.txnId || ('TXN-' + Math.floor(100000 + Math.random() * 900000));
            const email = (details.email || '').trim().toLowerCase();
            const service = details.service || 'Embroidery Digitizing';
            const plan = details.plan || service;
            const placement = details.placement || 'Standard Placement';
            const turnaround = (details.turnaround || details.turnaroundSpeed || 'standard').toLowerCase();
            const isRush = turnaround.includes('rush');

            if (!orderId) {
                if (config.debug) console.warn('[Tracking] Cannot fire conversion without an orderId.');
                return false;
            }

            // Deduplication safeguard: Prevent multiple fires on refresh
            if (isOrderAlreadyConverted(orderId)) {
                if (config.debug) {
                    console.log(
                        `%c[Tracking Safeguard] Order #${orderId} already fired conversion. Skipped duplicate to maintain ROAS integrity.`,
                        'color: #f59e0b; font-weight: bold;'
                    );
                }
                return false;
            }

            const attribution = captureTrafficAttribution();

            // Hash email for Google Ads Enhanced Conversions
            const hashedEmail = email ? fallbackSha256(email) : '';
            const userData = email ? {
                email: email,
                sha256_email_address: hashedEmail || undefined
            } : undefined;

            // 1. Google Ads Enhanced Conversions User Data
            if (userData) {
                gtag('set', 'user_data', userData);
            }

            // 2. Google Ads Direct Conversion Tag
            const sendTo = `${config.googleAdsId}/${config.googleAdsPurchaseLabel}`;
            gtag('event', 'conversion', {
                send_to: sendTo,
                value: numAmount,
                currency: config.currency,
                transaction_id: orderId,
                service_name: service,
                placement: placement,
                turnaround_speed: isRush ? 'rush' : 'standard',
                user_data: userData
            });

            // 3. GA4 Ecommerce Standard Purchase Event
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
                        item_variant: placement,
                        price: numAmount,
                        quantity: 1
                    }]
                },
                order_type: 'paid_order',
                service_name: service,
                placement: placement,
                rush_or_standard: isRush ? 'rush' : 'standard',
                user_data: userData,
                ad_attribution: attribution
            };
            global.dataLayer.push(purchasePayload);

            // 4. Custom GTM Event
            global.dataLayer.push({
                event: 'conversion_order_paid',
                order_id: orderId,
                order_value: numAmount,
                currency: config.currency,
                service_type: service,
                plan_name: plan,
                placement: placement,
                rush_or_standard: isRush ? 'rush' : 'standard',
                client_email: email,
                hashed_email: hashedEmail,
                gclid: attribution.gclid || null,
                original_source: attribution.original_source,
                last_source: attribution.last_source,
                ad_attribution: attribution
            });

            // Mark order as converted in local storage
            markOrderConverted(orderId);

            if (config.debug) {
                console.log(
                    `%c[Google Ads Conversion] Purchase Successfully Fired for #${orderId}!`,
                    'color: #10b981; font-weight: bold; font-size: 13px;',
                    {
                        orderId: orderId,
                        amount: numAmount,
                        currency: config.currency,
                        service: service,
                        placement: placement,
                        rush_or_standard: isRush ? 'rush' : 'standard',
                        attribution: attribution,
                        enhanced_conversions: email ? (email.replace(/(?<=.{2}).(?=.*@)/g, '*') + ' (Hashed: ' + hashedEmail.slice(0, 10) + '...)') : 'None'
                    }
                );
            }

            return true;
        },

        /**
         * 2. GA4 Funnel Event: service page view
         */
        trackServicePageView: function (serviceData) {
            serviceData = serviceData || {};
            const serviceName = serviceData.name || 'Embroidery Digitizing';
            const category = serviceData.category || 'Digitizing';
            const price = parseFloat(serviceData.price) || 15.00;

            const payload = {
                event: 'view_item',
                ecommerce: {
                    currency: config.currency,
                    value: price,
                    items: [{
                        item_id: serviceData.id || serviceName.toLowerCase().replace(/\s+/g, '_'),
                        item_name: serviceName,
                        item_category: category,
                        price: price,
                        quantity: 1
                    }]
                },
                page_type: 'service_page',
                service_name: serviceName
            };
            gtag('event', 'view_item', payload.ecommerce);
            global.dataLayer.push(payload);
        },

        /**
         * 3. GA4 Funnel Event: order started
         * (Fired when user clicks "Order Now" or opens the order modal. NEVER counts as a purchase.)
         */
        trackOrderStarted: function (triggerSource) {
            const payload = {
                event: 'order_started',
                trigger_source: triggerSource || 'order_now_button',
                timestamp: new Date().toISOString()
            };
            gtag('event', 'order_started', payload);
            global.dataLayer.push(payload);
        },

        /**
         * 4. GA4 Funnel Event: service selected
         */
        trackServiceSelected: function (serviceName, planName) {
            const payload = {
                event: 'service_selected',
                service_type: serviceName,
                plan_name: planName || serviceName,
                timestamp: new Date().toISOString()
            };
            gtag('event', 'service_selected', payload);
            global.dataLayer.push(payload);
        },

        /**
         * 5. GA4 Funnel Event: artwork uploaded
         */
        trackArtworkUploaded: function (fileCount, fileTypes) {
            const payload = {
                event: 'artwork_uploaded',
                file_count: fileCount || 1,
                file_types: Array.isArray(fileTypes) ? fileTypes.join(', ') : (fileTypes || 'unknown'),
                timestamp: new Date().toISOString()
            };
            gtag('event', 'artwork_uploaded', payload);
            global.dataLayer.push(payload);
        },

        /**
         * 6. GA4 Funnel Event: begin checkout
         */
        trackBeginCheckout: function (details) {
            details = details || {};
            const val = parseFloat(details.amount || details.price) || 15.00;
            const service = details.service || 'Embroidery Digitizing';
            const plan = details.plan || service;

            const payload = {
                event: 'begin_checkout',
                ecommerce: {
                    currency: config.currency,
                    value: val,
                    items: [{
                        item_name: plan,
                        item_category: service,
                        price: val,
                        quantity: 1
                    }]
                },
                placement: details.placement || 'Standard',
                turnaround_speed: details.turnaround || 'standard'
            };
            gtag('event', 'begin_checkout', payload.ecommerce);
            global.dataLayer.push(payload);
        },

        /**
         * 7. GA4 Funnel Event: add payment info
         */
        trackAddPaymentInfo: function (paymentType, details) {
            details = details || {};
            const val = parseFloat(details.amount || details.price) || 15.00;
            const payload = {
                event: 'add_payment_info',
                ecommerce: {
                    currency: config.currency,
                    value: val,
                    payment_type: paymentType || 'PayPal',
                    items: [{
                        item_name: details.plan || 'Embroidery Digitizing',
                        price: val,
                        quantity: 1
                    }]
                }
            };
            gtag('event', 'add_payment_info', payload.ecommerce);
            global.dataLayer.push(payload);
        },

        /**
         * 8. Free Custom Quote Lead ($0 Estimation Request)
         * Fires 'generate_lead' so $0 leads never distort paid purchase ROAS.
         */
        trackQuoteLead: function (details) {
            details = details || {};
            const quoteId = (details.quoteId || details.orderId || '').trim();
            const email = (details.email || '').trim().toLowerCase();
            const service = details.service || 'Embroidery Digitizing';
            const project = details.project || 'Custom Embroidery Design';

            if (!quoteId) return false;

            const attribution = captureTrafficAttribution();

            if (config.googleAdsLeadLabel) {
                gtag('event', 'conversion', {
                    send_to: `${config.googleAdsId}/${config.googleAdsLeadLabel}`,
                    transaction_id: quoteId
                });
            }

            const hashedEmail = email ? fallbackSha256(email) : '';
            const userData = email ? {
                email: email,
                sha256_email_address: hashedEmail || undefined
            } : undefined;

            global.dataLayer.push({
                event: 'generate_lead',
                lead_type: 'free_quote_request',
                quote_id: quoteId,
                service: service,
                project: project,
                user_data: userData,
                ad_attribution: attribution
            });

            global.dataLayer.push({
                event: 'conversion_quote_requested',
                quote_id: quoteId,
                client_email: email,
                gclid: attribution.gclid || null
            });

            if (config.debug) {
                console.log(`%c[Tracking] Free Quote Lead Tracked (#${quoteId})`, 'color: #0ea5e9; font-weight: bold;', { quoteId, service, email, attribution });
            }

            return true;
        },

        /**
         * 9. GA4 Lifecycle Event: revision requested
         */
        trackRevisionRequested: function (details) {
            details = details || {};
            const payload = {
                event: 'revision_requested',
                order_number: details.orderNumber || details.order_number || '',
                notes_length: details.notes ? details.notes.length : 0,
                has_photos: Boolean(details.photosCount && details.photosCount > 0),
                timestamp: new Date().toISOString()
            };
            gtag('event', 'revision_requested', payload);
            global.dataLayer.push(payload);
        },

        /**
         * 10. GA4 Lifecycle Event: files downloaded
         */
        trackFilesDownloaded: function (details) {
            details = details || {};
            const payload = {
                event: 'files_downloaded',
                order_number: details.orderNumber || details.order_number || '',
                format: details.format || 'dst',
                file_name: details.fileName || details.name || 'deliverable',
                timestamp: new Date().toISOString()
            };
            gtag('event', 'files_downloaded', payload);
            global.dataLayer.push(payload);
        },

        /**
         * Generic event helper
         */
        trackEvent: function (eventName, params) {
            gtag('event', eventName, params);
            global.dataLayer.push(Object.assign({ event: eventName }, params || {}));
        },

        /**
         * Record a clean vanity tracking link entry and return attribution
         * @param {string} channel - e.g. 'tiktok', 'instagram', 'facebook'
         * @param {Object} [customParams]
         * @param {string} [destination] - Target redirect URL (e.g. '/')
         */
        recordCleanLinkVisit: function (channel, customParams, destination) {
            channel = (channel || 'direct').toLowerCase();
            customParams = customParams || {};
            const cleanObj = {
                source: channel,
                landing_page: '/' + channel,
                referral_source: typeof document !== 'undefined' ? (document.referrer || (channel + '.com')) : (channel + '.com'),
                utm_source: customParams.utm_source || channel,
                utm_medium: customParams.utm_medium || 'organic_social',
                utm_campaign: customParams.utm_campaign || 'profile_bio',
                utm_content: customParams.utm_content || null,
                utm_term: customParams.utm_term || null,
                gclid: customParams.gclid || null,
                gbraid: customParams.gbraid || null,
                wbraid: customParams.wbraid || null,
                captured_at: new Date().toISOString()
            };

            try {
                const existingFirst = localStorage.getItem('dezan_first_touch_attribution');
                if (!existingFirst) {
                    localStorage.setItem('dezan_first_touch_attribution', JSON.stringify(cleanObj));
                }
                localStorage.setItem('dezan_last_touch_attribution', JSON.stringify(cleanObj));
                sessionStorage.setItem('dezan_current_session_attribution', JSON.stringify(cleanObj));
            } catch (_) {}

            setAttributionCookie('dezan_last_touch', cleanObj, 30);
            setAttributionCookie('dezan_tracking_data', cleanObj, 30);
            if (!getAttributionCookie('dezan_first_touch')) {
                setAttributionCookie('dezan_first_touch', cleanObj, 90);
            }

            if (global.dataLayer) {
                global.dataLayer.push({
                    event: 'clean_tracking_link_visit',
                    channel: channel,
                    utm_source: cleanObj.utm_source,
                    utm_medium: cleanObj.utm_medium,
                    utm_campaign: cleanObj.utm_campaign,
                    destination: destination || '/'
                });
            }

            return cleanObj;
        }
    };

    global.dezanTracker = DezanTracker;

})(typeof window !== 'undefined' ? window : this);
