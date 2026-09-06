/**
 * Centralized Error Handling Middleware
 */
const { error, notFound } = require('../utils/apiResponse');
const config = require('../config/config');

const notFoundHandler = (req, res, next) => {
    return notFound(res, `Route not found: ${req.method} ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
    console.error(`[Error ${req.method} ${req.originalUrl}]:`, err.message);

    // Multer upload errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return error(res, `File too large. Maximum size allowed is ${config.uploads.maxFileSize / (1024 * 1024)}MB`, 400);
        }
        return error(res, `Upload error: ${err.message}`, 400);
    }

    // Custom or DB validation errors
    if (err.message && err.message.includes('Unsupported file type')) {
        return error(res, err.message, 400);
    }

    const statusCode = err.statusCode || 500;
    const message = err.isOperational ? err.message : (config.nodeEnv === 'production' ? 'Internal server error' : err.message);

    return error(res, message, statusCode, config.nodeEnv === 'development' ? { stack: err.stack } : null);
};

module.exports = {
    notFoundHandler,
    errorHandler
};
