/**
 * Dezan Digitizing — Production Express.js Backend Server
 * Architecture: REST API with PostgreSQL (InsForge), JWT Auth, RBAC, and S3 Storage Sync
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const { testConnection, pool } = require('./config/db');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const taskRoutes = require('./routes/taskRoutes');
const revisionRoutes = require('./routes/revisionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Middleware imports
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Security & Core Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allows CDN scripts, PayPal SDK, and Google fonts
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: config.cors.origin,
    credentials: true
}));

if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
}

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 2. Static File Serving (Standalone server mode only; Vercel serves static files at edge)
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const rootDir = path.resolve(__dirname, '..');
    const uploadsDir = path.resolve(rootDir, 'uploads');
    app.use('/uploads', express.static(uploadsDir));

    // Clean Vanity Tracking Routes
    const cleanRoutes = [
        { path: '/tiktok', file: 'tiktok.html' },
        { path: '/instagram', file: 'instagram.html' },
        { path: '/facebook', file: 'facebook.html' },
        { path: '/fb', file: 'fb.html' },
        { path: '/ig', file: 'ig.html' },
        { path: '/youtube', file: 'youtube.html' },
        { path: '/yt', file: 'yt.html' },
        { path: '/pinterest', file: 'pinterest.html' }
    ];
    cleanRoutes.forEach(r => {
        app.get(r.path, (req, res) => res.sendFile(path.join(rootDir, r.file)));
    });

    app.use(express.static(rootDir));
}


// 3. API Routes Mount
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/revisions', revisionRoutes);
app.use('/api/upload', uploadRoutes);

// Root API discovery endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'Dezan Digitizing REST API',
        version: '1.0.0',
        environment: config.nodeEnv,
        endpoints: {
            health: '/api/health',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                profile: 'PUT /api/auth/profile',
                changePassword: 'POST /api/auth/change-password'
            },
            orders: {
                create: 'POST /api/orders',
                list: 'GET /api/orders',
                get: 'GET /api/orders/:id',
                status: 'PUT /api/orders/:id/status',
                assign: 'POST /api/orders/:id/assign',
                payment: 'POST /api/orders/:id/payment'
            },
            quotes: {
                request: 'POST /api/quotes',
                list: 'GET /api/quotes',
                price: 'PUT /api/quotes/:id/price',
                convert: 'POST /api/quotes/:id/convert'
            },
            tasks: {
                list: 'GET /api/tasks (Worker Sanitized Queue)',
                get: 'GET /api/tasks/:id',
                status: 'PUT /api/tasks/:id/status',
                deliverables: 'POST /api/tasks/:id/deliverables'
            },
            revisions: {
                submit: 'POST /api/revisions'
            },
            upload: {
                single: 'POST /api/upload/single',
                multiple: 'POST /api/upload/multiple'
            }
        }
    });
});

// 4. Catch-all fallback for SPA / HTML navigation
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return notFoundHandler(req, res, next);
    }
    next();
});

// 5. Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// 6. Server Initialization
let server = null;

const startServer = async () => {
    try {
        console.log('--- Initializing Dezan Digitizing Backend ---');
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('[Warning]: Database connection failed on startup. Will retry on request.');
        }

        server = app.listen(config.port, () => {
            console.log(`[Dezan Server Live] Port: ${config.port} | Mode: ${config.nodeEnv}`);
            console.log(`[REST API Root] http://localhost:${config.port}/api`);
            console.log(`[Health Endpoint] http://localhost:${config.port}/api/health`);
        });

        return server;
    } catch (err) {
        console.error('[Server Startup Fatal Error]:', err);
        process.exit(1);
    }
};

// Graceful Shutdown
const shutdown = () => {
    console.log('\n[Graceful Shutdown Initiated]');
    if (server) {
        server.close(async () => {
            console.log('[HTTP Server Closed]');
            try {
                await pool.end();
                console.log('[Database Pool Drained]');
            } catch (err) {
                console.error('[DB Close Error]:', err.message);
            }
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Auto-start if executed directly
if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    startServer
};
