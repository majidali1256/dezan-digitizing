import { onRequestGet } from './functions/api/paypal/config.js';
import { onRequestPost as createOrder } from './functions/api/paypal/create-order.js';
import { onRequestPost as captureOrder } from './functions/api/paypal/capture-order.js';
import { corsHeaders } from './functions/api/paypal/_paypalHelper.js';

// Workers does not automatically discover Pages Functions in /functions.
export default {
    async fetch(request, env) {
        const pathname = new URL(request.url).pathname;
        if (!pathname.startsWith('/api/paypal/')) return env.ASSETS.fetch(request);
        const routes = {
            '/api/paypal/config': { GET: onRequestGet },
            '/api/paypal/create-order': { POST: createOrder },
            '/api/paypal/capture-order': { POST: captureOrder }
        };
        const route = routes[pathname];
        if (route && request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }
        const handler = route?.[request.method];
        if (!handler) return Response.json({ success: false, message: route ? 'Method not allowed' : 'Payment route not found' }, {
            status: route ? 405 : 404, headers: corsHeaders()
        });
        return handler({ request, env });
    }
};
