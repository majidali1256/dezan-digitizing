/**
 * Dezan Digitizing - Centralized Analytics & Conversion Tracking Configuration
 * 
 * Update your Google Tag Manager Container ID, Google Ads Conversion ID,
 * and Conversion Labels here or by defining `window.DEZAN_TRACKING_CONFIG` in an inline script.
 */
(function (global) {
    const existing = global.DEZAN_TRACKING_CONFIG || {};

    global.DEZAN_TRACKING_CONFIG = {
        // Google Tag Manager Container ID (e.g., 'GTM-XXXXXXX')
        gtmId: existing.gtmId || global.DEZAN_GTM_ID || 'GTM-5K8L9W2',

        // Google Ads Account ID (e.g., 'AW-16892345678')
        googleAdsId: existing.googleAdsId || global.DEZAN_GOOGLE_ADS_ID || 'AW-16892345678',

        // Google Ads Purchase Conversion Label (e.g., 'AbCdEfGhIjKlMnOpQr')
        googleAdsPurchaseLabel: existing.googleAdsPurchaseLabel || global.DEZAN_GOOGLE_ADS_PURCHASE_LABEL || 'AbCdEfGhIjKlMnOpQr',

        // Google Ads Custom Quote / Lead Conversion Label (optional)
        googleAdsLeadLabel: existing.googleAdsLeadLabel || global.DEZAN_GOOGLE_ADS_LEAD_LABEL || 'ZyXwVuTsRqPoNmLkJi',

        // Google Analytics 4 Measurement ID (e.g., 'G-XXXXXXXXXX')
        gaMeasurementId: existing.gaMeasurementId || global.DEZAN_GA_ID || 'G-XXXXXXXXXX',

        // Default Transaction Currency
        currency: existing.currency || 'USD',

        // Affiliation / Store Name
        affiliation: existing.affiliation || 'Dezan Digitizing Online Store',

        // Enable verbose diagnostics in the browser console for QA and debugging
        debug: existing.debug !== undefined ? existing.debug : true
    };
})(typeof window !== 'undefined' ? window : this);
