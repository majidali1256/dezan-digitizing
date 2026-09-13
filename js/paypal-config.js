/**
 * Dezan Digitizing - PayPal Configuration & SDK Loader
 * 
 * Provides centralized PayPal settings and dynamic SDK loading.
 * SECURITY:
 * - Only the public PayPal Client ID is utilized in the browser.
 * - Sensitive credentials are kept strictly on the server side
 *   and NEVER included in frontend scripts or exposed to client bundles.
 * - Orders and payment captures are processed via server endpoints:
 *   POST /api/paypal/create-order
 *   POST /api/paypal/capture-order
 */
(function() {
    'use strict';

    const PayPalConfig = {
        // Fallback Sandbox Client ID (defaults to 'sb' if server route is unreachable)
        clientId: (typeof window !== 'undefined' && window.DEZAN_PAYPAL_CLIENT_ID) || 
                  (typeof window !== 'undefined' && window.ENV && window.ENV.PAYPAL_CLIENT_ID) || 
                  'sb',
        
        currency: 'USD',
        intent: 'capture',
        environment: 'sandbox',
        isLoaded: false,
        isLoading: false,
        _loadPromise: null,

        /**
         * Fetch active client configuration from server API
         * Returns only public client ID and environment (Production vs Sandbox)
         */
        fetchServerConfig: async function() {
            try {
                const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
                const res = await fetch('/api/paypal/config', controller ? { signal: controller.signal } : {});
                if (timeoutId) clearTimeout(timeoutId);
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data && json.data.clientId) {
                        this.clientId = json.data.clientId;
                        this.currency = json.data.currency || this.currency;
                        this.environment = json.data.environment || this.environment;
                        return json.data;
                    }
                }
            } catch (err) {
                console.warn('[PayPal Config] Server config fetch notice (using fallback):', err.message);
            }
            return null;
        },

        /**
         * Dynamically load the PayPal JavaScript SDK
         * @param {Object} options - Optional overrides ({ clientId, currency })
         * @returns {Promise<any>} Resolves with window.paypal
         */
        loadSdk: async function(options = {}) {
            if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
            if (window.paypal && typeof window.paypal.Buttons === 'function') {
                this.isLoaded = true;
                this.isLoading = false;
                return Promise.resolve(window.paypal);
            }

            if (this._loadPromise) return this._loadPromise;

            this.isLoading = true;

            // Retrieve active server configuration if not explicitly provided
            if (!options.clientId && !window.DEZAN_PAYPAL_CLIENT_ID && !(window.ENV && window.ENV.PAYPAL_CLIENT_ID)) {
                await this.fetchServerConfig();
            }

            const activeClientId = options.clientId || this.clientId || 'sb';
            const activeCurrency = options.currency || this.currency || 'USD';

            this._loadPromise = new Promise((resolve, reject) => {
                let timeoutId = null;
                const cleanup = () => {
                    if (timeoutId) clearTimeout(timeoutId);
                };

                // Safeguard against indefinite hanging if PayPal CDN is blocked or slow
                timeoutId = setTimeout(() => {
                    this.isLoading = false;
                    this._loadPromise = null;
                    reject(new Error('PayPal gateway connection timed out (6s)'));
                }, 6000);

                const existingScript = document.getElementById('dezan-paypal-sdk');
                if (existingScript) {
                    if (window.paypal && typeof window.paypal.Buttons === 'function') {
                        cleanup();
                        this.isLoaded = true;
                        this.isLoading = false;
                        resolve(window.paypal);
                        return;
                    }
                    existingScript.addEventListener('load', () => {
                        cleanup();
                        this.isLoaded = true;
                        this.isLoading = false;
                        resolve(window.paypal);
                    });
                    existingScript.addEventListener('error', (err) => {
                        cleanup();
                        this.isLoading = false;
                        this._loadPromise = null;
                        reject(err);
                    });
                    return;
                }

                const script = document.createElement('script');
                script.id = 'dezan-paypal-sdk';
                // components=buttons enable Smart Payment Buttons & Inline Cards, enable-funding=card ensures Debit/Credit Card button
                script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(activeClientId)}&currency=${encodeURIComponent(activeCurrency)}&intent=capture&components=buttons&enable-funding=card`;
                script.async = true;

                script.onload = () => {
                    cleanup();
                    this.isLoaded = true;
                    this.isLoading = false;
                    console.log(`[PayPal SDK] Loaded successfully [Environment: ${this.environment}]`);
                    resolve(window.paypal);
                };

                script.onerror = (err) => {
                    cleanup();
                    this.isLoading = false;
                    this._loadPromise = null;
                    console.error('[PayPal SDK] Failed to load SDK script:', err);
                    reject(new Error('Failed to load PayPal JavaScript SDK'));
                };

                document.head.appendChild(script);
            });

            return this._loadPromise;
        }
    };

    if (typeof window !== 'undefined') {
        window.PayPalConfig = PayPalConfig;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = PayPalConfig;
    }
})();
