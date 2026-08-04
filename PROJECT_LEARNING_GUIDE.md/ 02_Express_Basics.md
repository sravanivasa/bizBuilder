# Chapter 2 - Express Basics

## Introduction

Express.js is a lightweight and fast web framework built on top of Node.js.

It simplifies backend development by providing tools to create APIs, handle requests, manage routes, use middleware, and send responses.

In BizBuilder, Express is the backbone of our backend application.

---

# What is Express?

Express is a Node.js framework used to build web applications and REST APIs.

Instead of writing everything using the built-in Node.js HTTP module, Express provides a cleaner and more organized way to handle server-side logic.

---

# Why are we using Express in BizBuilder?

We chose Express because it:

- Makes API development simple
- Supports middleware
- Makes routing easy
- Works well with MongoDB
- Has a huge community
- Is widely used in production applications

---

# Real-Life Analogy

Imagine a restaurant.

- Customer → Client
- Waiter → Express
- Chef → Controller
- Kitchen → Database

The customer tells the waiter what they want.

The waiter takes the request to the chef.

The chef prepares the food.

The waiter returns the food to the customer.

Express acts like the waiter.

---

# Installing Express

```bash
npm install express
```

---

# Creating an Express App

```javascript
const express = require("express");

const app = express();
```

## Explanation

### require("express")

Imports the Express package.

### express()

Creates an Express application.

Think of this as creating your backend server.

---

# Starting the Server

```javascript
const PORT = 5000;

app.listen(PORT, () => {
    console.log("Server is running...");
});
```

## How it works

app.listen() tells Express to start listening for incoming requests.

Once the server starts, it waits for clients to send requests.

---

# HTTP Methods

Express supports all HTTP methods.

## GET

Used to retrieve data.

Example:

```javascript
app.get("/users", (req, res) => {

});
```

---

## POST

Used to create new data.

Example:

```javascript
app.post("/users", (req, res) => {

});
```

---

## PUT

Used to update an entire resource.

Example:

```javascript
app.put("/users/:id", (req, res) => {

});
```

---

## PATCH

Used to update part of a resource.

Example:

```javascript
app.patch("/users/:id", (req, res) => {

});
```

---

## DELETE

Used to delete data.

Example:

```javascript
app.delete("/users/:id", (req, res) => {

});
```

---

# Route

A route defines which function should execute for a specific URL and HTTP method.

Example:

```javascript
app.get("/", (req, res) => {
    res.send("Hello World");
});
```

Here,

URL

```
/
```

Method

```
GET
```

Controller

```
(req, res) => {}
```

---

# Request Object (req)

The request object contains information sent by the client.

Examples:

```javascript
req.body
```

Contains request body.

```javascript
req.params
```

Contains URL parameters.

```javascript
req.query
```

Contains query parameters.

```javascript
req.headers
```

Contains request headers.

Example:

```http
Authorization: Bearer token
Content-Type: application/json
```

---

# Response Object (res)

The response object is used to send data back to the client.

Example:

```javascript
res.send("Hello");
```

Returns text.

---

Example:

```javascript
res.json({
    success: true
});
```

Returns JSON.

---

Example:

```javascript
res.status(201).json({
    success: true
});
```

Returns JSON with HTTP status code.

---

# Middleware

Middleware is a function that executes between receiving a request and sending a response.

Example:

```javascript
app.use(express.json());
```

This middleware converts JSON request bodies into JavaScript objects.

Without it,

```javascript
req.body
```

will be undefined.

---

Another example:

```javascript
app.use(cors());
```

Allows frontend applications from different origins to access the backend.

---

# app.use()

app.use() registers middleware.

Example:

```javascript
app.use(express.json());

app.use(cors());

app.use("/api/users", userRoutes);
```

Middleware executes in the order it is registered.

---

# express.json()

Purpose:

Reads incoming JSON data.

Example request:

```json
{
    "name": "Sravani",
    "email": "sravani@gmail.com"
}
```

Without express.json(),

```javascript
req.body
```

is undefined.

With express.json(),

```javascript
req.body
```

becomes

```javascript
{
    name: "Sravani",
    email: "sravani@gmail.com"
}
```

---

# express.urlencoded()

Purpose:

Reads form data.

Example:

```
name=Sravani&age=25
```

Mostly used for HTML form submissions.

---

# Request Lifecycle

```
Client
    │
    ▼
Express Server
    │
    ▼
Middleware
    │
    ▼
Route
    │
    ▼
Controller
    │
    ▼
Database
    │
    ▼
Response
```

---

# How Express is Used in BizBuilder

Our server starts here:

```javascript
const app = express();
```

We register middleware:

```javascript
app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));
```

We register routes:

```javascript
app.use("/api/users", userRoutes);

app.use("/api/products", productRoutes);

app.use("/api/businesses", businessRoutes);

app.use("/api/orders", orderRoutes);
```

Finally,

```javascript
app.listen(PORT);
```

starts the server.

---

# Best Practices

- Keep server.js clean.
- Move routes into separate files.
- Keep business logic inside controllers.
- Register middleware before routes.
- Register the global error handler last.

---

# Common Mistakes

❌ Forgetting express.json()

Result:

```
req.body === undefined
```

---

❌ Registering routes before middleware

Middleware may never execute.

---

❌ Writing business logic inside routes

Always move logic to controllers.

---

❌ Registering error middleware before routes

The error handler should be the last middleware.

---

# Interview Questions

### What is Express?

Express is a lightweight web framework for Node.js used to build web applications and REST APIs.

---

### What is app.use()?

app.use() registers middleware or routes.

Middleware runs in the order it is added.

---

### Why do we use express.json()?

It converts incoming JSON into JavaScript objects so we can access request data using req.body.

---

### Difference between req.body, req.params and req.query?

req.body

Data sent in the request body.

Example:

```json
{
    "name": "Sravani"
}
```

---

req.params

Data sent in the URL.

Example:

```
/users/10
```

id = 10

---

req.query

Data after ?

Example:

```
/products?category=mobile&page=2
```

---

### Difference between app.get() and app.use()

app.get()

Runs only for GET requests.

app.use()

Runs for all HTTP methods unless a path is specified.

---

# Revision Notes (1-Minute Recap)

- Express is a Node.js framework.
- express() creates the application.
- app.listen() starts the server.
- app.use() registers middleware.
- express.json() parses JSON.
- Routes define endpoints.
- req contains client data.
- res sends data back.
- Middleware executes before controllers.
- Controllers contain business logic.

---

# Summary

Express is the foundation of our backend.

Every API request in BizBuilder passes through Express, middleware, routes, controllers, and finally reaches the database before returning a response.

Understanding Express thoroughly makes learning authentication, validation, middleware, and advanced backend concepts much easier.