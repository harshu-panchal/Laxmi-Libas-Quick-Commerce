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

## Manual upload (cPanel / FTP / VPS nginx)

**Important:** `git push` only updates GitHub. Your VPS does **not** auto-update until you run deploy on the server.

Live check right now:
- If `https://laxmart.store` still serves old `index-*.js` (Last-Modified not today), production is stale.

### One-command deploy on Linux VPS (SSH)

```bash
cd ~/Laxmi-Libas-Quick-Commerce   # your clone path
bash scripts/deploy-server.sh
```

Set paths if needed:

```bash
export REPO_DIR=/home/user/Laxmi-Libas-Quick-Commerce
export WEB_ROOT=/var/www/laxmart.store/html
export PM2_APP=laxmart-backend
bash scripts/deploy-server.sh
```

### Manual steps (same result)

```bash
cd frontend
npm run build
```

Upload **all files** inside `frontend/dist/` to your web root (replace old files).

Backend on server:

```bash
cd backend
git pull origin main
npm install
npm run build
pm2 restart laxmart-backend
```
