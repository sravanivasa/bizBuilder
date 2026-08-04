# Chapter 6 - Middleware

## Introduction

Middleware is one of the core concepts of Express.js.

A middleware is a function that executes between receiving a request and sending a response.

Every request in BizBuilder passes through multiple middleware before reaching the controller.

---

# What is Middleware?

Middleware is a function that has access to:

- Request (req)
- Response (res)
- Next Middleware (next)

General syntax:

```javascript
(req, res, next) => {

    // Do something

    next();

}
```

Calling `next()` tells Express to move to the next middleware or route handler.

---

# Why do we use Middleware?

Instead of writing the same code inside every controller, middleware allows us to write it once and reuse it.

Examples:

- Authentication
- Logging
- Security
- Validation
- Error Handling
- Parsing Request Body

---

# Request Flow

```
Client

↓

Express

↓

Middleware 1

↓

Middleware 2

↓

Middleware 3

↓

Route

↓

Controller

↓

Database

↓

Response
```

---

# Middleware Used in BizBuilder

Our project currently uses:

- express.json()
- express.urlencoded()
- CORS
- Helmet
- HPP
- Morgan
- Rate Limiter
- Auth Middleware
- Async Handler
- Global Error Handler

---

# 1. express.json()

## What is it?

Built-in Express middleware that parses JSON request bodies.

Example

```javascript
app.use(express.json());
```

Without this middleware:

```javascript
req.body
```

will be undefined.

Example Request

```json
{
    "name":"Sravani"
}
```

After parsing:

```javascript
req.body.name
```

returns

```
Sravani
```

---

# 2. express.urlencoded()

Purpose

Reads form data submitted from HTML forms.

Example

```javascript
app.use(
    express.urlencoded({
        extended: true
    })
);
```

---

# 3. CORS

Package

```
cors
```

Purpose

Allows frontend and backend running on different origins to communicate.

Example

```javascript
app.use(cors());
```

Without CORS

Browser blocks requests from different origins.

---

# 4. Helmet

Package

```
helmet
```

Purpose

Adds security-related HTTP headers.

Example

```javascript
app.use(helmet());
```

Benefits

- Prevents clickjacking
- Prevents MIME sniffing
- Improves browser security

---

# 5. HPP

Package

```
hpp
```

Purpose

Protects against HTTP Parameter Pollution attacks.

Example

Without HPP

```
/products?id=1&id=2&id=3
```

Multiple values may cause unexpected behavior.

With HPP

Only one safe value is processed.

Example

```javascript
app.use(hpp());
```

---

# 6. Morgan

Package

```
morgan
```

Purpose

Logs every incoming request.

Example

```javascript
app.use(morgan("dev"));
```

Output

```
GET /api/users 200 15ms
```

Useful for debugging and monitoring.

---

# 7. Rate Limiter

Package

```
express-rate-limit
```

Purpose

Limits the number of requests from a client within a time window.

Example

```javascript
app.use(rateLimiter);
```

Benefits

- Prevents brute-force attacks
- Reduces server abuse
- Protects login APIs

---

# 8. Auth Middleware

Purpose

Protects private routes.

Example

```javascript
router.get(
    "/profile",
    authMiddleware,
    getProfile
);
```

Flow

```
Request

↓

Authorization Header

↓

JWT Verification

↓

req.user

↓

Controller
```

---

# 9. Async Handler

Package

```
express-async-handler
```

Purpose

Automatically catches errors from async functions.

Without Async Handler

```javascript
try {

}
catch(err){

}
```

needed everywhere.

With Async Handler

```javascript
const asyncHandler = require("express-async-handler");

const registerUser = asyncHandler(async (req, res)=>{

});
```

Cleaner code.

---

# 10. Global Error Handler

Purpose

Handles all application errors from one place.

Example

```javascript
app.use(globalErrorHandler);
```

Benefits

- Consistent error responses
- Cleaner controllers
- Easier debugging

---

# Middleware Execution Order

Middleware executes in the order it is registered.

Example

```javascript
app.use(cors());

app.use(express.json());

app.use(helmet());

app.use("/api/users", userRoutes);

app.use(globalErrorHandler);
```

Execution

```
CORS

↓

JSON Parser

↓

Helmet

↓

Routes

↓

Error Handler
```

The Global Error Handler should always be registered last.

---

# How We Used Middleware in BizBuilder

Our current middleware stack:

```javascript
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(helmet());

app.use(hpp());

app.use(morgan("dev"));

app.use(rateLimiter);

app.use("/api/users", userRoutes);

app.use(globalErrorHandler);
```

Protected Route Example

```javascript
router.get(
    "/profile",
    authMiddleware,
    getProfile
);
```

---

# Why We Temporarily Commented express-mongo-sanitize

We initially added:

```javascript
app.use(mongoSanitize());
```

However, our project uses **Express 5**, and the current version of `express-mongo-sanitize` is not fully compatible.

It caused the error:

```
Cannot set property query of #<IncomingMessage> which has only a getter
```

Reason:

Express 5 changed how `req.query` works, and the middleware still expects the older Express behavior.

Current decision:

We temporarily commented it out until the package officially supports Express 5 or we use an alternative solution.

---

# Best Practices

- Register middleware before routes.
- Register the Global Error Handler last.
- Keep custom middleware in the `middleware` folder.
- Use middleware for reusable logic.
- Never write authentication logic inside every controller.

---

# Common Mistakes

❌ Forgetting `next()` in custom middleware.

❌ Registering routes before middleware.

❌ Registering the error handler before routes.

❌ Forgetting `express.json()`.

❌ Writing duplicate authentication code in controllers.

---

# Interview Questions

### What is middleware?

Middleware is a function that executes between receiving a request and sending a response.

---

### What is `next()`?

`next()` passes control to the next middleware or route handler.

---

### Why do we use middleware?

To reuse common functionality like authentication, logging, validation, and security.

---

### Why should the Global Error Handler be last?

Because it needs to catch errors from all previous middleware and routes.

---

### Difference between built-in, third-party, and custom middleware?

Built-in:
- express.json()

Third-party:
- Helmet
- Morgan
- HPP
- CORS

Custom:
- authMiddleware
- globalErrorHandler

---

# Revision Notes

- Middleware executes before controllers.
- `next()` moves to the next middleware.
- Register middleware before routes.
- Register the error handler last.
- Auth middleware protects private APIs.
- Morgan logs requests.
- Helmet improves security.
- HPP prevents parameter pollution.
- Rate Limiter prevents abuse.

---

# Summary

Middleware forms the backbone of the BizBuilder backend. Every request passes through multiple middleware layers for parsing, security, logging, validation, authentication, and error handling before reaching the controller. Proper use of middleware keeps the application secure, modular, and easy to maintain.