# BizBuilder — Production Deployment Guide

Step-by-step guide for deploying BizBuilder to **Vercel** (frontend) + **Railway** (backend) with **MongoDB Atlas**, **Cloudinary**, and **Meta WhatsApp Cloud API**.

**Who this is for:** sravani (or any team member deploying the MVP).

**What you must do manually:** create accounts, connect GitHub, paste secrets into dashboards, verify WhatsApp business. The code repo is already prepared — you follow this checklist.

---

## Prerequisites

- [ ] Code pushed to GitHub (`main` branch)
- [ ] Local app works: backend on `:5000`, frontend on `:5173`, orders + WhatsApp tested locally
- [ ] MongoDB Atlas cluster created (free tier is fine)
- [ ] Cloudinary account with upload preset / API keys
- [ ] Meta Developer account (for WhatsApp — see [WhatsApp production setup](#whatsapp-production-setup-meta-cloud-api))

---

## Deployment order (follow exactly)

| Step | What | Platform |
|------|------|----------|
| 1 | Push code to GitHub | GitHub |
| 2 | Deploy backend API | Railway |
| 3 | Set backend env vars | Railway |
| 4 | Verify health check | Railway URL |
| 5 | Deploy frontend | Vercel |
| 6 | Set `VITE_API_URL` + redeploy | Vercel |
| 7 | Update `CORS_ORIGIN` on backend | Railway |
| 8 | Configure WhatsApp production credentials | Railway + Meta |
| 9 | End-to-end production test | Browser + WhatsApp |

---

## Step 1 — Push to GitHub

```bash
git add .
git commit -m "Prepare Sprint 2C production deployment"
git push origin main
```

If the repo is not on GitHub yet, create a new repository and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bizBuilder.git
git push -u origin main
```

---

## Step 2 — Deploy backend on Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your `bizBuilder` repository
3. Railway may detect the monorepo — set **Root Directory** to `backend`
4. Railway uses Nixpacks and `backend/railway.toml`:
   - **Start command:** `npm start` (runs `node server.js`)
   - **Health check:** `GET /api/health`
5. Deploy and wait for build to finish
6. Open **Settings → Networking → Generate Domain** to get a public URL like:
   `https://bizbuilder-api-production.up.railway.app`

**Save this URL** — you need it for Vercel and Swagger.

---

## Step 3 — Backend environment variables (Railway)

In Railway → your backend service → **Variables**, add:

| Variable | Required | Example / notes |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` |
| `MONGODB_URI` | Yes | Atlas connection string |
| `JWT_SECRET` | Yes | Random string, **≥ 32 characters** |
| `CORS_ORIGIN` | Yes | `https://your-app.vercel.app` (set after Vercel deploy; update if URL changes) |
| `API_URL` | Yes | `https://your-app.up.railway.app` (no trailing slash) |
| `CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Yes | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Yes | From Cloudinary dashboard |
| `WHATSAPP_API_TOKEN` | Optional* | Meta permanent access token |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional* | Meta phone number ID |
| `PORT` | No | Railway sets this automatically |

\* WhatsApp vars are optional for deploy — orders work without them (messages are logged and skipped). Add them when Meta credentials are ready.

**Generate a secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Railway redeploys automatically when variables change.

---

## Step 4 — MongoDB Atlas network access

1. Atlas → **Network Access** → **Add IP Address**
2. For MVP: **Allow access from anywhere** (`0.0.0.0/0`)
3. For tighter security later: use Railway's static egress IPs (paid feature) or MongoDB Atlas VPC peering

Ensure the database user has read/write on your database.

---

## Step 5 — Verify backend health

```bash
curl https://YOUR-RAILWAY-URL.up.railway.app/api/health
```

Expected response:

```json
{"success":true,"message":"OK"}
```

Also check Swagger: `https://YOUR-RAILWAY-URL.up.railway.app/api-docs`

---

## Step 6 — Deploy frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite** (auto-detected)
4. **Build command:** `npm run build`
5. **Output directory:** `dist`
6. Add environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://YOUR-RAILWAY-URL.up.railway.app/api` |

7. Deploy

`frontend/vercel.json` already configures SPA rewrites so React Router routes (`/login`, `/store/:id`, `/privacy`, `/terms`) work on refresh.

Vercel provides HTTPS automatically.

---

## Step 7 — Update CORS on Railway

After Vercel gives you a URL (e.g. `https://bizbuilder.vercel.app`):

1. Railway → Variables → set `CORS_ORIGIN=https://bizbuilder.vercel.app`
2. Multiple origins (e.g. preview + production): comma-separate:
   `https://bizbuilder.vercel.app,https://bizbuilder-git-main-you.vercel.app`
3. Wait for redeploy

Test: open Vercel URL → login → dashboard should load without CORS errors in browser console.

---

## Step 8 — End-to-end production test

| Test | How to verify |
|------|----------------|
| Owner login/register | Vercel URL → `/login` |
| Create business + products | Dashboard flows |
| Copy storefront link | Dashboard → share link |
| Customer places order | Open `/store/:businessId` in incognito |
| Order appears in dashboard | Orders page |
| WhatsApp owner alert | Owner phone receives message (if Meta configured) |
| Confirm order → customer WhatsApp | Customer phone receives message |
| Privacy / Terms pages | `/privacy` and `/terms` load |
| Swagger | Railway `/api-docs` shows correct `API_URL` |

---

## Environment variables quick reference

### Railway (backend)

| Variable | Local example | Production example |
|----------|---------------|-------------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `5000` | *(Railway auto)* |
| `MONGODB_URI` | `mongodb://localhost:27017/bizbuilder` | `mongodb+srv://...` |
| `JWT_SECRET` | 32+ char secret | New production-only secret |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://your-app.vercel.app` |
| `API_URL` | `http://localhost:5000` | `https://your-api.up.railway.app` |
| `CLOUDINARY_CLOUD_NAME` | your cloud name | same |
| `CLOUDINARY_API_KEY` | your key | same |
| `CLOUDINARY_API_SECRET` | your secret | same |
| `WHATSAPP_API_TOKEN` | Meta temp token | Permanent system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | Test number ID | Production number ID |

### Vercel (frontend)

| Variable | Local example | Production example |
|----------|---------------|-------------------|
| `VITE_API_URL` | `http://localhost:5000/api` | `https://your-api.up.railway.app/api` |

**Never commit `.env` files.** Only `.env.example` lives in the repo.

---

## WhatsApp production setup (Meta Cloud API)

### Development vs production

| | Development (local) | Production (Railway) |
|--|---------------------|----------------------|
| Token | Temporary token from Meta dashboard | **Permanent** system user token |
| Phone number | Meta test number | Your verified WhatsApp Business number |
| Recipients | Test numbers added in Meta dashboard | Any customer (after business verification) |
| Message format | Free-form text (works in dev window) | **Pre-approved templates** required for most outbound messages |

### Meta Developer setup (one-time)

1. **Create Meta Developer account** — [developers.facebook.com](https://developers.facebook.com/)
2. **Create an app** → type: Business → add **WhatsApp** product
3. **Meta Business Manager** — link or create a business portfolio
4. **WhatsApp → API Setup** — note:
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary access token** (dev only) or create a **System User** with permanent token → `WHATSAPP_API_TOKEN`

### Production WhatsApp Business number

1. Meta Business Manager → **WhatsApp Accounts** → add phone number
2. Verify via SMS/voice
3. Complete **Business Verification** (required for messaging customers at scale)
4. Copy the production **Phone number ID** into Railway

### Add credentials to Railway

```
WHATSAPP_API_TOKEN=EAAxxxxxxxx...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
```

Optional override (default is fine):

```
WHATSAPP_API_URL=https://graph.facebook.com/v21.0
```

Redeploy backend. Place a test order — check Railway logs for `[WhatsApp]` lines if messages fail.

### Test recipients (sandbox)

During development, only numbers registered as **test recipients** in Meta → WhatsApp → API Setup receive messages. Add your phone and any test customer phones.

### Message templates (production requirement)

WhatsApp restricts business-initiated messages outside the 24-hour customer service window. For production you should:

1. Meta Business Manager → **WhatsApp Manager** → **Message templates**
2. Create templates for:
   - New order alert (owner)
   - Order confirmed (customer)
   - Order delivered (customer)
3. Submit for Meta approval (usually hours to 2 days)
4. Update `whatsappService.js` to use template messages (future enhancement)

**Current MVP:** Sprint 2B sends free-form text — works with test numbers and within the 24-hour window. Plan template migration before marketing to many unknown customers.

### WhatsApp troubleshooting

| Symptom | Fix |
|---------|-----|
| Orders work, no WhatsApp | Check Railway vars; look for `[WhatsApp] Skipped` in logs |
| `401` from Meta API | Token expired — regenerate permanent token |
| Message not delivered | Recipient not added as test number (dev) or template not approved (prod) |
| Wrong country code | Service normalizes Indian numbers to `91XXXXXXXXXX` |

See also: `PROJECT_LEARNING_GUIDE.md/13_WhatsApp_Notifications.md`

---

## HTTPS

Both Vercel and Railway provide HTTPS by default. No extra SSL setup for MVP. Custom domain (e.g. `app.bizbuilder.in`) can be added later in each platform's domain settings.

---

## What's done in code vs what you do manually

| Done in repo | You do manually |
|--------------|-----------------|
| `CORS_ORIGIN` env support in `server.js` | Paste Vercel URL into Railway |
| `VITE_API_URL` in frontend axios | Paste Railway API URL into Vercel |
| `API_URL` for Swagger | Paste Railway URL into Railway vars |
| `GET /api/health` for Railway | Hit URL to verify |
| `backend/railway.toml` start + healthcheck | Connect GitHub repo on Railway |
| `frontend/vercel.json` SPA rewrites | Connect GitHub repo on Vercel |
| `npm start` in backend `package.json` | — |
| Privacy + Terms placeholder pages | Replace with lawyer-reviewed text before marketing |
| `.env.example` documented vars | Copy values into hosting dashboards |
| WhatsApp service (skips if unset) | Meta account, tokens, templates |

---

## Optional next steps (not required for MVP)

- Custom domain on Vercel + Railway
- Railway static egress IP + Atlas IP allowlist
- Sentry error monitoring
- GitHub Actions CI (lint + build on PR)
- Approved WhatsApp message templates per language

---

## Related docs

- `PRODUCT_VISION.md` — Sprint 2C checklist
- `PROJECT_LEARNING_GUIDE.md/14_Deploy_MVP.md` — learning chapter
- `PROJECT_LEARNING_GUIDE.md/13_WhatsApp_Notifications.md` — WhatsApp architecture
- `backend/.env.example` — all backend vars
- `frontend/.env.example` — frontend vars
