/**
 * Dezan Digitizing — Secure Server-Side PayPal Service
 * 
 * Manages OAuth 2.0 Client Credentials flow, server-side order creation, 
 * and server-side payment capture using PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.
 * 
 * SECURITY:
 * - PAYPAL_CLIENT_SECRET is strictly used server-side and never returned to clients.
 * - Production environment uses Live PayPal API (https://api-m.paypal.com).
 * - Non-production environments use Sandbox API (https://api-m.sandbox.paypal.com).
 */
const config = require('../config/config');

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Generate or return cached PayPal OAuth 2.0 Access Token
 * @returns {Promise<string>} Bearer access token
 */
async function generateAccessToken() {
    const { clientId, clientSecret, baseUrl, isProduction } = config.paypal;

    if (!clientId || !clientSecret) {
        const envLabel = isProduction ? 'Production' : 'Sandbox/Development';
        throw new Error(`PayPal credentials missing for ${envLabel}. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in environment variables.`);
    }

    // Return cached token if valid (with 60-second safety cushion)
    const now = Date.now();
    if (cachedToken && tokenExpiresAt > now + 60000) {
        return cachedToken;
    }

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[PayPal Auth Error] Status ${response.status}:`, errorText);
        throw new Error(`Failed to generate PayPal access token: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return cachedToken;
}

/**
 * Create a PayPal Order on the server
 * @param {Object} params - Order details { orderId, amount, currency, description }
 * @returns {Promise<Object>} PayPal Order Response { id, status, links }
 */
async function createOrder({ orderId, amount, currency, description }) {
    const accessToken = await generateAccessToken();
    const { baseUrl, currency: defaultCurrency } = config.paypal;

    const formattedAmount = parseFloat(amount || 0).toFixed(2);
    if (isNaN(formattedAmount) || parseFloat(formattedAmount) <= 0) {
        throw new Error('A valid positive amount is required to create a PayPal order');
    }

    const payload = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                reference_id: orderId ? String(orderId) : undefined,
                description: description || `Dezan Digitizing Order Settlement #${orderId || ''}`.trim(),
                amount: {
                    currency_code: currency || defaultCurrency || 'USD',
                    value: formattedAmount
                }
            }
        ]
    };

    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error('[PayPal Create Order Error]:', errorData);
        throw new Error(errorData.message || errorData.details?.[0]?.description || 'Failed to create PayPal order');
    }

    const orderData = await response.json();
    return orderData;
}

/**
 * Capture payment for an approved PayPal Order on the server
 * @param {string} paypalOrderId - The PayPal Order ID to capture
 * @returns {Promise<Object>} Capture details { id, status, captureId, raw }
 */
async function captureOrder(paypalOrderId) {
    if (!paypalOrderId) {
        throw new Error('PayPal Order ID is required for payment capture');
    }

    const accessToken = await generateAccessToken();
    const { baseUrl } = config.paypal;

    const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    });

    const captureData = await response.json().catch(() => null);

    if (!response.ok || !captureData) {
        const errorMessage = captureData?.message || captureData?.details?.[0]?.description || response.statusText;
        console.error(`[PayPal Capture Error] Order ${paypalOrderId}:`, captureData);
        throw new Error(`PayPal payment capture failed: ${errorMessage}`);
    }

    const status = captureData.status; // Expected: 'COMPLETED'
    const captures = captureData.purchase_units?.[0]?.payments?.captures || [];
    const primaryCapture = captures[0] || {};
    const captureId = primaryCapture.id || captureData.id;

    if (status !== 'COMPLETED') {
        console.warn(`[PayPal Capture Notice] Unexpected status ${status} for order ${paypalOrderId}`);
    }

    return {
        id: captureData.id,
        paypalOrderId,
        status,
        captureId,
        amount: primaryCapture.amount?.value,
        currency: primaryCapture.amount?.currency_code,
        payer: captureData.payer,
        raw: captureData
    };
}

/**
 * Safely retrieve public PayPal client configuration
 * SECURITY GUARANTEE: Never exposes PAYPAL_CLIENT_SECRET.
 * @returns {Object} Public config { clientId, currency, environment }
 */
function getPublicClientConfig() {
    const { clientId, currency, isProduction } = config.paypal;
    return {
        clientId: clientId || (isProduction ? '' : 'sb'),
        currency: currency || 'USD',
        environment: isProduction ? 'production' : 'sandbox'
    };
}

module.exports = {
    generateAccessToken,
    createOrder,
    captureOrder,
    getPublicClientConfig
};
