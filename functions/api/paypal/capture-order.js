/**
 * Cloudflare Pages Function: POST /api/paypal/capture-order
 * Captures an approved PayPal payment on the server and synchronizes order status with InsForge DB
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

        const { paypalOrderId, orderId } = body;

        if (!paypalOrderId) {
            return new Response(JSON.stringify({
                success: false,
                message: 'PayPal Order ID is required for capture'
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const config = getPayPalConfig(context.env);
        const accessToken = await getPayPalAccessToken(context.env);

        // Execute payment capture on PayPal REST API
        const res = await fetch(`${config.baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        });

        const captureData = await res.json().catch(() => null);

        if (!res.ok || !captureData) {
            const errorMessage = captureData?.message || captureData?.details?.[0]?.description || res.statusText;
            console.error(`[PayPal Edge Capture Error] Order ${paypalOrderId}:`, captureData);
            return new Response(JSON.stringify({
                success: false,
                message: `PayPal payment capture failed: ${errorMessage}`
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const status = captureData.status; // Expected: 'COMPLETED'
        const captures = captureData.purchase_units?.[0]?.payments?.captures || [];
        const primaryCapture = captures[0] || {};
        const captureId = primaryCapture.id;
        if (status !== 'COMPLETED' || primaryCapture.status !== 'COMPLETED' || !captureId) {
            return Response.json({
                success: false,
                message: 'Payment has not completed. Please contact support before retrying.'
            }, { status: 409, headers: corsHeaders() });
        }

        // Synchronize with InsForge PostgreSQL database if orderId is provided
        const insforgeUrl = context.env.NEXT_PUBLIC_INSFORGE_URL || 'https://e8rw998g.us-east.insforge.app';
        const insforgeKey = context.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50';

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
                    if (Array.isArray(found) && found.length > 0) {
                        const existing = found[0];
                        const isQuote = existing.is_quote === true ||
                                        existing.status === 'quote_ready' ||
                                        (existing.order_number && existing.order_number.startsWith('QUO-'));

                        const patchPayload = {
                            payment_status: 'paid',
                            payment_method: 'PayPal',
                            transaction_id: captureId,
                            updated_at: new Date().toISOString()
                        };

                        if (isQuote) {
                            patchPayload.is_quote = false;
                            patchPayload.status = 'pending_review';
                        }

                        await fetch(`${insforgeUrl}/api/database/records/orders?${searchParam}`, {
                            method: 'PATCH',
                            headers: {
                                'apikey': insforgeKey,
                                'Authorization': `Bearer ${insforgeKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(patchPayload)
                        });
                    }
                }
            } catch (syncErr) {
                console.warn('[PayPal Edge InsForge Sync Notice]:', syncErr.message);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'PayPal payment successfully captured and verified',
            data: {
                captureId,
                status,
                paypalOrderId,
                amount: primaryCapture.amount?.value,
                currency: primaryCapture.amount?.currency_code
            }
        }), {
            status: 200,
            headers: corsHeaders()
        });
    } catch (err) {
        console.error('[PayPal Edge Capture Exception]:', err);
        return new Response(JSON.stringify({
            success: false,
            message: `Unable to capture PayPal payment: ${err.message}`
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
