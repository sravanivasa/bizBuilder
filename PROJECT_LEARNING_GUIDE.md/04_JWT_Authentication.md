# Chapter 4 - JWT Authentication

## Introduction

Authentication is the process of verifying the identity of a user.

Before allowing access to protected resources, the server must confirm that the user is who they claim to be.

In BizBuilder, we use **JWT (JSON Web Token)** for authentication and **bcrypt** for password hashing.

---

# Authentication vs Authorization

Authentication

"Who are you?"

Example:

Logging into your account.

---

Authorization

"What are you allowed to access?"

Example:

Only logged-in users can view their profile.

Admins can delete users.

---

# What is JWT?

JWT (JSON Web Token) is a secure token used to identify a logged-in user.

Instead of sending the user's password on every request, the client sends the JWT token.

The server verifies the token and identifies the user.

---

# Why are we using JWT in BizBuilder?

We use JWT because it:

- Is stateless
- Is secure
- Is widely used
- Works well with REST APIs
- Can be used by web and mobile applications

---

# Real-Life Analogy

Imagine entering a movie theater.

1. You buy a ticket.
2. The ticket proves you paid.
3. Every time someone checks, you show the ticket.

You don't buy another ticket every few minutes.

JWT works the same way.

Login once.

Receive a token.

Show the token for every protected request.

---

# JWT Structure

A JWT has three parts.

```
Header.Payload.Signature
```

Example

```
xxxxx.yyyyy.zzzzz
```

---

## Header

Contains token information.

Example

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

---

## Payload

Contains user information.

Example

```json
{
  "id": "6a7184c32be0f10e7df88d73"
}
```

Never store passwords inside the payload.

---

## Signature

Used to verify that the token has not been modified.

Generated using:

- Header
- Payload
- Secret Key

---

# JWT Flow in BizBuilder

```
Register

↓

Password hashed

↓

Stored in MongoDB

↓

Login

↓

Password compared

↓

JWT created

↓

Token returned

↓

Client stores token

↓

Protected Request

↓

Authorization Header

↓

Auth Middleware

↓

Token Verified

↓

Controller

↓

Response
```

---

# Password Hashing with bcrypt

Passwords should never be stored as plain text.

Instead, we hash them.

Example

```javascript
const hashedPassword = await bcrypt.hash(password, 10);
```

Purpose

Converts the password into a secure hash.

---

# Why Hash Passwords?

Without hashing

```
Password123
```

is stored directly.

If the database is leaked, everyone can see passwords.

With hashing

```
$2b$10$CZUUxlzbJTdAJI1sBh4Nte...
```

The original password cannot be retrieved.

---

# Comparing Passwords

During login

```javascript
const isMatch = await bcrypt.compare(
    password,
    user.password
);
```

Purpose

Checks whether the entered password matches the stored hash.

---

# Creating JWT

Example

```javascript
const token = jwt.sign(
    {
        id: user._id
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "7d"
    }
);
```

Explanation

Payload

```javascript
{
    id: user._id
}
```

Stored inside the token.

---

JWT Secret

```
process.env.JWT_SECRET
```

Used to sign the token.

Only the server knows this secret.

---

Expiration

```
7d
```

Token becomes invalid after seven days.

---

# Sending Token

Login Response

```json
{
    "success": true,
    "token": "eyJhbGc..."
}
```

The frontend stores this token.

---

# Authorization Header

Every protected request sends

```
Authorization: Bearer eyJhbGc...
```

Header Name

```
Authorization
```

Header Value

```
Bearer <JWT Token>
```

---

# Why "Bearer"?

Bearer tells the server

"The person carrying this token should be authenticated."

---

# Auth Middleware

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
Client

↓

Authorization Header

↓

Auth Middleware

↓

jwt.verify()

↓

req.user

↓

Controller
```

---

# Verifying Token

Example

```javascript
jwt.verify(
    token,
    process.env.JWT_SECRET
);
```

Purpose

Checks

- Signature
- Expiration
- Secret

If valid

Returns payload.

If invalid

Returns Unauthorized.

---

# How We Used JWT in BizBuilder

Registration

- Password hashed using bcrypt.

Login

- User searched using findOne().
- Password compared.
- JWT generated.
- Token returned.

Profile

- Client sends Authorization header.
- Middleware verifies JWT.
- User information is attached to req.user.
- Controller returns the profile.

---

# Best Practices

- Never store passwords in JWT.
- Never expose JWT_SECRET.
- Always hash passwords.
- Set token expiration.
- Use HTTPS in production.
- Protect private routes.

---

# Common Mistakes

❌ Saving plain passwords.

❌ Using weak JWT secrets.

❌ Forgetting Bearer before token.

❌ Not checking token expiration.

❌ Returning password in API responses.

---

# Interview Questions

### What is JWT?

JWT is a secure token used for authentication between client and server.

---

### Difference between Authentication and Authorization?

Authentication verifies identity.

Authorization checks permissions.

---

### Why do we hash passwords?

To prevent storing passwords in plain text.

---

### Difference between bcrypt.hash() and bcrypt.compare()?

hash()

Creates a password hash.

compare()

Checks whether a password matches the stored hash.

---

### What is Bearer Token?

A JWT sent inside the Authorization header.

---

### Why do we use JWT_SECRET?

To sign and verify JWT tokens.

Only the server should know this secret.

---

# Revision Notes

- JWT = Authentication
- bcrypt = Password hashing
- compare() = Password verification
- sign() = Generate token
- verify() = Validate token
- Authorization header carries JWT
- Auth middleware protects private routes

---

# Summary

JWT provides secure authentication without storing sessions on the server.

In BizBuilder, users register with hashed passwords, log in to receive a JWT, and use that token to access protected APIs such as the profile endpoint.