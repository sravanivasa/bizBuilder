# Chapter 8 - Backend Production Ready

## Introduction

After the basic CRUD APIs worked, we hardened the backend so it is safer and more reliable before building the React frontend.

This chapter explains **what** we changed, **why** it matters for a startup, and **how** each piece works.

---

# What “production ready” means for us

We are not building for millions of users on day one. We are building so that:

- Real business owners can trust the app with orders  
- Bad input or hackers cannot easily break things  
- Inventory (stock) stays correct when orders are placed or cancelled  
- The API behaves consistently (same error format, correct HTTP codes)  

---

# 1. Environment validation (`config/env.js`)

## What

On startup, the server checks that `MONGODB_URI` and `JWT_SECRET` exist, and that `JWT_SECRET` is at least 32 characters.

## Why

If `JWT_SECRET` is missing, JWT libraries may still “work” with weak security. Failing at startup is better than discovering it in production.

## How it works

```javascript
validateEnv(); // Called in server.js before routes load
```

If validation fails → process exits with a clear error message.

---

# 2. Field whitelisting (`utils/pickFields.js`)

## What

When updating a business or product, we only copy **allowed** fields from `req.body` — never the whole body.

## Why (critical for startups)

Without this, a malicious user could send:

```json
{ "owner": "someone_elses_user_id" }
```

and steal a business. This is called **mass assignment**.

## Allowed business fields

`businessName`, `category`, `phoneNumber`, `description`, `address`, `email`, `website`, `logo`

`owner` is never accepted from the client — it is set only on create from `req.user._id`.

---

# 3. Order status bug fix (`orderStatus` vs `status`)

## What

The MongoDB model uses `orderStatus`. The controller originally used `order.status`, so updates never saved.

## Why it matters

Owners would click “Confirm order” in the UI later and nothing would change in the database.

## Rule

Always match **exact field names** in model, controller, validator, and Swagger.

---

# 4. Inventory safety (`utils/orderInventory.js`)

## Problems we fixed

1. **Duplicate line items** — Two rows for same product could each pass stock check  
2. **Race conditions** — Two customers ordering last item at same time  
3. **Cancel without restore** — Cancelling order did not put stock back  

## Solutions

| Issue | Solution |
|-------|----------|
| Duplicate products in one order | `aggregateOrderProducts.js` — sum quantities per product ID first |
| Overselling | Atomic update: `{ stock: { $gte: quantity } }` then `$inc` |
| Cancel order | `restoreStock()` when status → `Cancelled` |
| Delete pending order | Restore stock before delete |

---

# 5. Input sanitization (`middleware/sanitizeInput.js`)

## What

Removes keys like `$gt` or `password.$ne` from `req.body`, `req.params`, `req.query`.

## Why

MongoDB operators in user input can change query meaning (NoSQL injection). We replaced commented `express-mongo-sanitize` with a small custom middleware compatible with Express 5.

---

# 6. Admin-only user list

## What

`GET /api/users` requires `role: "admin"` on the logged-in user.

## Why

Every registered user could previously see all emails — privacy and security risk.

## How to create an admin (one time in MongoDB)

```javascript
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

---

# 7. Auth improvements

| Change | Why |
|--------|-----|
| Rate limit on `/register` and `/login` | Slow down brute-force attacks |
| Password max 72 chars | bcrypt limit + DoS protection |
| Login failure → `401` | Correct HTTP meaning |
| Forbidden → `403` with message `"Forbidden"` | Not confused with 401 |
| `formatUser()` helper | Consistent `{ id, name, email, role }` in responses |
| JWT errors vs DB errors in auth middleware | DB down should not look like “bad token” |

---

# 8. Database indexes

Added on:

- `Business.owner`  
- `Product.business`  
- `Order.business` + `createdAt`  

## Why

As orders grow, `find({ business: id })` stays fast.

---

# 9. Cascade delete business

Deleting a business also deletes its products and orders.

## Why

Orphan records confuse reports and waste space.

---

# 10. Consolidated Swagger docs

User and business APIs moved from many small files to:

- `docs/users/user.swagger.js`  
- `docs/business/business.swagger.js`  

Shared schemas live in `docs/components/`.

---

# 11. `.env` vs `.env.example`

| File | Purpose |
|------|---------|
| `.env` | Your real secrets — never commit |
| `.env.example` | Template for team / deploy — safe to commit |

New variables: `CORS_ORIGIN`, `NODE_ENV`, `API_URL`.

---

# Data flow reminder (full stack)

```text
Client → HTTP request → Express middleware chain → Route → Controller → Mongoose → MongoDB
                                                                              ↓
Client ← JSON response ← Controller ←─────────────────────────────────────────┘
```

**Middleware chain order in `server.js`:**

1. helmet (security headers)  
2. rate limit  
3. morgan (logs)  
4. cors  
5. body parser  
6. sanitizeInput  
7. hpp  
8. routes  
9. error handler  

---

# What is still NOT in backend (coming later)

- Customer storefront public routes  
- WhatsApp send on order events  
- `customerWhatsApp` / `isWhatsAppSameAsPhone` on orders  
- Razorpay subscriptions  
- Password reset email  

See `PRODUCT_VISION.md` for the full roadmap.

---

# Practice questions

1. Why is `pickFields` safer than `req.body` in `findByIdAndUpdate`?  
2. What happens to stock when an order is cancelled?  
3. Why do we validate `JWT_SECRET` length at startup?  
4. What is the difference between HTTP 401 and 403?

---

# Next chapter

**Chapter 9 — React Frontend Setup** (after we scaffold the owner dashboard).
