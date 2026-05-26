# Deploy order sound fix to laxmart.store

## Problem
Live site still loads **old JavaScript**:
- Live: `index-CGGOBG0Z.js` + `SellerDashboard-XYorot2c.js` (broken mp3 audio)
- Fixed build: `index-B4rke5_9.js` + `OrderSoundEnableBanner` (Web Audio, no files)

Console error `Audio unlock failed: NotSupportedError` only exists on the **old** bundle.

## Deploy steps (Vercel)

1. Push latest code: `git push origin main`
2. Open [Vercel Dashboard](https://vercel.com) → your **laxmart** project
3. **Settings → General → Root Directory**
   - Use **repository root** (empty), so root `vercel.json` runs `cd frontend && npm run build`
   - OR set `frontend` and ensure **Build Command** = `npm run build`, **Output** = `dist`
4. **Deployments** → latest deployment → **Redeploy** (uncheck "Use existing Build Cache")
5. Wait until status is **Ready**

## Verify after deploy

1. Open `https://laxmart.store/seller` in **Incognito**
2. Open DevTools → **Console**
3. You must see: `[LaxMart] frontend build: order-sound-v4`
4. Banner text must say: **"Tap anywhere on this card once"**
5. Banner shows small text: **Build order-sound-v4**
6. Click banner → **ring sound** + toast "Order sound alerts activated!"

If you still see `SellerDashboard-XYorot2c.js` in the stack trace, production is **still not updated**.

## Manual upload (cPanel / FTP)

```bash
cd frontend
npm run build
```

Upload **all files** inside `frontend/dist/` to your web root (replace old files).
