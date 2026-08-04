# Chapter 1 - Project Architecture

## Introduction

Before writing code, every software project needs a well-planned architecture.

Project architecture defines how the application is organized, how different modules communicate with each other, and where each piece of code belongs.

A good architecture makes a project:

- Easy to understand
- Easy to maintain
- Easy to scale
- Easy for new developers to join

BizBuilder follows a modular backend architecture where every feature has a specific responsibility.

---

# What is BizBuilder?

BizBuilder is a MERN Stack application that helps small businesses manage their daily operations.

Instead of maintaining separate notebooks, spreadsheets, and billing software, a business owner can manage everything from one application.

Current modules include:

- User Management
- Business Management
- Product Management
- Order Management

Future modules will include:

- Customer Management
- Expense Tracking
- Dashboard & Reports
- AI Features
- Delivery Management

---

# Tech Stack

## Frontend

- React.js
- React Router
- Axios
- Tailwind CSS

## Backend

- Node.js
- Express.js

## Database

- MongoDB
- Mongoose

## Authentication

- JWT (JSON Web Token)
- bcrypt

## Documentation

- Swagger (OpenAPI)

---

# Why MERN Stack?

We selected the MERN stack because:

- JavaScript is used throughout the application.
- Large developer community.
- Excellent ecosystem.
- Easy integration between frontend and backend.
- Suitable for startups and scalable applications.

---

# Project Structure

```
bizBuilder
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── validators
│   ├── docs
│   ├── uploads
│   ├── utils
│   └── server.js
│
├── frontend
│
└── project_learning
```

---

# Why do we separate folders?

## config

Contains application configuration.

Examples:

- Database Connection
- Swagger Configuration

---

## controllers

Contains business logic.

Example:

```
Register User
Login User
Create Product
Create Business
```

Controllers receive requests from routes, process them, and return responses.

---

## models

Defines MongoDB collections using Mongoose.

Example:

```
User Model
Business Model
Product Model
```

Models interact directly with the database.

---

## routes

Defines API endpoints.

Example:

```
POST /api/users/register

POST /api/users/login

GET /api/products
```

Routes decide which controller should execute.

---

## middleware

Runs before or after a request.

Examples:

- Authentication
- Helmet
- Morgan
- HPP
- Error Handler

---

## validators

Validates incoming request data.

Examples:

- Email validation
- Password validation
- Required fields

---

## docs

Contains Swagger API documentation.

Every API has its own documentation file.

---

## uploads

Stores uploaded images and files.

---

## utils

Contains reusable helper functions.

---

# Request Flow

A client request follows this flow:

```
Client
    │
    ▼
Route
    │
    ▼
Validation
    │
    ▼
Authentication Middleware
    │
    ▼
Controller
    │
    ▼
Model
    │
    ▼
MongoDB
    │
    ▼
Response
```

---

# Why do we follow this architecture?

Because each folder has one responsibility.

Benefits:

- Cleaner code
- Easier debugging
- Better scalability
- Easier testing
- Better team collaboration

---

# Best Practices

- Keep controllers small.
- Keep routes clean.
- Never write database queries inside routes.
- Keep business logic inside controllers.
- Validate every request.
- Protect private routes with authentication.
- Document every API.

---

# Common Mistakes

❌ Writing business logic inside routes.

❌ Writing database queries inside middleware.

❌ Mixing validation with controllers.

❌ Keeping everything inside server.js.

---

# Interview Questions

### What is project architecture?

Project architecture is the organization of folders, modules, and responsibilities that defines how an application is structured.

---

### Why do we separate Routes and Controllers?

Routes define API endpoints.

Controllers contain business logic.

Separating them improves readability and maintainability.

---

### Why use Middleware?

Middleware executes before or after a request to perform tasks like authentication, logging, security, and validation.

---

# Key Points to Remember

- Architecture comes before coding.
- Every folder should have one responsibility.
- Separation of concerns makes projects scalable.
- BizBuilder follows a modular backend architecture.

---

# Summary

A well-designed architecture makes development faster, debugging easier, and scaling simpler. Throughout this project, every new feature will follow this architecture to keep the codebase clean and maintainable.