/**
 * Cloudflare Pages Function: GET /api/orders/track
 * Public Order Tracking endpoint querying InsForge REST API
 */

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };
}

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const orderNumber = url.searchParams.get('orderNumber');
        const email = url.searchParams.get('email');

        if (!orderNumber || !email) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Both orderNumber and email are required to track an order.'
            }), {
                status: 400,
                headers: corsHeaders()
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedOrderNumber = orderNumber.trim();

        const insforgeUrl = context.env.NEXT_PUBLIC_INSFORGE_URL || 'https://e8rw998g.us-east.insforge.app';
        const insforgeKey = context.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || 'anon_a03544f925bc8c2e24164c92d6ee1a411c1226559f6dbcce44e28e8c5f1a1a50';

        const fetchRes = await fetch(`${insforgeUrl}/api/database/records/orders?order_number=eq.${encodeURIComponent(trimmedOrderNumber)}`, {
            headers: {
                'apikey': insforgeKey,
                'Authorization': `Bearer ${insforgeKey}`
            }
        });

        if (!fetchRes.ok) {
            return new Response(JSON.stringify({
                success: false,
                message: 'Failed to communicate with atelier database.'
            }), {
                status: 502,
                headers: corsHeaders()
            });
        }

        const orders = await fetchRes.json();
        if (!Array.isArray(orders) || orders.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: 'No order found matching this order number and email. Please check your credentials.'
            }), {
                status: 404,
                headers: corsHeaders()
            });
        }

        const order = orders[0];
        const clientEmail = (order.client_email || order.customer_email || '').trim().toLowerCase();

        if (clientEmail !== normalizedEmail) {
            return new Response(JSON.stringify({
                success: false,
                message: 'The email provided does not match the record on file for this order.'
            }), {
                status: 403,
                headers: corsHeaders()
            });
        }

        // Map status to 4-stage stepper
        let step = 1;
        let stepLabel = 'Order Received & Spec Review';
        let stepDescription = 'Your artwork and specifications are being verified by our technical embroidery staff.';

        if (order.status === 'assigned') {
            step = 2;
            stepLabel = 'Assigned to Master Digitizer';
            stepDescription = 'A dedicated embroidery digitizer is mapping stitch angles, underlay density, and pull compensation.';
        } else if (['in_progress', 'qa_review', 'revision_requested'].includes(order.status)) {
            step = 3;
            stepLabel = 'Production Sew-Out & QA';
            stepDescription = order.status === 'revision_requested'
                ? 'Your requested stitch revision is currently being modified and re-sampled.'
                : 'Digitizing is underway and undergoing machine sew-out quality control.';
        } else if (order.status === 'completed') {
            step = 4;
            stepLabel = 'Production Ready & Approved';
            stepDescription = 'Your production embroidery stitch files and approval previews are ready for download below.';
        }

        return new Response(JSON.stringify({
            success: true,
            data: {
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    project_name: order.project_name || order.design_name,
                    service_type: order.service_type,
                    status: order.status,
                    payment_status: order.payment_status,
                    created_at: order.created_at,
                    delivery_date: order.delivery_date || order.due_date,
                    deliverable_files: order.deliverable_files || []
                },
                tracking: {
                    step,
                    stepLabel,
                    stepDescription
                }
            }
        }), {
            status: 200,
            headers: corsHeaders()
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            message: `Internal error while tracking order: ${err.message}`
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
