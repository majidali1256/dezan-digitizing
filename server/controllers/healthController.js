/**
 * System Health & Diagnostics Controller
 */
const { query } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const emailService = require('../services/emailService');

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
            email: {
                configured: emailService.isConfigured(),
                mode: emailService.isConfigured() ? 'live_smtp' : 'simulated_dev',
                smtpHost: process.env.SMTP_HOST || (process.env.SMTP_USER ? 'gmail' : 'none'),
                sender: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
            },
            uptimeSeconds: Math.floor(process.uptime()),
            memoryUsage: process.memoryUsage()
        }, 'System is fully operational');
    } catch (err) {
        return error(res, `System unhealthy: ${err.message}`, 503);
    }
};

const testEmail = async (req, res) => {
    try {
        const { targetEmail = process.env.ADMIN_EMAIL || 'fdezan91@gmail.com' } = req.body || {};

        if (!emailService.isConfigured()) {
            return error(res, 'SMTP credentials are not configured (SMTP_USER / SMTP_PASS missing in .env.local). Real emails cannot be sent until credentials are provided.', 400);
        }

        const result = await emailService.sendMail({
            to: targetEmail,
            subject: '🧪 Dezan Digitizing — Test Email Verification',
            html: `<h2>SMTP Verification Successful!</h2><p>Your transactional email service is working properly and sending real emails to real inboxes.</p>`,
            text: 'SMTP Verification Successful! Your transactional email service is working properly.'
        });

        return success(res, {
            target: targetEmail,
            result
        }, `Test email sent successfully to ${targetEmail}`);
    } catch (err) {
        return error(res, `Failed to send test email: ${err.message}`, 500);
    }
};

module.exports = {
    checkHealth,
    testEmail
};
