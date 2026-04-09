/**
 * Quick Production Sanity Check
 * Run: node quick_check.cjs
 */

const https = require('https');
require('dotenv').config();

const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');

function httpGet(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        }).on('error', (e) => resolve({ status: 0, body: e.message }));
    });
}

async function check() {
    console.log('\n🔍 Quick Production Check\n');

    // 1. Check /payment/create exists on production (should return 401 not 404)
    const r1 = await httpGet('https://api.laxmart.store/api/v1/payment/create');
    if (r1.status === 404) {
        console.log('❌ Step 1 FAILED: Server not restarted yet');
        console.log('   → SSH mein jao aur: git pull && npm run build && pm2 restart all');
    } else {
        console.log('✅ Step 1 PASSED: Server has payment routes');
    }

    // 2. Check PhonePe V2 credentials work
    const clientId = process.env.PHONEPE_CLIENT_ID?.trim();
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();
    const env = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

    try {
        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(`CHECK${Date.now()}`)
            .amount(100)
            .redirectUrl('https://laxmart.store/payment/verify')
            .build();
        const response = await client.pay(request);

        if (response?.redirectUrl) {
            console.log('✅ Step 2 PASSED: PhonePe V2 credentials valid!');
            console.log('   → Payment URL bana sakta hai');
            console.log('\n🎉 Dono checks pass! Ab payment honge.\n');
        } else {
            console.log('❌ Step 2 FAILED: No redirect URL returned');
        }
    } catch (e) {
        if (e.message?.includes('Client Not Found')) {
            console.log('❌ Step 2 FAILED: PhonePe V2 credentials galat hain (OIM007)');
            console.log('   → PhonePe dashboard se nayi V2 OAuth keys lo aur .env update karo');
        } else {
            console.log(`❌ Step 2 FAILED: ${e.message}`);
        }
    }
}

check().catch(console.error);
