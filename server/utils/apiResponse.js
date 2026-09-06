/**
 * Standardized API Response Utilities
 */

const success = (res, data = null, message = 'Success', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data
    };
    if (meta) {
        response.meta = meta;
    }
    return res.status(statusCode).json(response);
};

const error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message
    };
    if (errors) {
        response.errors = errors;
    }
    return res.status(statusCode).json(response);
};

const unauthorized = (res, message = 'Authentication required') => {
    return error(res, message, 401);
};

const forbidden = (res, message = 'Access denied: insufficient permissions') => {
    return error(res, message, 403);
};

const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};

const badRequest = (res, message = 'Invalid request parameters', errors = null) => {
    return error(res, message, 400, errors);
};

module.exports = {
    success,
    error,
    unauthorized,
    forbidden,
    notFound,
    badRequest
};
