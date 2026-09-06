/**
 * System Health & Diagnostics Controller
 */
const { query } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const checkHealth = async (req, res) => {
    const startTime = Date.now();
    try {
        const dbResult = await query('SELECT NOW() as now, count(*) as profiles_count FROM public.profiles');
        const ordersResult = await query('SELECT count(*) as orders_count FROM public.orders');
        const latencyMs = Date.now() - startTime;

        return success(res, {
            status: 'healthy',
            environment: process.env.NODE_ENV || 'development',
            database: {
                connected: true,
                latencyMs,
                serverTime: dbResult.rows[0].now,
                totalProfiles: parseInt(dbResult.rows[0].profiles_count, 10),
                totalOrders: parseInt(ordersResult.rows[0].orders_count, 10)
            },
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage()
        }, 'System is fully operational');
    } catch (err) {
        return error(res, `System unhealthy: ${err.message}`, 503);
    }
};

module.exports = {
    checkHealth
};
