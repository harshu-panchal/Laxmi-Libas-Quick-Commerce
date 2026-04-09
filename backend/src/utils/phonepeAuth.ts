/**
 * @file phonepeAuth.ts
 * @description PhonePe OAuth2 Access Token Manager
 *
 * Handles fetching and caching of PhonePe access tokens using
 * client_credentials grant flow (Standard Checkout V2 API).
 *
 * Token endpoint: https://api.phonepe.com/apis/identity-manager/v1/oauth/token
 */

import axios from 'axios';

// ─── Config from .env ────────────────────────────────────────────────────────
const CLIENT_ID     = process.env.PHONEPE_CLIENT_ID?.trim()      || '';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET?.trim()  || '';
const BASE_URL       = (process.env.PHONEPE_BASE_URL?.trim()      || 'https://api.phonepe.com/apis/identity-manager').replace(/\/$/, '');
const TOKEN_ENDPOINT = `${BASE_URL}/v1/oauth/token`;

// ─── Token Cache (in-memory singleton) ───────────────────────────────────────
interface TokenCache {
    accessToken: string;
    expiresAt: number; // epoch ms
}

let tokenCache: TokenCache | null = null;

/**
 * Returns a valid PhonePe access token.
 * Reuses cached token if still valid (with 60s safety buffer).
 * Fetches a fresh token otherwise.
 */
export const getPhonePeAccessToken = async (): Promise<string> => {
    // ── Return cached token if still fresh ──────────────────────────────────
    const buffer = 60_000; // 60 second safety buffer
    if (tokenCache && Date.now() < tokenCache.expiresAt - buffer) {
        console.log('[PhonePeAuth] Using cached access token');
        return tokenCache.accessToken;
    }

    // ── Validate env vars before making the request ──────────────────────────
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('[PhonePeAuth] PHONEPE_CLIENT_ID or PHONEPE_CLIENT_SECRET is not set in .env');
    }

    console.log('[PhonePeAuth] Fetching new access token...');

    // ── Fetch fresh token from PhonePe identity-manager ──────────────────────
    const params = new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'client_credentials',
        client_version: (process.env.PHONEPE_CLIENT_VERSION?.trim() || '1'),
    });

    const response = await axios.post(TOKEN_ENDPOINT, params.toString(), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10_000, // 10 second timeout
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
        throw new Error('[PhonePeAuth] Token response missing access_token');
    }

    // Cache the new token
    tokenCache = {
        accessToken: access_token,
        expiresAt:   Date.now() + (expires_in || 3600) * 1_000,
    };

    console.log('[PhonePeAuth] New access token cached successfully');
    return tokenCache.accessToken;
};

/**
 * Clears the cached token (call after a 401 to force re-fetch).
 */
export const clearPhonePeTokenCache = (): void => {
    tokenCache = null;
    console.log('[PhonePeAuth] Token cache cleared');
};
