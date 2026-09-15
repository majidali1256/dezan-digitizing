/**
 * Server Configuration Module
 * Loads and validates environment configurations
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });
require('dotenv').config();

const config = {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
    db: {
        connectionString: process.env.DATABASE_URL || '',
        ssl: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev_jwt_secret_change_in_production'),
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*'
    },
    uploads: {
        maxFileSize: 50 * 1024 * 1024, // 50 MB
        allowedExtensions: [
            '.png', '.jpg', '.jpeg', '.webp', '.pdf', '.ai', '.eps', '.svg', 
            '.dst', '.emb', '.pxf', '.pes', '.exp', '.cnd', '.jef', '.vp3', '.ofm', '.xxx', '.hus',
            '.zip', '.rar'
        ],
        artworksDir: process.env.AWS_LAMBDA_FUNCTION_NAME
            ? '/tmp/uploads/artworks'
            : path.resolve(__dirname, '../../uploads/artworks'),
        deliverablesDir: process.env.AWS_LAMBDA_FUNCTION_NAME
            ? '/tmp/uploads/deliverables'
            : path.resolve(__dirname, '../../uploads/deliverables')
    },
    email: {
        adminEmail: process.env.ADMIN_EMAIL || 'fdezan91@gmail.com',
        fromAddress: process.env.SMTP_FROM || `"Dezan Digitizing" <${process.env.SMTP_USER || 'notifications@dezandigitizing.com'}>`
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID || '',
        clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
        currency: process.env.PAYPAL_CURRENCY || 'USD',
        get isProduction() {
            if (process.env.PAYPAL_MODE === 'sandbox' || process.env.PAYPAL_ENV === 'sandbox') return false;
            if (process.env.PAYPAL_MODE === 'live' || process.env.PAYPAL_ENV === 'live' || process.env.PAYPAL_ENV === 'production') return true;
            return process.env.NODE_ENV === 'production' || process.env.CF_PAGES === '1';
        },
        get baseUrl() {
            return this.isProduction
                ? 'https://api-m.paypal.com'
                : 'https://api-m.sandbox.paypal.com';
        }
    }
};

module.exports = config;
