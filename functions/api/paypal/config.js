/**
 * Cloudflare Pages Function: GET /api/paypal/config
 * Returns public PayPal Client ID, Currency, and Environment
 * 
 * SECURITY: PAYPAL_CLIENT_SECRET is NEVER exposed to the client.
 */
import { getPayPalConfig, corsHeaders } from './_paypalHelper.js';

export async function onRequestGet(context) {
    try {
        const { clientId, currency, isProduction } = getPayPalConfig(context.env);

        const responsePayload = {
            success: true,
            message: 'PayPal public configuration retrieved',
            data: {
                clientId: clientId || (isProduction ? '' : 'sb'),
                currency: currency || 'USD',
                environment: isProduction ? 'production' : 'sandbox'
            }
        };

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: corsHeaders()
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: `Failed to retrieve PayPal configuration: ${err.message}`
        }), {
            status: 500,
            headers: corsHeaders()
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: corsHeaders()
    });
}
