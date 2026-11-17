# TaskPulse - Full-Stack Secure Task Management Platform

A clean, responsive full-stack web application engineered with an **Express.js** backend, **MongoDB Atlas** database, **Bcrypt password hashing**, **JWT authentication middleware**, strict **Mongoose Schemas**, **complete CRUD endpoints**, and **server-side search & pagination**. The client is connected asynchronously via modern JavaScript `fetch()`.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/shalini-s7/intership)
[![Security: Bcrypt & JWT](https://img.shields.io/badge/Security-Bcrypt%20%2B%20JWT-purple?logo=jsonwebtokens)](https://jwt.io/)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![ODM: Mongoose](https://img.shields.io/badge/ODM-Mongoose%208.x-red)](https://mongoosejs.com/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Architecture & Features Overview

### 1. Authentication & Security
- **Registration (`POST /api/auth/register` or `/signup`)**:
  - Validates `name`, `email` (regex checked), and `password` (minimum 6 characters).
  - Automatically hashes user passwords with `bcryptjs` using 10 salt rounds before saving.
  - Returns a signed JSON Web Token (`JWT`) with user metadata.
- **Login (`POST /api/auth/login`)**:
  - Verifies user email and compares password using `bcrypt.compare`.
  - Returns a signed JWT token on valid credentials (`401 Unauthorized` on mismatch).
- **JWT Protection Middleware (`middleware/auth.js`)**:
  - Guard middleware that validates the `Authorization: Bearer <token>` header.
  - Verifies JWT signatures, extracts user payload, and attaches `req.user`.
  - Blocks unauthorized requests to protected routes (`POST`, `PUT`, `DELETE`).
- **Profile Endpoint (`GET /api/auth/me`)**:
  - Protected endpoint returning the current authenticated user's profile.

### 2. Database & Data Models
- **Mongoose User Schema (`models/User.js`)**:
  - Fields: `name`, `email` (unique, lowercase), `password` (hashed, hidden by default), `role` (`user` / `admin`).
  - Pre-save hook for bcrypt password hashing and `matchPassword` instance method.
- **Mongoose Task Schema (`models/Task.js`)**:
  - Fields: `title`, `description`, `category`, `priority`, `status`, `assignedTo`, `createdBy`, `dueDate`, `timestamps`.
  - Compound and text indexes for fast querying.
- **MongoDB Atlas Integration (`config/db.js`)**:
  - Free tier M0 connection via `MONGODB_URI` environment variable.
  - Automatic fallback in-memory store for instant zero-config testing.

### 3. Server-Side Features: Search & Pagination
- **Multi-Field Search**:
  - Search query (`?search=...`) performs case-insensitive regex filtering across `title`, `description`, and `assignedTo`.
- **Dynamic Pagination**:
  - Pagination query (`?page=1&limit=6`) computes page slices, offsets, `totalPages`, and returns navigation flags (`hasNextPage`, `hasPrevPage`).
- **Filtering & Sorting**:
  - Supports `category`, `status`, `sortBy`, and `order` query parameters.

### 4. Responsive Frontend UI (`public/`)
- **Authentication System**:
  - Sign In / Register tabs modal with client-side validation.
  - Header profile chip displaying user avatar and name when logged in.
  - One-click demo credentials auto-fill (`shalini@example.com` / `password123`).
  - Safe token storage in `localStorage` (`taskpulse_token`).
- **Interactive CRUD & Pagination**:
  - Search bar with debounced live querying.
  - Responsive pagination bar with page switcher buttons and items-per-page dropdown.
  - View Details modal (GET :id), Edit Task modal (PUT :id), and Delete task action (DELETE :id).

---

## 📁 Project Directory Structure

```text
intership/
├── .env                   # Local environment variables (JWT_SECRET, MONGODB_URI)
├── .env.example           # Template for environment variables
├── .gitignore             # Git ignore file (node_modules, .env, logs)
├── package.json           # Dependencies and scripts
├── package-lock.json      # Exact dependency tree
├── server.js              # Express app entry point & route mounting
├── README.md              # Complete project documentation
├── config/
│   └── db.js              # MongoDB Atlas connection handler
├── models/
│   ├── User.js            # Mongoose User schema with bcrypt pre-save hook
│   └── Task.js            # Mongoose Task schema & model definition
├── routes/
│   ├── authRoutes.js      # Auth router: /register, /login, /me
│   └── taskRoutes.js      # Task router: CRUD, search, pagination
├── middleware/
│   ├── auth.js            # JWT verification & token generator middleware
│   ├── validation.js      # Input validation middleware
│   └── errorHandler.js    # Global error handling middleware
└── public/
    ├── index.html         # Responsive semantic UI with Auth & CRUD Modals
    ├── css/styles.css     # CSS custom variables, Grid, Flexbox, media queries
    └── js/app.js          # Client-side async fetch() with JWT auth header
```

---

## 🚀 Complete REST API Specification

### Authentication Endpoints
| Method | Endpoint | Description | Protected | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register user (bcrypt hash) | No | `{ name, email, password }` | `201 Created`, `400 Bad Request`, `409 Conflict` |
| **POST** | `/api/auth/login` | Verify credentials & get JWT | No | `{ email, password }` | `200 OK`, `400 Bad Request`, `401 Unauthorized` |
| **GET** | `/api/auth/me` | Get authenticated user | **Yes (JWT)** | None | `200 OK`, `401 Unauthorized` |

### Task Management Endpoints
| Method | Endpoint | Description | Protected | Query / Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Read tasks (search & paginate) | No | `?search=&page=&limit=` | `200 OK` |
| **GET** | `/api/tasks/:id` | Read single task by ID | No | None | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **POST** | `/api/tasks` | Create new task | **Yes (JWT)** | JSON task payload | `201 Created`, `400 Bad Request`, `401 Unauthorized` |
| **PUT** | `/api/tasks/:id` | Update task by ID | **Yes (JWT)** | Partial / full JSON payload | `200 OK`, `400 Bad Request`, `401`, `404` |
| **DELETE** | `/api/tasks/:id` | Delete task by ID | **Yes (JWT)** | None | `200 OK`, `401 Unauthorized`, `404 Not Found` |
| **GET** | `/api/health` | Service & DB status check | No | None | `200 OK` |

---

## 🧪 Testing with cURL / API Clients

```bash
# 1. Register a new user (password is hashed with bcrypt)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Shalini S","email":"shalini@example.com","password":"password123"}'

# 2. Login to obtain JWT Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shalini@example.com","password":"password123"}'

# Save the returned token:
# TOKEN="your_jwt_token_here"

# 3. Access protected user profile
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Create task with JWT Bearer Token
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Implement Redis Caching","description":"Cache high-traffic task queries","category":"Backend","priority":"High","status":"Pending"}'

# 5. Search tasks with pagination
curl "http://localhost:3000/api/tasks?search=Redis&page=1&limit=5"

# 6. Update task with JWT Bearer Token
curl -X PUT http://localhost:3000/api/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"Completed"}'

# 7. Delete task with JWT Bearer Token
curl -X DELETE http://localhost:3000/api/tasks/<task_id> \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🛠️ Quick Start

```bash
# 1. Clone repository
git clone https://github.com/shalini-s7/intership.git
cd intership

# 2. Install dependencies
npm install

# 3. Configure .env (optional for MongoDB Atlas)
# Copy .env.example to .env and insert MONGODB_URI if connecting to Atlas

# 4. Start the application
npm start

# 5. Open browser
# Navigate to http://localhost:3000
```

---

## 👩‍💻 Author

- **GitHub**: [@shalini-s7](https://github.com/shalini-s7)
- **Repository**: [shalini-s7/intership](https://github.com/shalini-s7/intership)
