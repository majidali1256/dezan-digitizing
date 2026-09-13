/**
 * Cloudflare Pages Function: POST /api/paypal/create-order
 * Initializes a PayPal Order on the server via PayPal REST API
 */
import { getPayPalConfig, getPayPalAccessToken, corsHeaders } from './_paypalHelper.js';

export async function onRequestPost(context) {
    try {
        let body = {};
        try {
            body = await context.request.json();
        } catch (_) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Invalid JSON request payload'
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const { orderId, amount, currency } = body;
        const config = getPayPalConfig(context.env);

        let finalAmount = parseFloat(amount || 0).toFixed(2);
        if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
            return new Response(JSON.stringify({
                success: false,
                message: 'A valid positive amount is required to create a payment order'
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const accessToken = await getPayPalAccessToken(context.env);

        const payload = {
            intent: 'CAPTURE',
            purchase_units: [
                {
                    reference_id: orderId ? String(orderId) : undefined,
                    description: `Dezan Digitizing Order Settlement ${orderId ? '#' + orderId : ''}`.trim(),
                    amount: {
                        currency_code: currency || config.currency || 'USD',
                        value: finalAmount
                    }
                }
            ]
        };

        const res = await fetch(`${config.baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: res.statusText }));
            console.error('[PayPal Edge Create Order Error]:', errorData);
            return new Response(JSON.stringify({
                success: false,
                message: errorData.message || errorData.details?.[0]?.description || 'Failed to create PayPal order'
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const orderData = await res.json();

        return new Response(JSON.stringify({
            success: true,
            data: {
                id: orderData.id,
                status: orderData.status
            },
            message: 'PayPal order initialized successfully'
        }), {
            status: 201,
            headers: corsHeaders()
        });
    } catch (err) {
        console.error('[PayPal Edge Create Order Exception]:', err);
        return new Response(JSON.stringify({
            success: false,
            message: `Unable to create PayPal order: ${err.message}`
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
