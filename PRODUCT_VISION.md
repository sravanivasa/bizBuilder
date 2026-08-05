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

## Customer Contact & WhatsApp (Order Flow)

When a customer places an order, collect:

1. **Mobile number** (required) — for calls and SMS if needed
2. **Question:** “Is this your WhatsApp number?” (Yes / No)
3. **If No:** ask for **WhatsApp number** separately

**Backend fields (planned):**

| Field | Required | Notes |
|-------|----------|--------|
| `customerPhone` | Yes | Primary mobile |
| `isWhatsAppSameAsPhone` | Yes | Boolean |
| `customerWhatsApp` | If not same | Used for WhatsApp notifications |

WhatsApp messages (confirmed, delivered) go to `customerWhatsApp` when set; otherwise `customerPhone`.

**Owner notifications** use the business `phoneNumber` (confirmed during onboarding as the WhatsApp alert number).

---

## WhatsApp Notifications (MVP / v1)

Included in the **first customer-facing version**, not a later phase.

| Event | Recipient | Purpose |
|-------|-----------|---------|
| New order placed | Business owner | Immediate alert on phone |
| Order confirmed | Customer | Reassurance, reduces “did they get it?” calls |
| Order delivered | Customer | Closure, trust |

**Later:** preparing, out for delivery, cancelled.

**Technical note:** Requires WhatsApp Business API (e.g. Meta Cloud API, Gupshup, or Twilio). Pre-approved message templates. Small per-message cost — can be included in Growth subscription.

---

## Feature Roadmap

```text
Phase 1  Backend API                    [DONE]
Phase 2  Owner dashboard + i18n structure
Phase 3  Public storefront + share link
Phase 4  Orders end-to-end + customer phone/WhatsApp fields
Phase 5  WhatsApp notifications (new / confirmed / delivered)
Phase 6  Subscription plans + payments
Phase 7  AI daily social post suggestions
Phase 8  Full website + custom domain (Pro)
Phase 9  Voice assistant (documented, build when core is stable)
```

### Out of scope for v1

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
| WhatsApp | TBD provider (Meta Cloud API / Gupshup) |
| AI posts | TBD (OpenAI / Gemini) — Growth tier only |
| Deploy | AWS / DigitalOcean / Azure — later |

---

## Learning Guide Policy

After each completed module, update `PROJECT_LEARNING_GUIDE.md` with:

- What we built
- Why we built it that way
- How data flows
- Key concepts for a MERN beginner

The assistant will remind the team when a module is complete.

---

## Document History

| Date | Change |
|------|--------|
| 2026-08-05 | Initial vision: tiers, WhatsApp MVP, customer phone/WhatsApp fields, i18n, AI & voice deferred |

---

## Production Checklist

### MVP launch (first 5–50 home businesses)

| Item | Status | Notes |
|------|--------|--------|
| Backend API (users, business, products, orders) | Done | Test via `/api-docs` |
| Owner dashboard (React) | In progress | Phase 2 |
| Public storefront + share link | Planned | Phase 3 |
| Customer phone + WhatsApp number on orders | Planned | Phase 4 |
| WhatsApp notifications (new / confirmed / delivered) | Planned | Phase 5 |
| Deploy backend + frontend | Planned | Railway, Render, Vercel, or DigitalOcean |
| HTTPS (SSL) | Planned | Required on deploy |
| Privacy Policy + Terms of Service | Planned | Required before marketing |
| Mobile-responsive UI | Planned | Owners use phones |
| Error & loading states in UI | Planned | Phase 2 |

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
