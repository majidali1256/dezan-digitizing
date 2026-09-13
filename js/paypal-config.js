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

    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const PayPalConfig = {
        clientId: (typeof window !== 'undefined' && window.DEZAN_PAYPAL_CLIENT_ID) ||
                  (typeof window !== 'undefined' && window.ENV && window.ENV.PAYPAL_CLIENT_ID) || '',
        currency: 'USD',
        intent: 'capture',
        environment: isLocalhost ? 'sandbox' : 'production',
        isLoaded: false,
        isLoading: false,
        _loadPromise: null,

        /**
         * Fetch active client configuration from server API
         * Returns only public client ID and environment (Production vs Sandbox)
         */
        fetchServerConfig: async function() {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            try {
                const res = await fetch('/api/paypal/config', { signal: controller.signal, cache: 'no-store' });
                if (!res.ok) throw new Error('Payment service is unavailable. Please try again shortly.');
                const json = await res.json();
                if (!json.success || !json.data?.clientId) {
                    throw new Error('Online payments are not configured yet. Please contact support.');
                }
                this.clientId = json.data.clientId;
                this.currency = json.data.currency || 'USD';
                this.environment = json.data.environment;
                return json.data;
            } finally {
                clearTimeout(timeoutId);
            }
        },

        loadSdk: function(options = {}) {
            if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
            if (window.paypal && typeof window.paypal.Buttons === 'function') {
                this.isLoaded = true;
                return Promise.resolve(window.paypal);
            }
            if (this._loadPromise) return this._loadPromise;
            this.isLoading = true;

            // Share the entire operation, including configuration, between callers.
            this._loadPromise = Promise.resolve().then(async () => {
                if (!options.clientId && !window.DEZAN_PAYPAL_CLIENT_ID && !(window.ENV && window.ENV.PAYPAL_CLIENT_ID)) {
                    await this.fetchServerConfig();
                }
                const clientId = options.clientId || this.clientId;
                const currency = options.currency || this.currency;
                if (!clientId) throw new Error('Online payments are not configured yet. Please contact support.');
                return new Promise((resolve, reject) => {
                    // A failed script will never emit another load event. Retry with a new one.
                    document.getElementById('dezan-paypal-sdk')?.remove();
                    const script = document.createElement('script');
                    script.id = 'dezan-paypal-sdk';
                    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons&enable-funding=card`;
                    script.async = true;
                    const finish = (error) => {
                        clearTimeout(timeoutId);
                        script.onload = null;
                        script.onerror = null;
                        if (error) {
                            script.remove();
                            reject(error);
                        } else {
                            resolve(window.paypal);
                        }
                    };
                    const timeoutId = setTimeout(() => finish(new Error('PayPal connection timed out. Please retry.')), 30000);
                    script.onload = () => finish(
                        typeof window.paypal?.Buttons === 'function' ? null : new Error('PayPal payment buttons could not load. Please retry.')
                    );
                    script.onerror = () => finish(new Error('Unable to connect to PayPal. Please check your connection and retry.'));
                    document.head.appendChild(script);
                });
            }).then((paypal) => {
                this.isLoaded = true;
                return paypal;
            }).finally(() => {
                this.isLoading = false;
                this._loadPromise = null;
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
