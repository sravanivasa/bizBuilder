# Chapter 9 - React Frontend Setup

## Introduction

In Sprint 1 Step 1, we created the React owner dashboard foundation.

The frontend is what business owners see in the browser. It talks to the Express backend using HTTP requests.

---

# What we installed

| Package | Purpose |
|---------|---------|
| `vite` | Fast dev server and build tool |
| `react` | UI library |
| `react-router-dom` | Pages and URLs (`/login`, `/products`) |
| `@reduxjs/toolkit` | Global state (auth token, user) |
| `axios` | HTTP client to call backend APIs |
| `react-i18next` + `i18next` | English, Telugu, Hindi translations |
| `tailwindcss` | Utility CSS for styling |

---

# Folder structure

```text
frontend/src/
├── api/           # Backend calls
├── components/    # Reusable UI (Navbar, Layout)
├── pages/         # Full screens (Login, Dashboard)
├── store/         # Redux auth state
├── i18n/          # Translation files
├── App.jsx        # Route definitions
└── main.jsx       # App entry point
```

---

# How the app starts

1. Browser loads `index.html`
2. `main.jsx` runs
3. Redux `Provider` wraps the app (global state)
4. `App.jsx` sets up routes
5. User visits a URL → React shows the matching page

---

# Key files explained

## `src/api/axios.js`

Creates one axios instance with:

- `baseURL` from `VITE_API_URL` (points to backend)
- Interceptor that adds `Authorization: Bearer <token>` on every request after login

## `src/store/authSlice.js`

Redux slice for authentication:

- `token` — JWT from backend
- `user` — logged-in user object
- `setCredentials` — save token after login
- `logout` — clear token

Token is also saved in `localStorage` so refresh keeps user logged in.

## `src/components/ProtectedRoute.jsx`

If user is not logged in → redirect to `/login`.

Used for Dashboard, Products, Orders, Business pages.

## `src/i18n/`

- `en.json`, `te.json`, `hi.json` — same keys, different languages
- UI uses `t("login")` instead of hardcoded English
- Language choice saved in `localStorage`

---

# Environment variable

`frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Only variables starting with `VITE_` are visible to React code.

---

# How to run

Terminal 1 (backend):

```bash
cd backend
npm start
```

Terminal 2 (frontend):

```bash
cd frontend
npm run dev
```

Open: `http://localhost:5173`

---

# What is NOT built yet (Step 2+)

- Login / Register forms connected to API
- Business setup form
- Product CRUD with image upload
- Orders list and status update

---

# Next step

**Sprint 1 Step 2:** Build Login and Register pages wired to `/api/users/login` and `/api/users/register`.
