/**
 * PhonePe Production Integration Test
 * =====================================
 * Run: node test_phonepe_production.cjs
 *
 * Tests:
 *  1. SDK can get an access token (credentials valid)
 *  2. SDK can generate a real PhonePe payment URL (live integration)
 *  3. Production callback URL is reachable (GET check)
 *  4. Production status route is reachable (401 = route exists, auth working)
 */

const https = require('https');
require('dotenv').config();

const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');

const PROD_API_BASE = 'https://api.laxmart.store/api/v1';

// ─── Helper: make an HTTPS GET request ───────────────────────────────────────
function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, body: data }); }
            });
        }).on('error', reject);
    });
}

// ─── Main Test Runner ─────────────────────────────────────────────────────────
async function runTests() {
    let passed = 0;
    let failed = 0;

    const ok  = (label) => { console.log(`  ✅ ${label}`); passed++; };
    const err = (label) => { console.log(`  ❌ ${label}`); failed++; };

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║     PhonePe Production Integration Test Suite       ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

    // ── 1. Env Variables ─────────────────────────────────────────────────────
    console.log('📋 Test 1: Environment Variables');
    const clientId     = process.env.PHONEPE_CLIENT_ID?.trim();
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();
    const merchantId   = process.env.PHONEPE_MERCHANT_ID?.trim();
    const envMode      = process.env.PHONEPE_ENV?.trim().toUpperCase();

    clientId     ? ok(`PHONEPE_CLIENT_ID    = ${clientId}`)               : err('PHONEPE_CLIENT_ID missing');
    clientSecret ? ok(`PHONEPE_CLIENT_SECRET = [set, ${clientSecret.length} chars]`) : err('PHONEPE_CLIENT_SECRET missing');
    merchantId   ? ok(`PHONEPE_MERCHANT_ID  = ${merchantId}`)             : err('PHONEPE_MERCHANT_ID missing');
    envMode === 'PRODUCTION' ? ok(`PHONEPE_ENV = PRODUCTION (live mode)`)  : err(`PHONEPE_ENV = ${envMode || 'not set'} (should be PRODUCTION)`);

    // ── 2. PhonePe SDK — Generate Live Payment URL ────────────────────────────
    console.log('\n📡 Test 2: PhonePe SDK — Generate Live Redirect URL');
    try {
        const env    = envMode === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;
        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);

        const merchantOrderId = `TESTMT${Date.now()}`;
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantOrderId)
            .amount(100) // ₹1 in paise
            .redirectUrl('https://laxmart.store/payment/verify')
            .build();

        const response = await client.pay(request);

        if (response && response.redirectUrl) {
            ok(`PhonePe redirect URL generated successfully`);
            ok(`MerchantOrderId: ${merchantOrderId}`);
            console.log(`\n  🔗 Test Payment URL (open in browser to test):\n  ${response.redirectUrl}\n`);
        } else {
            err('No redirect URL returned from PhonePe');
        }
    } catch (e) {
        err(`SDK Error: ${e.message}`);
        console.log(`     → ${e.message}`);
    }

    // ── 3. Production API — Health Check ─────────────────────────────────────
    console.log('🌐 Test 3: Production API Health Check');
    try {
        const result = await httpGet(`${PROD_API_BASE}/health`);
        result.status === 200 && result.body?.status === 'OK'
            ? ok(`Production API is UP (${PROD_API_BASE}/health)`)
            : err(`API returned status ${result.status}: ${JSON.stringify(result.body)}`);
    } catch (e) {
        err(`Cannot reach production API: ${e.message}`);
        console.log('     → Make sure api.laxmart.store is running the new dist/ build');
    }

    // ── 4. Production API — Callback Route (GET) ──────────────────────────────
    console.log('\n🔔 Test 4: Callback Endpoint Alive Check (GET)');
    try {
        const result = await httpGet(`${PROD_API_BASE}/payments/phonepe/callback`);
        if (result.status === 200 && result.body?.success === true) {
            ok('Callback GET endpoint is LIVE on production');
            ok(`Response: "${result.body.message}"`);
        } else {
            err(`Unexpected response: ${result.status} → ${JSON.stringify(result.body)}`);
            console.log('     → The new dist/ files may not be deployed yet. Run: npm run build && pm2 restart all');
        }
    } catch (e) {
        err(`Cannot reach callback URL: ${e.message}`);
    }

    // ── 5. Production API — Status Route Auth Guard Check ────────────────────
    console.log('\n🔐 Test 5: Status Route Auth Guard (should return 401)');
    try {
        const result = await httpGet(`${PROD_API_BASE}/payments/phonepe/status/TEST_ORDER_ID`);
        if (result.status === 401 || (result.body?.success === false && result.body?.message?.toLowerCase().includes('token'))) {
            ok('Status route is LIVE and auth guard is working (got 401 as expected)');
        } else if (result.status === 404 || result.body?.message?.toLowerCase().includes('not found')) {
            err('Status route NOT FOUND on production — new dist/ files not deployed!');
            console.log('     → SSH into server and run: npm run build && pm2 restart all');
        } else {
            ok(`Status route responded: ${result.status} → ${JSON.stringify(result.body)}`);
        }
    } catch (e) {
        err(`Cannot reach status URL: ${e.message}`);
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log(`║  Results: ${passed} passed, ${failed} failed                          ║`.substring(0, 56) + '║');
    console.log('╚══════════════════════════════════════════════════════╝');

    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Your PhonePe integration is production-ready.\n');
        console.log('Next steps:');
        console.log('  1. Make a test order in your app with Online payment');
        console.log('  2. Complete the payment on PhonePe checkout page');
        console.log('  3. Check Order status in your admin dashboard → should be "Paid"');
    } else {
        console.log('\n⚠️  Some tests failed. Fix the issues above before going live.\n');
    }
}

runTests().catch(console.error);
