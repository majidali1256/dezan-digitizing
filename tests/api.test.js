/**
 * Dezan Digitizing — Automated API Test Suite
 * Validates: Health, Auth, RBAC, Zero-PII Worker Queue, Orders, and Quotes
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { app } = require('../server/server');
const { pool } = require('../server/config/db');

let server;
let baseUrl;
let adminToken = null;
let digitizerToken = null;

before(async () => {
    // Start ephemeral server on random free port
    await new Promise((resolve) => {
        server = http.createServer(app);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            baseUrl = `http://127.0.0.1:${port}`;
            console.log(`\n[Test Suite] Ephemeral test server running at ${baseUrl}`);
            resolve();
        });
    });
});

after(async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        console.log('[Test Suite] Ephemeral test server closed.');
    }
    try {
        await pool.end();
        console.log('[Test Suite] Database pool drained.');
    } catch (err) {
        console.error('[Test Suite] Pool drain error:', err.message);
    }
});

describe('1. System Health & Discovery', () => {
    it('GET /api/health returns 200 and operational status', async () => {
        const res = await fetch(`${baseUrl}/api/health`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.equal(json.data.status, 'healthy');
        assert.ok(json.data.database.connected);
    });

    it('GET /api returns 200 and endpoint registry', async () => {
        const res = await fetch(`${baseUrl}/api/`);
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.name, 'Dezan Digitizing REST API');
        assert.ok(json.endpoints.auth);
        assert.ok(json.endpoints.orders);
    });
});

describe('2. Authentication & RBAC', () => {
    it('Fails login with invalid credentials', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'fake@example.com', password: 'wrongpassword' })
        });
        assert.equal(res.status, 401);
    });

    it('Successfully authenticates Admin and returns JWT token', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@dezandigitizing.com',
                password: 'Wasif8899@@@'
            })
        });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.data.token, 'Token must be present');
        assert.equal(json.data.user.role, 'admin');
        adminToken = json.data.token;
    });

    it('Successfully authenticates Digitizer and returns JWT token', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'digitizer@dezandigitizing.com',
                password: 'Pakistan6677@@@'
            })
        });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.data.token, 'Token must be present');
        assert.equal(json.data.user.role, 'digitizer');
        digitizerToken = json.data.token;
    });
});

describe('3. Order Management & Access Control', () => {
    it('Blocks unauthenticated access to GET /api/orders', async () => {
        const res = await fetch(`${baseUrl}/api/orders`);
        assert.equal(res.status, 401);
    });

    it('Allows Admin to access GET /api/orders', async () => {
        assert.ok(adminToken, 'Admin token required');
        const res = await fetch(`${baseUrl}/api/orders`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(Array.isArray(json.data), 'Expected array of orders');
    });
});

describe('4. Worker Studio Queue & Zero-PII Enforcement', () => {
    it('Blocks unauthenticated access to GET /api/tasks', async () => {
        const res = await fetch(`${baseUrl}/api/tasks`);
        assert.equal(res.status, 401);
    });

    it('Allows Digitizer to fetch task queue with ZERO PII leakage', async () => {
        assert.ok(digitizerToken, 'Digitizer token required');
        const res = await fetch(`${baseUrl}/api/tasks`, {
            headers: { Authorization: `Bearer ${digitizerToken}` }
        });
        assert.equal(res.status, 200);
        const json = await res.json();
        assert.equal(json.success, true);
        const tasks = Array.isArray(json.data) ? json.data : (json.data.tasks || []);

        // Verify Zero-PII sanitization on every task in worker feed
        for (const task of tasks) {
            assert.equal(task.client_email, undefined, 'Worker task must NOT expose client_email');
            assert.equal(task.client_phone, undefined, 'Worker task must NOT expose client_phone');
            assert.equal(task.billing_address, undefined, 'Worker task must NOT expose billing_address');
            assert.equal(task.price, undefined, 'Worker task must NOT expose client order price');
        }
    });
});

describe('5. Quotes & Public Inquiries', () => {
    it('Accepts a public quote request via POST /api/quotes', async () => {
        const res = await fetch(`${baseUrl}/api/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientName: 'Automated Test Client',
                clientEmail: 'test-qa@dezandigitizing.com',
                serviceType: 'Digitizing',
                projectName: 'Test QA Embroidery Design',
                placement: 'Left Chest',
                sizing: '3.5 inches wide',
                fabricType: 'Cotton Pique',
                fileFormat: 'DST',
                instructions: 'Automated test quote request verification'
            })
        });

        assert.equal(res.status, 201);
        const json = await res.json();
        assert.equal(json.success, true);
        assert.ok(json.data.order_number, 'Quote order_number must be generated');
    });
});
