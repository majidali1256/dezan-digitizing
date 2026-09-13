/**
 * Cloudflare Pages Function: POST /api/quotes/:id/convert
 * Edge endpoint to convert a priced quote into an active production order
 */

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

export async function onRequestPost(context) {
    try {
        const { id } = context.params;
        let body = {};
        try {
            body = await context.request.json();
        } catch (_) {}

        const paymentMethod = body.paymentMethod || 'PayPal';
        const transactionId = body.transactionId || null;

        const insforgeUrl = context.env.NEXT_PUBLIC_INSFORGE_URL || 'https://e8rw998g.us-east.insforge.app';
        const insforgeKey = context.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50';

        const queryParam = `order_number=eq.${encodeURIComponent(id)}`;
        const patchPayload = {
            is_quote: false,
            status: 'pending_review',
            payment_status: 'paid',
            payment_method: paymentMethod,
            updated_at: new Date().toISOString()
        };
        if (transactionId) patchPayload.transaction_id = transactionId;

        const res = await fetch(`${insforgeUrl}/api/database/records/orders?${queryParam}`, {
            method: 'PATCH',
            headers: {
                'apikey': insforgeKey,
                'Authorization': `Bearer ${insforgeKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(patchPayload)
        });

        const data = await res.json().catch(() => null);

        return new Response(JSON.stringify({
            success: true,
            message: 'Quote converted to active order successfully',
            data
        }), {
            status: 200,
            headers: corsHeaders()
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: `Failed to convert quote: ${err.message}`
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
