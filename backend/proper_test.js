const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('@phonepe-pg/pg-sdk-node');
const crypto = require('crypto');
require('dotenv').config();

// Simulation script for Live Production Test
const runProperTest = async () => {
    const clientId = process.env.PHONEPE_CLIENT_ID?.trim();
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET?.trim();
    const env = process.env.PHONEPE_ENV?.trim().toUpperCase() === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

    try {
        console.log('--- 🧪 PROPER END-TO-END TEST STARTING ---');
        console.log('Mode:', env === Env.PRODUCTION ? 'PRODUCTION (LIVE)' : 'SANDBOX');
        console.log('Merchant ID:', process.env.PHONEPE_MERCHANT_ID);

        const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);

        const merchantTransactionId = `TEST_${Date.now()}`;
        const request = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(100) // 1 INR in Paise
            .redirectUrl('https://laxmart.store/payment/verify')
            .build();

        console.log('Initiating PhonePe SDK pay()...');
        const response = await client.pay(request);

        if (response && response.redirectUrl) {
            console.log('✅ TEST SUCCESSFUL!');
            console.log('Redirect URL Generated:', response.redirectUrl);
            console.log('\n--- 🎯 RESULT ---');
            console.log('Aapka setup bilkul sahi hai. PhonePe ne live payment URL successfully generate kar diya hai.');
        } else {
            console.log('❌ TEST FAILED: No redirect URL returned.');
        }

    } catch (error) {
        console.error('❌ TEST FAILED WITH ERROR:', error.message);
        if (error.response) {
            console.error('Detailed Error:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

runProperTest();
