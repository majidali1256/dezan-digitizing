/**
 * Dezan Digitizing - Web Analytics Loader (Google Analytics 4 / GA4)
 * Easily configure your Measurement ID by setting window.DEZAN_GA_ID = 'G-XXXXXXXXXX'
 * or editing the fallback ID below.
 */
(function () {
    // Replace with your real Google Analytics 4 Measurement ID
    const GA_MEASUREMENT_ID = window.DEZAN_GA_ID || window.GA_MEASUREMENT_ID || '';

    // If no ID is configured, exit silently without throwing errors
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        // Ready for tracking once ID is supplied
        window.gtag = window.gtag || function () {
            if (window.location.hostname === 'localhost') {
                console.log('[Analytics Dev Mock]', ...arguments);
            }
        };
        return;
    }

    // Check cookie consent: if user chose essential_only, do not load tracking cookies
    const consent = localStorage.getItem('dezan_cookie_consent');
    if (consent === 'essential_only') {
        return;
    }

    // Inject Google Tag script dynamically
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        cookie_flags: 'SameSite=None;Secure'
    });
})();
