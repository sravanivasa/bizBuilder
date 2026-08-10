# BizBuilder — Product Vision

## Mission

Help home-based businesses go online with a simple, local-language experience — no technical skills required.

**Target businesses:** cloud kitchens, homemade food, clothing, organic oils, pickles, snacks, and similar home-run sellers.

**One-line pitch:**

> BizBuilder helps home businesses go online in their language, take orders with one shareable link, get WhatsApp updates on every order, and upgrade to AI social tools and a full website when they are ready.

---

## Target Users

| User | Needs |
|------|--------|
| **Business owner** | Easy setup, local language, WhatsApp alerts, simple product & order management |
| **Customer** | Browse menu/products, place order quickly, get updates on WhatsApp |

Owners check **mobile (WhatsApp)** more than the website. Notifications and shareable links are core, not optional extras.

---

## Differentiation

| Generic shop builders | BizBuilder |
|----------------------|------------|
| Complex setup | Wizard-style onboarding |
| English-first | Telugu, Hindi, English from day one (UI structure) |
| Web-only alerts | WhatsApp on new order, confirmed, delivered |
| No social help | AI daily post suggestions (paid tier, later) |
| One size fits all | Optional full custom website (premium tier) |

---

## Monetization Tiers

### Starter (Free / trial)

- Register and create one business
- Add products with photos
- Shareable storefront link
- Basic order management
- Limited products (TBD)

### Growth (Monthly / yearly subscription)

- Unlimited products
- Full order history and dashboard
- WhatsApp notifications (owner + customer)
- Telugu / Hindi / English UI
- AI-assisted daily Instagram & Facebook post suggestions
- WhatsApp-friendly share tools

### Pro (Premium / one-time or higher subscription)

- Full custom website (Home, About, Shop, Contact)
- Custom domain (e.g. `sravaniskitchen.com`)
- Advanced branding (logo, colors)
- Priority support

*Payment integration (e.g. Razorpay) comes after core product works.*

---

## Sprint 1 Complete ✅

**Status:** Done — pushed to GitHub `main` at commit `3d7e2bf`.

Sprint 1 delivered the **owner dashboard** — the business owner's control panel. This is the foundation; customers cannot order yet without Sprint 2.

| Area | What was built |
|------|----------------|
| **Auth** | Login, register, JWT-protected routes, forgot-password page (UI shell) |
| **i18n** | English, Telugu, Hindi via `react-i18next` — language switcher on all owner pages |
| **Business setup** | Create/edit business profile with **22 categories** (cloud kitchen, pickles, clothing, etc.) |
| **Products** | Full CRUD, Cloudinary image upload, **CSV bulk import** (batched API calls), client-side search & pagination |
| **Orders** | List orders, update status (pending → confirmed → delivered), delete |
| **UI polish** | `AuthLayout`, `PageShell`, `PasswordInput`, responsive navbar, consistent brand styling |

**What Sprint 1 does *not* include:** public storefront, customer ordering without owner login, WhatsApp notifications, deployment, payments.

---

## Sprint 2 Plan (recommended order)

Sprint 2 turns BizBuilder from an owner-only tool into a **real product customers can use**. Build in this order — each phase depends on the previous one.

### Phase 2A — Customer Storefront (**DO FIRST**)

**Why first:** This is the core startup promise. A business owner gets a shareable link; customers browse and place orders **without** the owner's JWT. The owner dashboard alone is not a product for end customers.

#### Backend needed

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/public/businesses/:id` (or `:slug`) | None | Public business info + active products |
| `POST /api/public/orders` | None | Customer places order |

**Order fields for public checkout** (extend existing Order model):

| Field | Required | Notes |
|-------|----------|--------|
| `customerPhone` | Yes | Primary mobile |
| `isWhatsAppSameAsPhone` | Yes | Boolean |
| `customerWhatsApp` | If not same | Used for WhatsApp notifications in Phase 2B |

#### Frontend needed

| Item | Details |
|------|---------|
| **Public routes** | `/store/:businessId` or `/b/:id` — no login required |
| **Storefront page** | Business name/logo, product catalog, add-to-cart, checkout form |
| **Design** | Mobile-first, same brand colors/fonts as owner dashboard |
| **Owner dashboard** | "Copy store link" button on dashboard — owner shares via WhatsApp |

**MERN learning focus:** public vs protected routes, fetching data without JWT, form validation on checkout, optimistic UI for cart.

---

### Phase 2B — WhatsApp Notifications (**AFTER storefront**)

**Why second:** Needs real customer orders flowing from the storefront. Owner phone is already on the business profile from onboarding.

| Trigger | Recipient | Message |
|---------|-----------|---------|
| New order placed | Business owner (`phoneNumber` on business) | Order summary + customer phone |
| Order confirmed | Customer (`customerWhatsApp` or `customerPhone`) | Reassurance, expected timeline |
| Order delivered | Customer | Closure, thank you |

**Technical:**

- WhatsApp Business API via provider (Gupshup or Meta Cloud API)
- Pre-approved message templates (required by WhatsApp)
- Small per-message cost — can bundle into Growth subscription later

**Later events:** preparing, out for delivery, cancelled.

---

### Phase 2C — Deploy MVP (**after 2A + 2B work locally**) ✅ Ready

Deploy only after storefront and WhatsApp work end-to-end on localhost.

| Layer | Suggested platform |
|-------|-------------------|
| Frontend | Vercel (or Netlify) |
| Backend | Railway or Render |
| Database | MongoDB Atlas (already in use) |
| Images | Cloudinary (already in use) |

**Launch checklist:**

| Item | Status | Notes |
|------|--------|--------|
| HTTPS | ✅ Auto | Vercel + Railway provide SSL |
| Environment variables on host | ✅ Documented | `DEPLOYMENT.md` + `.env.example` files |
| CORS for production URL | ✅ Code ready | Set `CORS_ORIGIN` on Railway |
| `VITE_API_URL` on Vercel | ✅ Code ready | Points frontend to Railway API |
| Health check `/api/health` | ✅ Done | Railway healthcheck in `railway.toml` |
| SPA rewrites (`vercel.json`) | ✅ Done | React Router works on refresh |
| Privacy Policy + Terms | ✅ Placeholder | `/privacy`, `/terms` — replace before marketing |
| Meta WhatsApp production setup | 📝 User action | See `DEPLOYMENT.md` WhatsApp section |
| Push to GitHub + connect hosts | 📝 User action | Vercel + Railway dashboards |

**Step-by-step deploy guide:** `DEPLOYMENT.md`  
**Learning chapter:** `PROJECT_LEARNING_GUIDE.md/14_Deploy_MVP.md`

Custom domain can wait.

---

## Sprint 2 Complete ✅

**Status:** Done — storefront, WhatsApp notifications, deployment prep.

| Phase | What was built |
|-------|----------------|
| **2A** | Public storefront (`/store/:slug`), customer checkout, shareable store link |
| **2B** | WhatsApp alerts — new order (owner), placed / confirmed / delivered (customer) |
| **2C** | Deploy MVP — Vercel + Railway config, `DEPLOYMENT.md`, health check, legal placeholders |

---

## Sprint 3 Complete ✅

**Status:** Done — revenue dashboard, order tracking, returns, expanded WhatsApp.

| Feature | What was built |
|---------|----------------|
| **Dashboard revenue** | Today's / month sales stat cards |
| **Order tracking** | Secure token links, `/track/:token`, slug-based store URLs, My Orders (localStorage) |
| **Returns** | Customer return request, owner approve/reject, stock restore |
| **WhatsApp expansion** | Placed, Preparing, Cancelled, Return approved alerts |

**Learning chapter:** `PROJECT_LEARNING_GUIDE.md/15_Sprint3_Features.md`

---

## Sprint 4: Delivery Module 🚚 (core differentiator)

**Status:** In progress — phases 4A–4C and 4E complete; 4D bulk actions remaining.

Home businesses deliver differently: some use a local delivery person, some ship via courier, some offer shop pickup. Generic shop builders treat every order the same. **BizBuilder's delivery module** lets the owner choose how each order goes out — with proof, tracking, and WhatsApp updates built in.

### Why this matters

| Pain for home sellers | BizBuilder delivery |
|----------------------|---------------------|
| "Did the delivery boy actually deliver?" | Photo proof + OTP confirmation |
| "Customer keeps calling for courier status" | Tracking link sent on WhatsApp automatically |
| "Pickup orders — how do I know it's the right person?" | OTP on pickup (same flow as delivery) |
| Too many confusing statuses | Simplified: New → Processing → Shipped/Out for delivery → Delivered → Cancelled |

### Four delivery routes

| Route | `deliveryType` | Owner sets | Customer / delivery person sees |
|-------|----------------|------------|-----------------------------------|
| **1. Local delivery person** | `local` | Person name + phone → generates token link | Delivery person mobile page (`/deliver/:token`): address, items, photo upload, OTP entry |
| **2. Courier / post** | `courier` | Carrier name + tracking ID | Status **Shipped**; customer sees tracking ID + external link (auto-built for known carriers) |
| **3. OTP proof** | (all routes) | Auto when out for delivery | 4-digit OTP via WhatsApp to customer; delivery person enters OTP to mark **Delivered** |
| **4. Pickup at shop** | `pickup` | Mark ready for pickup | Customer gets OTP on WhatsApp; staff enters OTP at handover → **Delivered** |

### Simplified order statuses

| Status | Meaning | Replaces (legacy) |
|--------|---------|-------------------|
| **New** | Order just placed | `Pending` |
| **Processing** | Owner accepted, preparing | `Confirmed`, `Preparing` |
| **Shipped** | Courier handed over | (new — courier only) |
| **Out for delivery** | Local delivery person assigned | (new — local only) |
| **Delivered** | Completed | `Delivered`, `Completed` |
| **Cancelled** | Cancelled | `Cancelled` |

Legacy statuses remain in the database for existing orders; API and UI map them for display.

### Sprint 4 phases

| Phase | Scope | Status |
|-------|--------|--------|
| **4A** | `deliveryType` field, courier tracking, owner delivery UI, customer track view | ✅ Done |
| **4B** | Delivery person page + photo upload (Cloudinary) | ✅ Done |
| **4C** | Delivery OTP generation + verify via WhatsApp | ✅ Done |
| **4D** | Simplified statuses migration + bulk actions | ⚠️ Partial — new statuses + backward compat; bulk actions TBD |
| **4E** | Delivery timeline on customer track page | ✅ Done |

#### Phase 4A — Delivery type & courier tracking

**Backend:**

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `PUT /api/orders/:id/delivery` | Owner JWT | Set `deliveryType`, courier info, assign delivery person |

**Order model fields (4A):** `deliveryType` (`local` \| `courier` \| `pickup`), `courierName`, `trackingId`, `trackingUrl`

**Frontend:** Owner `Orders.jsx` — per-order delivery type selector; courier carrier + tracking ID; mark Shipped.

**Customer:** `TrackOrder` / `MyOrders` — show courier tracking ID + external link.

#### Phase 4B — Delivery person page + photo

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/public/deliver/:deliveryToken` | None | Delivery person view (address, items) |
| `POST /api/public/deliver/:deliveryToken/photo` | None | Upload delivery photo (multer → Cloudinary) |

**Order fields:** `deliveryPersonName`, `deliveryPersonPhone`, `deliveryToken`, `deliveryPhoto`

**Frontend:** `/deliver/:deliveryToken` — mobile-first page, no login.

**WhatsApp:** Send delivery person link when local delivery assigned.

#### Phase 4C — OTP proof

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/public/deliver/:deliveryToken/verify-otp` | None | Verify OTP → mark Delivered |

**Order fields:** `deliveryOtp`, `deliveryOtpExpiresAt`

**Triggers:** Generate 4-digit OTP when status → Out for delivery (local) or ready for pickup.

**WhatsApp:** OTP to customer; tracking info when courier shipped.

#### Phase 4D — Status migration + bulk actions

- Migrate display to simplified statuses; keep backward compat in DB
- Owner bulk status update (e.g. mark multiple as Processing)

#### Phase 4E — Delivery timeline

**Order field:** `deliveryTimeline: [{ status, note, photo, at }]`

Customer track page shows timeline of status updates, photos, and notes.

### Environment

| Variable | Purpose |
|----------|---------|
| `FRONTEND_URL` | Base URL for delivery person links (`/deliver/:token`) and track links |
| `CLOUDINARY_*` | Delivery photo upload (folder: `bizbuilder/delivery`) |

**Learning chapter:** `PROJECT_LEARNING_GUIDE.md/16_Delivery_Module.md`

---

## Sprint 5+ (later)

These are valuable but **not** needed until delivery module is stable:

| Feature | Tier | Notes |
|---------|------|--------|
| Razorpay subscriptions | Growth / Pro | Monthly/yearly plans, webhooks, plan limits in DB |
| AI social post suggestions | Growth | Daily Instagram/Facebook caption ideas |
| Full custom website | Pro | Home, About, Shop, Contact pages + custom domain |
| Voice assistant | Future | Documented, build when core is stable |
| Customer CRM module | Growth+ | Repeat customers, order history per phone |
| Expenses tracking | Later | Owner bookkeeping |

---

## Current Repo Structure

```text
bizBuilder/
├── backend/          # Express API — auth, business, products, orders
├── frontend/         # React + Vite — owner dashboard (Sprint 1)
└── PROJECT_LEARNING_GUIDE.md/   # MERN learning chapters for sravani
```

**Storefront decision (Sprint 2):** Add public routes to the **same** `frontend/` app (recommended for MVP — one deploy, shared components and i18n). A separate `/store` app or subdomain is an option later if the bundle grows too large.

**Key frontend folders (Sprint 1):**

```text
frontend/src/
├── api/              # axios wrappers (business, products, orders)
├── components/       # Layout, Navbar, AuthLayout, PageShell, etc.
├── pages/            # Login, Dashboard, BusinessSetup, Products, Orders
├── i18n/locales/     # en.json, te.json, hi.json
└── constants/        # businessCategories.js (22 categories)
```

---

## Learning Guide

Chapters live in `PROJECT_LEARNING_GUIDE.md/`. See `00_Chapter_Index.md` for full status.

| Chapter | Topic | Status |
|---------|--------|--------|
| 1–8 | Backend (Express, MongoDB, JWT, validation, Swagger) | ✅ Current |
| 9 | React frontend setup (Vite, auth, routing) | ✅ Current |
| 10 | Owner dashboard (business, products, orders) | ✅ Current — Sprint 1 |
| 11 | i18n multi-language | ⚠️ Partial — wired in app, dedicated chapter not written |
| 12 | Customer storefront | ✅ Current — Sprint 2A |
| 13 | WhatsApp integration | ✅ Current — Sprint 2B |
| 14 | Production deployment | ✅ Current — Sprint 2C |
| 15 | Sprint 3 features | ✅ Current — revenue, tracking, returns |
| 16 | Delivery module | 🔄 In progress — Sprint 4 |

**Policy:** After each completed module, add or refresh a chapter covering what we built, why, how data flows, and key MERN concepts. The assistant reminds the team when a module is done.

**Sprint 2 learning order:** Finish Chapter 11 (i18n) when convenient → write Chapter 12 while building storefront → write Chapter 13 during WhatsApp integration.

---

## Customer Contact & WhatsApp (Order Flow)

When a customer places an order on the **public storefront** (Sprint 2A), collect:

1. **Mobile number** (required) — for calls and SMS if needed
2. **Question:** "Is this your WhatsApp number?" (Yes / No)
3. **If No:** ask for **WhatsApp number** separately

**Backend fields:**

| Field | Required | Notes |
|-------|----------|--------|
| `customerPhone` | Yes | Primary mobile |
| `isWhatsAppSameAsPhone` | Yes | Boolean |
| `customerWhatsApp` | If not same | Used for WhatsApp notifications |

WhatsApp messages (confirmed, delivered) go to `customerWhatsApp` when set; otherwise `customerPhone`.

**Owner notifications** use the business `phoneNumber` (confirmed during onboarding as the WhatsApp alert number).

---

## WhatsApp Notifications (Phase 2B)

Part of Sprint 2, **after** the customer storefront is live.

| Event | Recipient | Purpose |
|-------|-----------|---------|
| New order placed | Business owner | Immediate alert on phone |
| Order confirmed | Customer | Reassurance, reduces "did they get it?" calls |
| Order delivered | Customer | Closure, trust |

**Technical note:** Requires WhatsApp Business API (e.g. Meta Cloud API, Gupshup, or Twilio). Pre-approved message templates. Small per-message cost — can be included in Growth subscription.

---

## Feature Roadmap

```text
Sprint 1  Owner dashboard + i18n + products + orders     [DONE — 3d7e2bf]
Sprint 2A Public storefront + share link + customer orders [DONE]
Sprint 2B WhatsApp notifications (new / confirmed / delivered)      [DONE]
Sprint 2C Deploy MVP (Vercel + Railway)              [DONE — DEPLOYMENT.md]
Sprint 3  Revenue, tracking, returns, WhatsApp expansion [DONE]
Sprint 4  Delivery module (local / courier / pickup)   [IN PROGRESS]
  4A      deliveryType, courier tracking, owner + track UI
  4B      Delivery person page + photo upload
  4C      OTP proof via WhatsApp
  4D      Simplified statuses + bulk actions
  4E      Delivery timeline on track page
Sprint 5+ Razorpay subscriptions
Sprint 5+ AI daily social post suggestions
Sprint 5+ Full website + custom domain (Pro)
Future    Voice assistant, CRM, expenses
```

### Out of scope for v1 (Sprint 2 MVP)

- Voice assistant
- AI post generation
- Payment gateway / subscriptions (except plan flags in DB if needed)
- Full custom websites
- React Native mobile app (responsive web first)
- Google OAuth (email/password first)

---

## Tech Stack (Planned)

| Layer | Choice |
|-------|--------|
| Frontend | React, React Router, Redux Toolkit or Context, Tailwind CSS |
| i18n | react-i18next (English, Telugu, Hindi) |
| Backend | Node.js, Express (existing) |
| Database | MongoDB (existing) |
| Auth | JWT (existing) |
| Images | Cloudinary (existing) |
| WhatsApp | Meta Cloud API (Sprint 2B) |
| AI posts | TBD (OpenAI / Gemini) — Growth tier only |
| Deploy | Vercel (frontend) + Railway/Render (backend) — Sprint 2C |

---

## Production Checklist

### MVP launch (first 5–50 home businesses)

| Item | Status | Notes |
|------|--------|--------|
| Backend API (users, business, products, orders) | ✅ Done | Test via `/api-docs` |
| Owner dashboard (React) | ✅ Done | Sprint 1 — login, business, products, orders |
| i18n (EN / TE / HI) | ✅ Done | Sprint 1 — dedicated Chapter 11 pending |
| Public storefront + share link | ✅ Done | Sprint 2A |
| Customer phone + WhatsApp number on orders | ✅ Done | Sprint 2A checkout form |
| WhatsApp notifications (new / confirmed / delivered) | ✅ Done | Sprint 2B — Meta Cloud API |
| Deploy backend + frontend | ✅ Done | Sprint 2C — config + `DEPLOYMENT.md` |
| Order tracking + returns | ✅ Done | Sprint 3 |
| Delivery module (local / courier / pickup) | 🔄 In progress | Sprint 4 — see above |
| HTTPS (SSL) | ✅ Auto | Vercel + Railway |
| Privacy Policy + Terms of Service | ✅ Placeholder | `/privacy`, `/terms` — lawyer review before marketing |
| Mobile-responsive UI | ✅ Done | Owner pages; extend to storefront in 2A |
| Error & loading states in UI | ✅ Done | Sprint 1 owner pages |

### Before charging subscriptions (Growth / Pro tiers)

| Item | Notes |
|------|--------|
| Razorpay (or similar) integration | Monthly / yearly plans |
| Payment webhooks | Confirm payment server-side |
| Plan limits in database | Free vs paid features |
| Refund / cancellation policy | Legal + support |
| GST / invoicing advice | Consult accountant |

### Before scaling to many users (100+ businesses, high traffic)

| Item | Why |
|------|-----|
| Pagination on all list APIs | Avoid slow queries |
| Error monitoring (Sentry) | Know when app breaks |
| Automated MongoDB backups | Atlas backup enabled |
| CI/CD (GitHub Actions) | Safe deploys |
| Password reset flow | Support load |
| Email verification | Reduce fake accounts |
| Redis queue for WhatsApp | Don't block API on message send |
| CDN for images | Cloudinary already helps |
| Load testing | Know your limits |
| Rate limits per plan | Protect API abuse |

### If many customers arrive immediately (unlikely but plan for it)

**What breaks first:**

1. **Single server** — one Node process handles all traffic  
2. **Unbounded DB queries** — listing all orders/users without pagination  
3. **WhatsApp API limits** — provider throttles messages  
4. **No queue** — sending WhatsApp inside request slows orders  

**What we already did right (helps scale later):**

- Stateless JWT API (can run multiple server instances)  
- MongoDB Atlas (scales with cluster tier)  
- Cloudinary for images (not stored on your server)  
- Indexes on `owner`, `business`, orders  

**What we'd add when traffic grows (not now):**

- Horizontal scaling (2+ backend instances behind load balancer)  
- Redis + job queue for WhatsApp and emails  
- Pagination + caching on hot endpoints  
- Upgrade MongoDB Atlas tier  
- Monitoring alerts (Sentry, UptimeRobot)  

**Honest advice:** Focus on MVP and first real users. Architect for scale (clean API, env config, no hardcoded secrets) but don't pay for Redis and load balancers until you need them.

---

## Document History

| Date | Change |
|------|--------|
| 2026-08-05 | Initial vision: tiers, WhatsApp MVP, customer phone/WhatsApp fields, i18n, AI & voice deferred |
| 2026-08-06 | Sprint 1 marked complete (3d7e2bf); Sprint 2 plan (2A storefront → 2B WhatsApp → 2C deploy); repo structure & learning guide chapters |
| 2026-08-06 | Sprint 2C deployment prep: DEPLOYMENT.md, Vercel/Railway config, health check, legal placeholders, Chapter 14 |
| 2026-08-10 | Sprint 2/3 marked complete; Sprint 4 Delivery Module documented (4A–4E); Chapter 16 stub |
