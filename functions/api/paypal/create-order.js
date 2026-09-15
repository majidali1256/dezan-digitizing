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

        const insforgeUrl = context.env.NEXT_PUBLIC_INSFORGE_URL || 'https://e8rw998g.us-east.insforge.app';
        const insforgeKey = context.env.INSFORGE_API_KEY || context.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50';

        let finalAmount = parseFloat(amount || 0).toFixed(2);

        // Server-side authoritative price verification if orderId is provided
        if (orderId && insforgeUrl) {
            try {
                const searchParam = `order_number=eq.${encodeURIComponent(orderId)}`;
                const checkRes = await fetch(`${insforgeUrl}/api/database/records/orders?${searchParam}`, {
                    headers: {
                        'apikey': insforgeKey,
                        'Authorization': `Bearer ${insforgeKey}`
                    }
                });
                if (checkRes.ok) {
                    const found = await checkRes.json();
                    if (Array.isArray(found) && found.length > 0 && found[0].price) {
                        const dbPrice = parseFloat(found[0].price);
                        if (!isNaN(dbPrice) && dbPrice > 0) {
                            finalAmount = dbPrice.toFixed(2);
                        }
                    }
                }
            } catch (e) {
                console.warn('[PayPal Create Order DB Lookup Notice]:', e.message);
            }
        }

        if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) < 10.00) {
            return new Response(JSON.stringify({
                success: false,
                message: 'A valid order amount (minimum $10.00) is required to initialize payment.'
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
