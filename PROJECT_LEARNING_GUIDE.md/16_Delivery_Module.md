# Chapter 16 — Sprint 4: Delivery Module

## Introduction

Sprint 4 adds **flexible delivery** — the core differentiator for home businesses that deliver locally, ship via courier, or offer shop pickup.

| Route | `deliveryType` | Key flow |
|-------|----------------|----------|
| Local delivery person | `local` | Assign person → token link → photo + OTP proof |
| Courier / post | `courier` | Carrier + tracking ID → customer sees tracking link |
| Pickup at shop | `pickup` | OTP to customer on handover |

**Prerequisites:** Chapters 12 (storefront), 13 (WhatsApp), 15 (tracking).

---

## Order model additions

New fields on `Orders.js`:

| Field | Type | Purpose |
|-------|------|---------|
| `deliveryType` | `local` \| `courier` \| `pickup` | How this order is fulfilled |
| `courierName` | String | e.g. Delhivery, India Post |
| `trackingId` | String | Courier tracking number |
| `trackingUrl` | String | External tracking link (auto-built for known carriers) |
| `deliveryPersonName` | String | Local delivery assignee |
| `deliveryPersonPhone` | String | For WhatsApp link to delivery page |
| `deliveryToken` | String | Unguessable token for `/deliver/:token` |
| `deliveryPhoto` | String | Cloudinary URL of proof photo |
| `deliveryOtp` | String | 4-digit OTP (hashed or plain for MVP) |
| `deliveryOtpExpiresAt` | Date | OTP expiry |
| `deliveryTimeline` | `[{ status, note, photo, at }]` | Audit trail for customer track page |

### Simplified statuses

| New status | Legacy mapping |
|------------|----------------|
| `New` | `Pending` |
| `Processing` | `Confirmed`, `Preparing` |
| `Shipped` | (courier only) |
| `OutForDelivery` | (local only) |
| `Delivered` | `Delivered`, `Completed` |
| `Cancelled` | `Cancelled` |

Helper: `backend/utils/orderStatus.js` — `normalizeOrderStatus()`, `ALL_ORDER_STATUSES`.

---

## Backend APIs

### Owner (JWT)

```
PUT /api/orders/:id/delivery
```

Body examples:

```json
{ "deliveryType": "courier", "courierName": "Delhivery", "trackingId": "DL123", "markShipped": true }
```

```json
{ "deliveryType": "local", "deliveryPersonName": "Raju", "deliveryPersonPhone": "9876543210" }
```

```json
{ "deliveryType": "pickup", "markOutForDelivery": true }
```

### Public (no auth)

```
GET  /api/public/deliver/:deliveryToken     — delivery person view
POST /api/public/deliver/:deliveryToken/photo — multipart photo upload
POST /api/public/deliver/:deliveryToken/verify-otp — { otp: "1234" }
```

---

## Data flow — local delivery with OTP

```text
Owner assigns delivery person (Orders.jsx)
  → PUT /api/orders/:id/delivery
  → generates deliveryToken, sets status OutForDelivery
  → generates deliveryOtp, WhatsApp to customer
  → WhatsApp delivery link to delivery person

Delivery person opens /deliver/:token
  → GET /api/public/deliver/:token
  → uploads photo → POST .../photo
  → enters customer OTP → POST .../verify-otp
  → order status → Delivered, timeline entry, WhatsApp to customer
```

---

## Key files

| File | Role |
|------|------|
| `backend/models/Orders.js` | Delivery + timeline fields |
| `backend/utils/orderStatus.js` | Status normalization |
| `backend/utils/courierTracking.js` | Auto-build tracking URLs |
| `backend/utils/deliveryUrl.js` | `buildDeliveryPersonUrl()` |
| `backend/utils/deliveryTimeline.js` | Append timeline events |
| `backend/controllers/orderController.js` | `updateOrderDelivery` |
| `backend/controllers/deliveryController.js` | Public deliver endpoints |
| `backend/middleware/deliveryUpload.js` | Cloudinary folder `bizbuilder/delivery` |
| `backend/services/whatsappService.js` | OTP, tracking, delivery link messages |
| `frontend/src/pages/DeliverOrder.jsx` | Delivery person mobile page |
| `frontend/src/pages/Orders.jsx` | Owner delivery controls |
| `frontend/src/pages/TrackOrder.jsx` | Courier link, photo, timeline |

---

## Environment

```env
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Delivery person links: `{FRONTEND_URL}/deliver/{deliveryToken}`

---

## Sprint 4 phases checklist

| Phase | Status | Notes |
|-------|--------|-------|
| 4A | ✅ | deliveryType, courier, owner UI, track view |
| 4B | ✅ | Delivery page + photo upload |
| 4C | ✅ | OTP generation + WhatsApp + verify |
| 4D | ⚠️ Partial | Simplified statuses; bulk actions TBD |
| 4E | ✅ | Timeline on track page |

---

## Testing each route

### Courier

1. Owner → Orders → set delivery type **Courier**, pick carrier, enter tracking ID → Save → Mark Shipped.
2. Customer opens track link → sees tracking ID + external link.

### Local delivery

1. Owner assigns name + phone → copy/WhatsApp delivery link.
2. Open `/deliver/:token` on phone → see address/items.
3. Upload photo → enter OTP from customer WhatsApp → Delivered.

### Pickup

1. Owner sets delivery type **Pickup** → mark ready (generates OTP).
2. Customer receives OTP on WhatsApp.
3. Staff enters OTP on delivery page or owner marks delivered after OTP verify.

---

*Chapter will be expanded as Sprint 4 phases complete.*
