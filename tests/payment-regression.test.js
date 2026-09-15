const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loader(fetch) {
    const scripts = new Map();
    const timers = new Map();
    let timerId = 0;
    const context = {
        window: { location: { hostname: 'example.com' } }, fetch, AbortController,
        setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
        clearTimeout(id) { timers.delete(id); },
        document: {
            getElementById(id) { return scripts.get(id); },
            createElement() { return { remove() { scripts.delete(this.id); } }; },
            head: { appendChild(script) { scripts.set(script.id, script); } }
        }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/paypal-config.js'), 'utf8'), context);
    return { config: context.window.PayPalConfig, context, scripts, timers };
}
const publicConfig = async () => ({ ok: true, json: async () => ({ success: true, data: { clientId: 'test-id', currency: 'USD', environment: 'sandbox' } }) });
const flush = () => new Promise(resolve => setImmediate(resolve));

test('concurrent SDK callers share config fetch; a failed script is removed and retry loads a fresh script', async () => {
    let calls = 0;
    const { config, context, scripts, timers } = loader(async () => { calls++; return publicConfig(); });
    const first = config.loadSdk();
    assert.equal(config.loadSdk(), first);
    await flush();
    const script = scripts.get('dezan-paypal-sdk');
    const rejected = assert.rejects(first, /Unable to connect/);
    script.onerror();
    await rejected;
    assert.equal(scripts.size, 0);
    const second = config.loadSdk();
    await flush();
    assert.notEqual(scripts.get('dezan-paypal-sdk'), script);
    context.window.paypal = { Buttons() {} };
    scripts.get('dezan-paypal-sdk').onload();
    assert.equal(await second, context.window.paypal);
    assert.equal(calls, 2);
    assert.equal(timers.size, 0);
    assert.equal(config.isLoading, false);
});

test('missing payment API fails without loading a hardcoded merchant or sandbox SDK', async () => {
    const { config, scripts, timers } = loader(async () => ({ ok: false, status: 404 }));
    await assert.rejects(config.loadSdk(), /Payment service is unavailable/);
    assert.equal(scripts.size, 0);
    assert.equal(timers.size, 0);
});

test('SDK timeout removes stale script and allows recovery', async () => {
    const { config, scripts, timers } = loader(publicConfig);
    const pending = config.loadSdk();
    await flush();
    const rejected = assert.rejects(pending, /timed out/);
    [...timers.values()][0]();
    await rejected;
    assert.equal(scripts.size, 0);
    assert.equal(config._loadPromise, null);
});

// Load the edge ESM graph without changing the Express application's CommonJS package.
function edgeModule(filename) {
    const source = fs.readFileSync(filename, 'utf8').replace(/from '(\.[^']+)'/g, (_, relative) => {
        return `from '${edgeModule(path.resolve(path.dirname(filename), relative))}'`;
    });
    return 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}

test('Workers routes payment config, validation, preflight, and static assets', async () => {
    const { default: worker } = await import(edgeModule(path.join(__dirname, '../payment-worker.mjs')));
    const env = { PAYPAL_CLIENT_ID: 'public-test-id', PAYPAL_CLIENT_SECRET: 'private-test-secret', PAYPAL_MODE: 'live', ASSETS: { fetch: async () => new Response('hero unchanged') } };
    const config = await worker.fetch(new Request('https://example.com/api/paypal/config'), env);
    assert.equal(config.status, 200);
    const json = await config.json();
    assert.equal(json.data.clientId, 'public-test-id');
    assert.equal(json.data.environment, 'production');
    assert.equal(JSON.stringify(json).includes('private-test-secret'), false);
    assert.equal((await worker.fetch(new Request('https://example.com/api/paypal/config'), {})).status, 503);
    for (const route of ['create-order', 'capture-order']) {
        const res = await worker.fetch(new Request(`https://example.com/api/paypal/${route}`, { method: 'POST', body: '{}' }), env);
        assert.equal(res.status, 400);
    }
    assert.equal((await worker.fetch(new Request('https://example.com/api/paypal/config', { method: 'OPTIONS' }), env)).status, 204);
    const health = await worker.fetch(new Request('https://example.com/api/health'), env);
    assert.equal(health.status, 200);
    const trackMissing = await worker.fetch(new Request('https://example.com/api/orders/track'), env);
    assert.equal(trackMissing.status, 400);
    assert.equal(await (await worker.fetch(new Request('https://example.com/'), env)).text(), 'hero unchanged');
});

test('Workers never report a pending capture as paid', async () => {
    const { default: worker } = await import(edgeModule(path.join(__dirname, '../payment-worker.mjs')));
    const originalFetch = global.fetch;
    try {
        global.fetch = async (url) => {
            if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'test-token' });
            return Response.json({ status: 'COMPLETED', purchase_units: [{ payments: { captures: [{ id: 'capture-test', status: 'PENDING' }] } }] });
        };
        const response = await worker.fetch(new Request('https://example.com/api/paypal/capture-order', {
            method: 'POST', body: JSON.stringify({ paypalOrderId: 'test-order' })
        }), { PAYPAL_CLIENT_ID: 'test-id', PAYPAL_CLIENT_SECRET: 'test-secret' });
        assert.equal(response.status, 409);
        assert.equal((await response.json()).success, false);
    } finally {
        global.fetch = originalFetch;
    }
});
