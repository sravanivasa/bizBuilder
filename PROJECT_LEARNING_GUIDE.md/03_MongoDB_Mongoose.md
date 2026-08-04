# Chapter 3 - MongoDB & Mongoose

## Introduction

Every backend application needs a database to store and retrieve data.

BizBuilder uses **MongoDB**, a NoSQL database, along with **Mongoose**, an Object Data Modeling (ODM) library for Node.js.

MongoDB stores data in flexible JSON-like documents, making it an excellent choice for modern web applications.

---

# What is MongoDB?

MongoDB is a NoSQL database that stores data in **collections** and **documents** instead of tables and rows.

Unlike SQL databases, MongoDB allows flexible document structures.

---

# Why are we using MongoDB in BizBuilder?

We chose MongoDB because:

- Flexible schema
- Easy integration with Node.js
- Fast development
- Excellent scalability
- Stores JSON-like documents
- Perfect for MERN Stack applications

---

# What is Mongoose?

Mongoose is an ODM (Object Data Modeling) library.

It acts as a bridge between our Express application and MongoDB.

Instead of writing raw MongoDB queries, Mongoose provides models and methods.

---

# Why do we use Mongoose?

Without Mongoose:

- More complex queries
- No schema validation
- No models

With Mongoose:

- Schemas
- Models
- Validation
- Middleware
- Cleaner code

---

# Real-Life Analogy

Imagine a school.

School = Database

Classrooms = Collections

Students = Documents

Student Admission Form = Schema

School Rules = Validation

Principal = Mongoose

Teachers cannot admit students randomly.

Every student must follow the admission form.

Similarly,

Mongoose ensures every document follows the schema before storing it.

---

# SQL vs MongoDB

| SQL | MongoDB |
|------|----------|
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |

Example SQL

```
Users Table
```

| id | name | email |

---

MongoDB

```json
{
    "_id":"123",
    "name":"Sravani",
    "email":"sravani@gmail.com"
}
```

---

# Collection

A collection stores similar documents.

Example

```
users
```

```
products
```

```
businesses
```

---

# Document

A document represents one record.

Example

```json
{
    "name":"Sravani",
    "email":"sravani@gmail.com"
}
```

---

# Schema

A Schema defines the structure of a document.

Example

```javascript
const userSchema = new mongoose.Schema({

    name: String,

    email: String,

    password: String

});
```

Schema tells MongoDB:

Every user should have

- name
- email
- password

---

# Model

A Model is created using a schema.

Example

```javascript
const User = mongoose.model("User", userSchema);
```

The model allows us to interact with the database.

---

# Connecting MongoDB

In BizBuilder we created

```
config/db.js
```

Example

```javascript
mongoose.connect(process.env.MONGO_URI);
```

Purpose

Connects our backend to MongoDB.

Without this connection, database operations will fail.

---

# How MongoDB Works in BizBuilder

Flow

```
Client

↓

Route

↓

Controller

↓

User Model

↓

MongoDB

↓

Response
```

---

# CRUD Operations

## Create

```javascript
await User.create({

    name,

    email,

    password

});
```

Adds a new document.

---

## Read

```javascript
await User.find();
```

Returns all users.

---

Read One

```javascript
await User.findOne({

    email

});
```

Returns the first matching document.

---

Find By Id

```javascript
await User.findById(id);
```

Finds a document using its ObjectId.

---

## Update

```javascript
await User.findByIdAndUpdate(id, data);
```

Updates an existing document.

---

## Delete

```javascript
await User.findByIdAndDelete(id);
```

Deletes a document.

---

# Query Operators

Greater Than

```javascript
{

price:

{

$gt:100

}

}
```

Returns products with price greater than 100.

---

Less Than

```javascript
{

price:

{

$lt:100

}

}
```

---

Greater Than or Equal

```javascript
{

price:

{

$gte:100

}

}
```

---

Less Than or Equal

```javascript
{

price:

{

$lte:100

}

}
```

---

Not Equal

```javascript
{

status:

{

$ne:"inactive"

}

}
```

---

In

```javascript
{

category:

{

$in:["Food","Clothing"]

}

}
```

---

Exists

```javascript
{

email:

{

$exists:true

}

}
```

---

# Important Note

```
findOne()
```

returns

only ONE document.

Even if multiple documents match, it returns the first matching document.

```
find()
```

returns ALL matching documents.

Example

```javascript
User.findOne({

email:

{

$exists:true

}

});
```

Returns

First user whose email exists.

---

Example

```javascript
User.find({

email:

{

$exists:true

}

});
```

Returns

All users having an email.

---

# Validation

Example

```javascript
email:{

type:String,

required:true,

unique:true

}
```

Purpose

Ensures correct data before storing.

---

# How We Used MongoDB in BizBuilder

We created

```
User Model
```

using Mongoose.

During registration

```javascript
User.create()
```

During login

```javascript
User.findOne({

email

})
```

For profile

```javascript
User.findById()
```

This allows authentication to work correctly.

---

# Best Practices

- Keep schemas simple.
- Use validation.
- Use indexes for frequently searched fields.
- Never expose passwords.
- Always hash passwords before saving.

---

# Common Mistakes

❌ Forgetting to await queries.

❌ Using findOne() when find() is needed.

❌ Not handling null responses.

❌ Storing plain text passwords.

---

# Interview Questions

### What is MongoDB?

MongoDB is a NoSQL document database.

---

### What is Mongoose?

Mongoose is an ODM library that provides schemas and models for MongoDB.

---

### Difference between Collection and Document?

Collection contains documents.

Document is one individual record.

---

### Difference between Schema and Model?

Schema defines structure.

Model performs database operations.

---

### Difference between find() and findOne()?

find()

Returns an array.

findOne()

Returns only the first matching document.

---

### Why do we use await?

Database operations are asynchronous.

await waits until MongoDB returns the result.

---

# Revision Notes

- MongoDB stores documents.
- Collections store documents.
- Schemas define structure.
- Models interact with MongoDB.
- find() returns many.
- findOne() returns one.
- create() inserts.
- findById() searches by id.
- Mongoose validates data.

---

# Summary

MongoDB is the database used in BizBuilder, while Mongoose provides schemas, models, and easy database operations.

Every authentication, business, product, and order operation in our application relies on Mongoose models to communicate with MongoDB safely and efficiently.