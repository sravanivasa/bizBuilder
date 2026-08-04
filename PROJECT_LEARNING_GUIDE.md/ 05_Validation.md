# Chapter 5 - Request Validation (express-validator)

## Introduction

Validation is the process of checking whether the data sent by the client is correct before processing it.

Every backend should validate incoming data to prevent invalid, incomplete, or malicious requests.

In BizBuilder, we use **express-validator** to validate API requests.

---

# What is Validation?

Validation ensures that incoming request data follows the expected format.

Examples:

- Email should be valid
- Password should have minimum length
- Name should not be empty
- Phone number should contain only digits

Without validation, incorrect data could be stored in the database.

---

# Why are we using Validation in BizBuilder?

We validate requests to:

- Prevent invalid data
- Improve application security
- Give meaningful error messages
- Reduce bugs
- Protect the database

---

# Why express-validator?

There are many validation libraries:

- Joi
- Zod
- Yup
- express-validator

We chose **express-validator** because:

- Works directly with Express middleware
- Easy to read
- Easy to maintain
- Lightweight
- Industry standard for Express applications

---

# Real-Life Analogy

Imagine applying for a passport.

Before accepting your application, the officer checks:

- Name entered?
- Date of birth entered?
- Photo attached?
- Signature present?

Only after validation is your application accepted.

Similarly,

Our API validates every request before processing it.

---

# Installation

```bash
npm install express-validator
```

---

# How Validation Works

Request

↓

Validation Rules

↓

validationResult()

↓

If errors

↓

Return 400

↓

Else

↓

Controller

---

# Creating Validation Rules

Example

```javascript
const { body } = require("express-validator");

const registerValidation = [

    body("name")
        .notEmpty()
        .withMessage("Name is required"),

    body("email")
        .isEmail()
        .withMessage("Invalid email"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password should be at least 6 characters")

];
```

Purpose

Each rule checks one field.

---

# Using Validation

Example

```javascript
router.post(
    "/register",
    ...registerValidation,
    registerUser
);
```

Notice

Validation runs **before** the controller.

---

# validationResult()

Example

```javascript
const { validationResult } = require("express-validator");

const errors = validationResult(req);

if (!errors.isEmpty()) {

    return res.status(400).json({

        success: false,

        message: "Validation failed",

        errors: errors.array()

    });

}
```

Purpose

Collects all validation errors.

If there are errors,

the controller stops executing.

---

# Example

Request

```json
{
    "email":"abc",
    "password":"12"
}
```

Response

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "msg":"Invalid email"
        },
        {
            "msg":"Password should be at least 6 characters"
        }
    ]
}
```

---

# Common Validators

Required

```javascript
.notEmpty()
```

---

Email

```javascript
.isEmail()
```

---

Minimum Length

```javascript
.isLength({ min: 6 })
```

---

Maximum Length

```javascript
.isLength({ max: 50 })
```

---

Number

```javascript
.isNumeric()
```

---

Boolean

```javascript
.isBoolean()
```

---

Optional Field

```javascript
.optional()
```

---

Trim Spaces

```javascript
.trim()
```

---

Convert Email to Lowercase

```javascript
.normalizeEmail()
```

---

Escape HTML Characters

```javascript
.escape()
```

---

# Custom Messages

Example

```javascript
body("email")
.isEmail()
.withMessage("Please enter a valid email")
```

Custom messages provide better user feedback.

---

# How We Used Validation in BizBuilder

We created:

```
validators/

    userValidator.js
```

Inside

```javascript
registerValidation

loginValidation
```

Routes

```javascript
router.post(

"/register",

...registerValidation,

registerUser
);
```

Controller

```javascript
validationResult(req)
```

If validation fails,

the API returns

400 Bad Request.

---

# Why Validate Before Controller?

Without validation

↓

Controller executes

↓

Database query runs

↓

Extra processing

↓

Possible invalid data

With validation

↓

Request rejected immediately

↓

Controller never runs

↓

Database remains clean

---

# Best Practices

- Validate every request
- Keep validators in a separate folder
- Use meaningful error messages
- Never trust client-side validation alone
- Validate before controller execution

---

# Common Mistakes

❌ Forgetting validationResult()

❌ Writing validation inside controllers

❌ Not returning after validation fails

❌ Trusting frontend validation only

---

# Interview Questions

### What is request validation?

Validation checks whether incoming request data is correct before processing.

---

### Why do we use express-validator?

It provides middleware-based validation for Express applications.

---

### What is validationResult()?

It collects all validation errors generated by express-validator.

---

### Why validate on the backend if the frontend already validates?

Frontend validation improves user experience.

Backend validation protects the server and database.

Frontend validation can be bypassed.

---

### Why keep validators in a separate folder?

To keep routes and controllers clean and improve code reusability.

---

# Revision Notes

- Validate every request
- Validation runs before controller
- validationResult() collects errors
- Return 400 for invalid input
- Keep validators separate
- Never trust client data

---

# Summary

Validation is the first line of defense for every API.

In BizBuilder, express-validator ensures that only valid requests reach our controllers, helping us maintain clean data, improve security, and provide better error messages.