# BizBuilder Learning Guide — Chapter Index

Use this file to see which chapters are done, outdated, or planned.

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
| 8 | `08_Backend_Production_Ready.md` | Security & hardening | ✅ New | Documents backend completion work |
| 9 | `09_React_Frontend_Setup.md` | React + Vite | 📝 Planned | Write after Phase 2 scaffold |
| 10 | `10_Owner_Dashboard.md` | Dashboard pages | 📝 Planned | After login, business, products UI |
| 11 | `11_i18n_Multi_Language.md` | Telugu, Hindi, English | 📝 Planned | After i18n wired up |
| 12 | `12_Customer_Storefront.md` | Public shop | 📝 Planned | Phase 3 |
| 13 | `13_WhatsApp_Integration.md` | Order notifications | 📝 Planned | Phase 5 |

**Legend:** ✅ Current | ⚠️ Needs small update | 📝 Not written yet

---

## When we update the guide

After each **completed module**, we add or refresh one chapter:

1. What we built  
2. Why we built it that way  
3. How data flows (browser → API → DB)  
4. Key files and what each line does  

---

## Priority updates (recommended order)

1. **Chapter 8** — Backend production hardening (done in repo, now documented)  
2. **Chapter 9** — After frontend scaffold (Phase 2.1)  
3. **Patch chapters 3, 4, 5, 6, 7** — Short “Updates” sections at bottom (optional, when you review)  

---

## Related docs

- `PRODUCT_VISION.md` — Startup goals, tiers, roadmap  
- `backend/.env.example` — Required environment variables  
