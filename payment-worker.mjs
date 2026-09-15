import { onRequestGet as paypalConfig } from './functions/api/paypal/config.js';
import { onRequestPost as createOrder } from './functions/api/paypal/create-order.js';
import { onRequestPost as captureOrder } from './functions/api/paypal/capture-order.js';
import { onRequestGet as healthCheck } from './functions/api/health.js';
import { onRequestGet as trackOrder } from './functions/api/orders/track.js';
import { corsHeaders } from './functions/api/paypal/_paypalHelper.js';

// Workers routing: routes edge API endpoints, fall through to static assets for all other paths
export default {
    async fetch(request, env) {
        const pathname = new URL(request.url).pathname;
        if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

        const routes = {
            '/api/paypal/config': { GET: paypalConfig },
            '/api/paypal/create-order': { POST: createOrder },
            '/api/paypal/capture-order': { POST: captureOrder },
            '/api/health': { GET: healthCheck },
            '/api/orders/track': { GET: trackOrder }
        };

        const route = routes[pathname];
        if (route && request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        const handler = route?.[request.method];
        if (!handler) {
            return Response.json({
                success: false,
                message: route ? 'Method not allowed' : 'API endpoint not found'
            }, {
                status: route ? 405 : 404,
                headers: corsHeaders()
            });
        }

        return handler({ request, env });
    }
};
