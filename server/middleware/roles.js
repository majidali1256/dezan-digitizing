/**
 * Role-Based Access Control (RBAC) Middleware
 */
const { forbidden } = require('../utils/apiResponse');

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return forbidden(res, 'Authentication required');
        }

        if (!allowedRoles.includes(req.user.role)) {
            return forbidden(
                res, 
                `Access forbidden: requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
            );
        }

        next();
    };
};

const requireAdmin = requireRole('admin');
const requireDigitizer = requireRole('digitizer', 'admin');
const requireClient = requireRole('client', 'admin');

module.exports = {
    requireRole,
    requireAdmin,
    requireDigitizer,
    requireClient
};
