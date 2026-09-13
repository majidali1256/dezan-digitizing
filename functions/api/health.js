/**
 * Cloudflare Pages Function: /api/health
 * Edge health check endpoint
 */

export async function onRequestGet(context) {
    const { request } = context;
    const colo = request.cf?.colo || 'edge';

    const healthData = {
        status: 'ok',
        platform: 'Cloudflare Pages Functions',
        colo,
        timestamp: new Date().toISOString(),
        nodeEnv: context.env?.NODE_ENV || 'production',
        services: {
            insforge: 'connected',
            paypal: context.env?.PAYPAL_CLIENT_ID ? 'configured' : 'missing_keys'
        }
    };

    return new Response(JSON.stringify(healthData, null, 2), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, max-age=0'
        }
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}
