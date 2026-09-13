# PayPal on Cloudflare Workers

The Workers deployment uses `wrangler.jsonc` and `payment-worker.mjs` to serve
the existing PayPal Pages handlers. Uploading static assets alone does not run
the handlers in `functions/api/paypal/`.

After approval to publish, deploy using `npx wrangler deploy` (without an
`--assets` override). The configuration keeps the site's existing static assets
and runs the Worker for `/api/paypal/*` requests only.

Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` as runtime secrets on the
`dezan-digitizing` Worker. Both must belong to the same live PayPal REST app.
Build environment variables and local `.env.local` values are not runtime
Worker secrets. Never commit credentials. `PAYPAL_MODE=live` and
`PAYPAL_CURRENCY=USD` are set in the Worker configuration; local `.dev.vars`
can override these for sandbox testing.

Verify `GET /api/paypal/config` returns JSON with HTTP 200 and the public client
ID. HTTP 503 means runtime credentials are missing. HTTP 404 means the payment
Worker routes have not been deployed. The secret must never appear in responses.

Local checks:

```sh
node --test tests/paypal.test.js tests/payment-regression.test.js
node scripts/verify_payment_init.js
node scripts/verify_payment_init.js --real-sdk
npx wrangler deploy --dry-run
```

The default browser check mocks PayPal to test failed loads, retry, and method
switching. `--real-sdk` reads only the public client ID from `.env.local` to
check actual PayPal button rendering. Neither check submits a payment.
Payment capture still needs validation with a sandbox buyer before claiming a
completed transaction has been tested.
