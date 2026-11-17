# TaskPulse REST API & Deployment Documentation

Comprehensive API reference and cloud deployment guide for the **TaskPulse** full-stack task management platform.

---

## 🌐 Base URLs

| Environment | Base URL | Description |
| :--- | :--- | :--- |
| **Local Development** | `http://localhost:3000` | Full-stack server running Express + Static frontend |
| **Render (Backend)** | `https://<your-service>.onrender.com` | Production Express API & MongoDB connection |
| **Railway (Backend)** | `https://<your-service>.up.railway.app` | Production Express service container |
| **Vercel (Full-Stack / Frontend)** | `https://<your-app>.vercel.app` | Serverless deployment via `vercel.json` |
| **Netlify (Frontend)** | `https://<your-site>.netlify.app` | Static client deployment via `netlify.toml` |

---

## 🔐 Authentication & Authorization Architecture

- **Token Standard**: JSON Web Token (`JWT`) signed with HMAC SHA-256 (`HS256`).
- **Header Format**: `Authorization: Bearer <your_jwt_token>`
- **Password Security**: Passwords hashed with `bcryptjs` using 10 salt rounds before storage.
- **Token Expiry**: Default 7 days (`7d`), configured via `JWT_EXPIRES_IN`.

---

## 📡 Authentication Endpoints

### 1. Register User (Signup)
Creates a new user account with bcrypt password hashing and returns an initial JWT.

- **Method**: `POST`
- **URL**: `/api/auth/register` (alias: `/api/auth/signup`)
- **Protected**: No
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "name": "Shalini S",
    "email": "shalini@example.com",
    "password": "password123"
  }
  ```
- **Validation Rules**:
  - `name`: Required string, min 2 chars, max 50 chars.
  - `email`: Required, valid email format regex, unique.
  - `password`: Required string, min 6 chars.
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account created successfully!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "673a388f8b4d1a2f90111111",
      "name": "Shalini S",
      "email": "shalini@example.com",
      "role": "user"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Input validation failed.
  - `409 Conflict`: Email already registered.

---

### 2. Login User
Verifies credentials using `bcrypt.compare` and returns a signed JWT.

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Protected**: No
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "shalini@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "673a388f8b4d1a2f90111111",
      "name": "Shalini S",
      "email": "shalini@example.com",
      "role": "user"
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "success": false,
    "error": "Unauthorized",
    "message": "Invalid email or password."
  }
  ```

---

### 3. Get Current User Profile
Retrieves authenticated user details from verified JWT.

- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Protected**: **Yes (`Bearer <token>`)**
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "673a388f8b4d1a2f90111111",
      "name": "Shalini S",
      "email": "shalini@example.com",
      "role": "user"
    }
  }
  ```
- **Error Response (401 Unauthorized)**: Token invalid, missing, or expired.

---

## 📋 Task Management Endpoints (CRUD)

### 1. Get All Tasks (Search, Filter, Pagination)
Retrieves paginated tasks with optional multi-field search and category/status filtering.

- **Method**: `GET`
- **URL**: `/api/tasks`
- **Protected**: No
- **Query Parameters**:
  | Param | Type | Default | Description |
  | :--- | :--- | :--- | :--- |
  | `page` | Integer | `1` | Page number to retrieve |
  | `limit` | Integer | `6` | Number of tasks per page (max 50) |
  | `search` | String | None | Case-insensitive regex query on `title`, `description`, and `assignedTo` |
  | `category` | String | `All` | Filter by `Frontend`, `Backend`, `Fullstack`, `Database`, `DevOps`, `Testing`, `General` |
  | `status` | String | `All` | Filter by `Pending`, `In Progress`, `Completed` |
  | `sortBy` | String | `createdAt` | Field to sort by |
  | `order` | String | `desc` | `asc` or `desc` |
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 6,
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalTasks": 15,
      "limit": 6,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "data": [
      {
        "id": "673a388f8b4d1a2f90111111",
        "title": "Design Responsive Web Portal",
        "description": "Create a clean, modern user interface...",
        "category": "Frontend",
        "priority": "High",
        "status": "Completed",
        "assignedTo": "Shalini S",
        "createdBy": "Shalini S",
        "dueDate": "2026-11-20T00:00:00.000Z",
        "createdAt": "2026-11-15T09:00:00.000Z",
        "updatedAt": "2026-11-15T09:00:00.000Z"
      }
    ]
  }
  ```

---

### 2. Get Single Task by ID
Retrieves single task document.

- **Method**: `GET`
- **URL**: `/api/tasks/:id`
- **Protected**: No
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "673a388f8b4d1a2f90111111",
      "title": "Design Responsive Web Portal",
      "description": "...",
      "category": "Frontend",
      "priority": "High",
      "status": "Completed",
      "assignedTo": "Shalini S",
      "createdBy": "Shalini S",
      "dueDate": "2026-11-20T00:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Invalid ID format (must be 24-char hex ObjectId or numeric).
  - `404 Not Found`: Task does not exist.

---

### 3. Create Task
Creates a new task in MongoDB. Validates input schema constraints.

- **Method**: `POST`
- **URL**: `/api/tasks`
- **Protected**: **Yes (`Bearer <token>`)**
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_jwt_token>`
- **Request Body**:
  ```json
  {
    "title": "Build GraphQL Gateway",
    "description": "Construct Apollo Federation microservices gateway with schema stitching.",
    "category": "Backend",
    "priority": "High",
    "status": "Pending",
    "assignedTo": "Backend Lead",
    "dueDate": "2026-11-30"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Task created successfully.",
    "data": {
      "id": "673a388f8b4d1a2f90999999",
      "title": "Build GraphQL Gateway",
      "description": "Construct Apollo Federation...",
      "category": "Backend",
      "priority": "High",
      "status": "Pending",
      "assignedTo": "Backend Lead",
      "createdBy": "Shalini S",
      "createdAt": "2026-11-17T21:00:00.000Z"
    }
  }
  ```

---

### 4. Update Task by ID
Updates existing task document with Mongoose `runValidators: true`.

- **Method**: `PUT`
- **URL**: `/api/tasks/:id`
- **Protected**: **Yes (`Bearer <token>`)**
- **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <your_jwt_token>`
- **Request Body (Partial or Full)**:
  ```json
  {
    "status": "Completed",
    "priority": "Low"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task updated successfully.",
    "data": { ... }
  }
  ```

---

### 5. Delete Task by ID
Deletes task record permanently from database.

- **Method**: `DELETE`
- **URL**: `/api/tasks/:id`
- **Protected**: **Yes (`Bearer <token>`)**
- **Headers**:
  - `Authorization: Bearer <your_jwt_token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Task #673a388f8b4d1a2f90999999 deleted successfully.",
    "data": { ... }
  }
  ```

---

### 6. Health Probe
- **Method**: `GET`
- **URL**: `/api/health`
- **Protected**: No
- **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "database": "connected (MongoDB Atlas)",
    "databaseReadyState": 1,
    "uptime": 142.5,
    "timestamp": "2026-11-17T21:15:00.000Z",
    "service": "TaskPulse Mongoose CRUD REST API"
  }
  ```

---

## 🚀 Production Deployment Guide

### Option A: Backend on Render (Free Tier)
1. Navigate to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** &rarr; **Web Service**.
3. Connect your GitHub repository: `https://github.com/shalini-s7/intership`.
4. Configure settings:
   - **Name**: `taskpulse-backend`
   - **Region**: Closest to you (e.g. Frankfurt, Oregon, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `JWT_SECRET`: `your_random_secure_jwt_secret`
   - `JWT_EXPIRES_IN`: `7d`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskpulse?retryWrites=true&w=majority`
6. Click **Create Web Service**. Your live backend URL will be:
   `https://taskpulse-backend.onrender.com`

---

### Option B: Backend on Railway (Free Trial)
1. Go to [railway.app](https://railway.app).
2. Click **New Project** &rarr; **Deploy from GitHub repo**.
3. Select `shalini-s7/intership`.
4. In **Variables**, add:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: `your_secure_jwt_secret`
   - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskpulse?retryWrites=true&w=majority`
5. In **Settings** &rarr; **Networking**, click **Generate Domain**.

---

### Option C: Frontend on Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import Git Repository `shalini-s7/intership`.
3. Vercel automatically detects [`vercel.json`](../vercel.json).
4. Add environment variables if deploying full-stack:
   - `JWT_SECRET`: `your_jwt_secret`
   - `MONGODB_URI`: `mongodb+srv://...`
5. Click **Deploy**. Your live app will be:
   `https://intership-shalini-s7.vercel.app`

---

### Option D: Frontend on Netlify
1. Go to [app.netlify.com/start](https://app.netlify.com/start).
2. Connect GitHub & choose `shalini-s7/intership`.
3. Netlify automatically reads [`netlify.toml`](../netlify.toml):
   - **Publish directory**: `public`
   - **Build command**: `npm run build`
4. Click **Deploy Site**.
