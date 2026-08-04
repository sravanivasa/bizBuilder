# Chapter 7 - Swagger (OpenAPI)

## Introduction

As backend applications grow, keeping track of APIs becomes difficult.

Swagger (OpenAPI) solves this problem by automatically generating interactive API documentation from our code.

Instead of manually documenting APIs in Word or PDF files, Swagger provides a live documentation website where developers can understand and test APIs.

In BizBuilder, we use Swagger to document every API endpoint.

---

# What is Swagger?

Swagger is a set of tools used to design, document, and test REST APIs.

It generates a web interface that displays:

- Available APIs
- Request format
- Response format
- Required parameters
- Authentication
- Status codes

Developers can also execute APIs directly from the browser.

---

# Why are we using Swagger in BizBuilder?

We use Swagger because it:

- Documents APIs automatically
- Makes frontend-backend integration easier
- Allows testing without Postman
- Keeps documentation synchronized with code
- Looks professional

---

# Why not manually document APIs?

Without Swagger

Developer

↓

Reads README

↓

Reads Controller

↓

Reads Route

↓

Guesses Request Format

↓

Calls API

With Swagger

Developer

↓

Opens

```
/api-docs
```

↓

Reads Documentation

↓

Clicks Execute

↓

Gets Response

Much faster.

---

# Packages Used

## swagger-jsdoc

Purpose

Reads Swagger comments and generates the OpenAPI specification.

Installation

```bash
npm install swagger-jsdoc
```

---

## swagger-ui-express

Purpose

Displays the generated documentation in a browser.

Installation

```bash
npm install swagger-ui-express
```

---

# Swagger Configuration

We created

```
config/swagger.js
```

Example

```javascript
const swaggerJsdoc = require("swagger-jsdoc");

const options = {

    definition: {

        openapi: "3.0.0",

        info: {

            title: "Business Management API",

            version: "1.0.0",

            description: "API documentation for BizBuilder"

        },

        servers: [

            {

                url: "http://localhost:5000"

            }

        ]

    },

    apis: ["./docs/**/*.js"]

};

module.exports = swaggerJsdoc(options);
```

---

# Why do we use

```javascript
apis: ["./docs/**/*.js"]
```

The pattern

```
**/*.js
```

means

Search every JavaScript file inside the docs folder and all its subfolders.

Example

```
docs/

users/

register.swagger.js

login.swagger.js

products/

create.swagger.js
```

All these files are automatically scanned.

---

# How Swagger Works

```
Swagger Comments

↓

swagger-jsdoc

↓

OpenAPI Specification

↓

swagger-ui-express

↓

Browser

↓

http://localhost:5000/api-docs
```

---

# Folder Structure

```
docs/

components/

schemas.swagger.js

responses.swagger.js

users/

register.swagger.js

login.swagger.js

profile.swagger.js

getAllUsers.swagger.js
```

Every API has its own documentation file.

This keeps the project clean and easy to maintain.

---

# Components

Components are reusable definitions.

Instead of writing the same schema repeatedly, define it once and reuse it.

---

# Schemas

Schemas describe data structures.

Example

```
User

Business

Product

Order
```

Usage

```yaml
user:

$ref: '#/components/schemas/User'
```

Benefits

- Reusable
- Consistent
- Easy to update

---

# Responses

Responses describe common API responses.

Examples

```
ValidationError

Unauthorized

NotFound

ServerError
```

Usage

```yaml
400:

$ref: '#/components/responses/ValidationError'
```

Benefits

- No duplication
- Standard response format
- Easier maintenance

---

# What is $ref?

$ref tells Swagger to reuse an existing component.

Instead of writing the same object repeatedly,

we simply reference it.

Example

```yaml
$ref: '#/components/schemas/User'
```

---

# Security Schemes

Swagger supports multiple authentication methods.

Our project uses JWT Bearer Authentication.

Configuration

```javascript
components: {

securitySchemes: {

bearerAuth: {

type: "http",

scheme: "bearer",

bearerFormat: "JWT"

}

}

}
```

---

# Meaning of Each Property

## type

```
http
```

Authentication is sent using HTTP headers.

---

## scheme

```
bearer
```

Swagger sends

```
Authorization: Bearer <token>
```

---

## bearerFormat

```
JWT
```

Indicates the token format.

---

# Protecting APIs

Protected APIs include

```yaml
security:

- bearerAuth: []
```

Swagger automatically displays the Authorize button.

---

# Using the Authorize Button

1. Register or Login.
2. Copy the JWT token.
3. Open Swagger.
4. Click Authorize.
5. Paste only the JWT token.
6. Click Authorize.

Swagger automatically sends

```
Authorization: Bearer <token>
```

with every protected request.

---

# Swagger Workflow in BizBuilder

Whenever we create a new API

↓

Build Controller

↓

Create Route

↓

Test API

↓

Create Swagger File

↓

Reuse Schemas

↓

Reuse Responses

↓

Verify in Swagger UI

---

# How We Organized Swagger

Initially,

Swagger comments were inside route files.

Problems

- Route files became very long.
- Hard to read.
- Difficult to maintain.

We improved the project by moving every API into its own documentation file.

Example

```
register.swagger.js

login.swagger.js

profile.swagger.js
```

This keeps route files clean.

---

# Common Issues We Faced

## Swagger Loading Forever

Cause

Invalid YAML indentation.

Solution

Correct the indentation and restart the server.

---

## Missing APIs

Cause

Swagger file path not included.

Solution

Use

```javascript
apis: ["./docs/**/*.js"]
```

---

## Security Not Working

Cause

Forgot to add

```yaml
security:

- bearerAuth: []
```

to protected endpoints.

---

# Best Practices

- One Swagger file per API
- Keep route files clean
- Reuse schemas
- Reuse responses
- Document every endpoint
- Test using Swagger before committing

---

# Common Mistakes

❌ Writing all Swagger comments inside routes.

❌ Duplicating schemas.

❌ Duplicating responses.

❌ Forgetting Bearer Authentication.

❌ Incorrect YAML indentation.

---

# Interview Questions

### What is Swagger?

Swagger is an API documentation framework that generates interactive API documentation.

---

### Why use Swagger?

To document, test, and share REST APIs efficiently.

---

### What is OpenAPI?

OpenAPI is the specification used by Swagger to describe REST APIs.

---

### What is $ref?

A reusable reference to an existing component.

---

### Difference between Schema and Response?

Schema

Defines data structure.

Response

Defines API response.

---

### Why separate Swagger files?

Improves readability and maintainability.

---

# Revision Notes

- Swagger documents APIs.
- swagger-jsdoc generates documentation.
- swagger-ui-express displays it.
- Components avoid duplication.
- Schemas define data.
- Responses define API outputs.
- $ref reuses components.
- bearerAuth enables JWT authentication.

---

# Summary

Swagger has become an important part of the BizBuilder project. It allows us to maintain clean, interactive, and reusable API documentation while keeping our route files organized. By using reusable schemas, reusable responses, and JWT security definitions, our API documentation is scalable and easy to maintain.