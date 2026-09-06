/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { query } = require('../config/db');
const { unauthorized, forbidden } = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
    try {
        let token = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return unauthorized(res, 'Authentication token missing');
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.jwt.secret);
        } catch (jwtErr) {
            return unauthorized(res, 'Invalid or expired authentication token');
        }

        // Fetch current user from database
        const userResult = await query(
            'SELECT id, role, email, display_name, company, phone, status, machinery_preferences, default_fabric, default_turnaround FROM public.profiles WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return unauthorized(res, 'User account not found');
        }

        const user = userResult.rows[0];
        if (user.status === 'suspended') {
            return forbidden(res, 'Your account has been suspended');
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('[Auth Middleware Error]:', err);
        return unauthorized(res, 'Authentication failed');
    }
};

/**
 * Optional Authentication Middleware
 * If token present, attaches user; if not, proceeds as guest
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, config.jwt.secret);
                const userResult = await query(
                    'SELECT id, role, email, display_name, company, phone, status FROM public.profiles WHERE id = $1',
                    [decoded.id]
                );
                if (userResult.rows.length > 0 && userResult.rows[0].status !== 'suspended') {
                    req.user = userResult.rows[0];
                }
            } catch (ignored) {
                // guest fallback
            }
        }
        next();
    } catch (err) {
        next();
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
