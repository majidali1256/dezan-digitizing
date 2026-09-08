/**
 * Dezan Digitizing - PayPal Configuration & SDK Loader
 * 
 * Provides centralized PayPal settings and dynamic SDK loading.
 * Switch between Sandbox and Live by updating PAYPAL_CLIENT_ID or window.ENV.PAYPAL_CLIENT_ID.
 */
(function() {
    'use strict';

    const PayPalConfig = {
        // Default Sandbox Client ID (or replace with your live Client ID from developer.paypal.com)
        clientId: (typeof window !== 'undefined' && window.DEZAN_PAYPAL_CLIENT_ID) || 
                  (typeof window !== 'undefined' && window.ENV && window.ENV.PAYPAL_CLIENT_ID) || 
                  'test',
        
        currency: 'USD',
        intent: 'capture',
        isLoaded: false,
        isLoading: false,
        _loadPromise: null,

        /**
         * Dynamically load the PayPal JavaScript SDK
         * @param {Object} options - Optional overrides ({ clientId, currency })
         * @returns {Promise<any>} Resolves with window.paypal
         */
        loadSdk: function(options = {}) {
            if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
            if (window.paypal) {
                this.isLoaded = true;
                return Promise.resolve(window.paypal);
            }

            if (this._loadPromise) return this._loadPromise;

            const clientId = options.clientId || this.clientId;
            const currency = options.currency || this.currency;

            this.isLoading = true;
            this._loadPromise = new Promise((resolve, reject) => {
                const existingScript = document.getElementById('dezan-paypal-sdk');
                if (existingScript) {
                    existingScript.addEventListener('load', () => {
                        this.isLoaded = true;
                        this.isLoading = false;
                        resolve(window.paypal);
                    });
                    existingScript.addEventListener('error', (err) => {
                        this.isLoading = false;
                        reject(err);
                    });
                    return;
                }

                const script = document.createElement('script');
                script.id = 'dezan-paypal-sdk';
                // components=buttons enable Smart Payment Buttons & Inline Cards
                script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
                script.async = true;

                script.onload = () => {
                    this.isLoaded = true;
                    this.isLoading = false;
                    console.log('[PayPal SDK] Loaded successfully with client ID:', clientId === 'test' ? 'Sandbox (test)' : 'Production');
                    resolve(window.paypal);
                };

                script.onerror = (err) => {
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
