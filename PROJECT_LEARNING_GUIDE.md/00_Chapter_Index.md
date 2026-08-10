# BizBuilder Learning Guide — Chapter Index

Use this file to see which chapters are done, outdated, or planned.

**Last updated:** Sprint 2C ready (deployment docs + config)

---

## Chapters

| # | File | Topic | Status | Notes |
|---|------|--------|--------|--------|
| 1 | `01_Project_Architecture.md` | Overall structure | ✅ Current | Matches repo layout |
| 2 | `02_Express_Basics.md` | Express.js | ✅ Current | Core concepts still valid |
| 3 | `03_MongoDB_Mongoose.md` | Database & models | ⚠️ Partial | Add indexes, User `role` field, Order `orderStatus` |
| 4 | `04_JWT_Authentication.md` | Login & JWT | ⚠️ Partial | Add admin role, auth rate limit, 401 vs 403 |
| 5 | `05_Validation.md` | express-validator | ⚠️ Partial | Business/order validators updated since writing |
| 6 | `06_Middleware.md` | Middleware | ⚠️ Outdated | Says `mongo-sanitize` commented; we use `sanitizeInput.js` now |
| 7 | `07_Swagger.md` | API docs | ⚠️ Partial | Docs consolidated to `user.swagger.js`, `business.swagger.js` |
| 8 | `08_Backend_Production_Ready.md` | Security & hardening | ✅ Current | Documents backend completion work |
| 9 | `09_React_Frontend_Setup.md` | React + Vite scaffold | ✅ Current | Sprint 1 Step 1–2: scaffold, login, register, UI polish |
| 10 | `10_Owner_Dashboard.md` | Owner dashboard pages | ✅ Current | Sprint 1 complete: business, products, orders |
| 11 | `11_i18n_Multi_Language.md` | Telugu, Hindi, English | ⚠️ Partial | i18n wired in Sprint 1; dedicated chapter not written yet |
| 12 | `12_Customer_Storefront.md` | Public shop | ✅ Current | Sprint 2A: public APIs, storefront, copy link |
| 13 | `13_WhatsApp_Notifications.md` | Order notifications | ✅ Current | Sprint 2B: Meta Cloud API, owner + customer alerts |
| 14 | `14_Deploy_MVP.md` | Production deploy | ✅ Current | Sprint 2C: Vercel + Railway, env vars, health check |

**Legend:** ✅ Current | ⚠️ Needs small update | 📝 Not written yet

---

## Sprint 1 — what we completed

| Step | What | Chapter |
|------|------|---------|
| Backend | Auth, business, products, orders APIs | Chapters 3–8 |
| Frontend Step 1 | Vite scaffold, routes, Redux auth, i18n shell | Chapter 9 |
| Frontend Step 2 | Login, register, AuthLayout, PasswordInput | Chapter 9 |
| Frontend Step 3 | Business setup (create + edit) | Chapter 10 |
| Frontend Step 4 | Products CRUD, image upload, CSV bulk import | Chapter 10 |
| Frontend Step 5 | Orders list, status update, delete | Chapter 10 |

---

## When we update the guide

After each **completed module**, we add or refresh one chapter:

1. What we built
2. Why we built it that way
3. How data flows (browser → API → DB)
4. Key files and what each line does

---

## Priority updates (recommended order)

1. **Chapter 11** — Dedicated i18n chapter (keys already in `en.json`, `te.json`, `hi.json`)
2. **Patch chapters 3, 4, 5, 6, 7** — Short “Updates” sections at bottom (optional, when you review)

---

## Related docs

- `PRODUCT_VISION.md` — Startup goals, tiers, roadmap
- `DEPLOYMENT.md` — Step-by-step Vercel + Railway deploy checklist
- `backend/.env.example` — Required environment variables
