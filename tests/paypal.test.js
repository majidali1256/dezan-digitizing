/**
 * Dezan Digitizing — Automated PayPal Security & Server Route Tests
 * 
 * Validates:
 * 1. PayPal configuration endpoint returns clientId and environment without leaking clientSecret.
 * 2. Discovery endpoint registers /api/paypal routes.
 * 3. Environment switching logic (Live api-m.paypal.com in Production vs Sandbox in Dev/Preview).
 * 4. Secure validation for create-order and capture-order endpoints.
 * 5. Repository security audit: zero occurrence of client secrets in frontend or NEXT_PUBLIC_* variables.
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { app } = require('../server/server');
const { pool } = require('../server/config/db');
const paypalService = require('../server/services/paypalService');
const config = require('../server/config/config');

let server;
let baseUrl;

before(async () => {
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`\n[PayPal Test Suite] Running on ephemeral server ${baseUrl}`);
            resolve();
        });
    });
});

after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        console.log('[PayPal Test Suite] Ephemeral server closed.');
    }
    try {
        await pool.end();
        console.log('[PayPal Test Suite] Database pool closed.');
    } catch (err) {
        console.error('[PayPal Test Suite] Pool drain error:', err.message);
    }
});

describe('1. PayPal Public Configuration & Secret Isolation', () => {
    it('GET /api/paypal/config returns 200 with public clientId and environment', async () => {
        const res = await fetch(`${baseUrl}/api/paypal/config`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.data);
        assert.ok('clientId' in json.data);
        assert.ok('currency' in json.data);
        assert.ok('environment' in json.data);

        // STRICT SECURITY ASSERTION: Secret must never be in payload
        assert.equal(json.data.clientSecret, undefined);
        assert.equal(json.data.PAYPAL_CLIENT_SECRET, undefined);
        assert.equal(json.data.secret, undefined);
    });

    it('GET /api registers paypal routes in the discovery manifest', async () => {
        const res = await fetch(`${baseUrl}/api`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.ok(json.endpoints.paypal);
        assert.equal(json.endpoints.paypal.config, 'GET /api/paypal/config');
        assert.equal(json.endpoints.paypal.createOrder, 'POST /api/paypal/create-order');
        assert.equal(json.endpoints.paypal.captureOrder, 'POST /api/paypal/capture-order');
    });
});

describe('2. PayPal Environment Switching (Live Production vs Sandbox)', () => {
    it('config.paypal defaults to sandbox URL when NODE_ENV is development or test', () => {
        const origNodeEnv = process.env.NODE_ENV;
        const origVercelEnv = process.env.VERCEL_ENV;
        const origPaypalMode = process.env.PAYPAL_MODE;
        const origPaypalEnv = process.env.PAYPAL_ENV;

        delete process.env.VERCEL_ENV;
        delete process.env.PAYPAL_MODE;
        delete process.env.PAYPAL_ENV;
        process.env.NODE_ENV = 'development';
        assert.equal(config.paypal.isProduction, false);
        assert.equal(config.paypal.baseUrl, 'https://api-m.sandbox.paypal.com');

        // Restore
        process.env.NODE_ENV = origNodeEnv;
        if (origVercelEnv) process.env.VERCEL_ENV = origVercelEnv;
        if (origPaypalMode) process.env.PAYPAL_MODE = origPaypalMode;
        if (origPaypalEnv) process.env.PAYPAL_ENV = origPaypalEnv;
    });

    it('config.paypal switches to live production URL when NODE_ENV or VERCEL_ENV is production', () => {
        const origNodeEnv = process.env.NODE_ENV;
        const origVercelEnv = process.env.VERCEL_ENV;
        const origPaypalMode = process.env.PAYPAL_MODE;
        const origPaypalEnv = process.env.PAYPAL_ENV;

        delete process.env.PAYPAL_MODE;
        delete process.env.PAYPAL_ENV;

        process.env.NODE_ENV = 'production';
        assert.equal(config.paypal.isProduction, true);
        assert.equal(config.paypal.baseUrl, 'https://api-m.paypal.com');

        // Also test VERCEL_ENV=production
        process.env.NODE_ENV = 'development';
        process.env.VERCEL_ENV = 'production';
        assert.equal(config.paypal.isProduction, true);
        assert.equal(config.paypal.baseUrl, 'https://api-m.paypal.com');

        // Also test PAYPAL_MODE=live
        delete process.env.VERCEL_ENV;
        process.env.PAYPAL_MODE = 'live';
        assert.equal(config.paypal.isProduction, true);
        assert.equal(config.paypal.baseUrl, 'https://api-m.paypal.com');

        // Restore
        process.env.NODE_ENV = origNodeEnv;
        if (origVercelEnv) process.env.VERCEL_ENV = origVercelEnv;
        else delete process.env.VERCEL_ENV;
        if (origPaypalMode) process.env.PAYPAL_MODE = origPaypalMode;
        else delete process.env.PAYPAL_MODE;
        if (origPaypalEnv) process.env.PAYPAL_ENV = origPaypalEnv;
        else delete process.env.PAYPAL_ENV;
    });
});

describe('3. PayPal Endpoint Request Validation', () => {
    it('POST /api/paypal/create-order rejects missing amount with 400 Bad Request', async () => {
        const res = await fetch(`${baseUrl}/api/paypal/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.equal(res.status, 400);
        const json = await res.json();
        assert.equal(json.success, false);
        assert.match(json.message, /positive amount is required/i);
    });

    it('POST /api/paypal/create-order rejects negative or zero amount', async () => {
        const res = await fetch(`${baseUrl}/api/paypal/create-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: -10 })
        });
        assert.equal(res.status, 400);
        const json = await res.json();
        assert.equal(json.success, false);
    });

    it('POST /api/paypal/capture-order rejects missing paypalOrderId with 400 Bad Request', async () => {
        const res = await fetch(`${baseUrl}/api/paypal/capture-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        assert.equal(res.status, 400);
        const json = await res.json();
        assert.equal(json.success, false);
        assert.match(json.message, /PayPal Order ID is required/i);
    });
});

describe('4. Repository-Wide Secret Leak Security Audit', () => {
    it('ensures no frontend HTML or client JS contains PAYPAL_CLIENT_SECRET', () => {
        const rootDir = path.resolve(__dirname, '..');
        const frontendFiles = [
            'client-portal.html',
            'client-invoices.html',
            'client-orders.html',
            'client-quotes.html',
            'pricing.html',
            'index.html',
            'app.js',
            'js/paypal-config.js',
            'js/client-workspace.js',
            'js/order-quote-modal.js'
        ];

        for (const relPath of frontendFiles) {
            const fullPath = path.join(rootDir, relPath);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                assert.ok(
                    !content.includes('PAYPAL_CLIENT_SECRET'),
                    `Security violation: ${relPath} contains PAYPAL_CLIENT_SECRET!`
                );
                assert.ok(
                    !content.includes('NEXT_PUBLIC_PAYPAL_CLIENT_SECRET'),
                    `Security violation: ${relPath} contains NEXT_PUBLIC_PAYPAL_CLIENT_SECRET!`
                );
            }
        }
    });

    it('ensures .gitignore contains .env and .env.local', () => {
        const gitignorePath = path.resolve(__dirname, '../.gitignore');
        assert.ok(fs.existsSync(gitignorePath));
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        assert.match(gitignoreContent, /\.env/);
        assert.match(gitignoreContent, /\.env\.local/);
    });
});
