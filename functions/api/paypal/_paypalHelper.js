/**
 * Cloudflare Pages Function Helper: PayPal REST API Client
 * Runs on Cloudflare Workers edge runtime using native Web fetch & crypto
 */

export function getPayPalConfig(env = {}) {
    const clientId = env.PAYPAL_CLIENT_ID || '';
    const clientSecret = env.PAYPAL_CLIENT_SECRET || '';
    const currency = env.PAYPAL_CURRENCY || 'USD';
    const isProduction = (env.PAYPAL_MODE === 'live' || env.PAYPAL_MODE === 'production');
    const baseUrl = isProduction ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    return {
        clientId,
        clientSecret,
        currency,
        isProduction,
        baseUrl
    };
}

export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

export async function getPayPalAccessToken(env) {
    const { clientId, clientSecret, baseUrl, isProduction } = getPayPalConfig(env);

    if (!clientId || !clientSecret) {
        throw new Error(`PayPal credentials missing in Cloudflare environment. Mode: ${isProduction ? 'Live' : 'Sandbox'}`);
    }

    const auth = btoa(`${clientId}:${clientSecret}`);

    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error('[PayPal Edge Auth Error]:', res.status, errText);
        throw new Error(`Failed to obtain PayPal access token: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.access_token;
}
