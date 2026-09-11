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
        connectionString: process.env.DATABASE_URL || 
            'postgresql://postgres:a6fa65ff1e2acbae2971ff270e563972@e8rw998g.us-east.database.insforge.app:5432/insforge?sslmode=require',
        ssl: {
            rejectUnauthorized: false
        }
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'dezan_digitizing_jwt_secret_token_secure_key_2026',
        expiresIn: process.env.JWT_EXPIRES_IN || '365d'
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
        artworksDir: (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
            ? '/tmp/uploads/artworks'
            : path.resolve(__dirname, '../../uploads/artworks'),
        deliverablesDir: (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
            ? '/tmp/uploads/deliverables'
            : path.resolve(__dirname, '../../uploads/deliverables')
    }
};


module.exports = config;
