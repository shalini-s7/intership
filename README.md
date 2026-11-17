# TaskPulse - Full-Stack Task & Project Platform

A clean, responsive full-stack web application engineered with an **Express.js** backend, **MongoDB Atlas** database, **Mongoose Schemas** with strict input validation, and complete **CRUD RESTful endpoints** (`POST`, `GET`, `PUT`, `DELETE`). The frontend is connected asynchronously via modern JavaScript `fetch()`.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/shalini-s7/intership)
[![Database: MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![ORM: Mongoose](https://img.shields.io/badge/ODM-Mongoose%208.x-red)](https://mongoosejs.com/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Features & Architecture Overview

1. **Database Layer (MongoDB Atlas Free Tier)**:
   - Configured with `mongoose` connection manager (`config/db.js`).
   - Supports MongoDB Atlas connection string (`MONGODB_URI` via `.env`).
   - Seamless fallback in-memory store so the app can be tested out-of-the-box even before entering database credentials.

2. **Mongoose Schema & Models (`models/Task.js`)**:
   - `title`: String, required, trimmed, min 3, max 100 characters.
   - `description`: String, required, trimmed, min 5, max 1000 characters.
   - `category`: String, required, enum (`Frontend`, `Backend`, `Fullstack`, `Database`, `DevOps`, `Testing`, `General`).
   - `priority`: String, required, enum (`High`, `Medium`, `Low`), default `Medium`.
   - `status`: String, required, enum (`Pending`, `In Progress`, `Completed`), default `Pending`.
   - `assignedTo`: String, trimmed, max 60 characters.
   - `dueDate`: Date format validation.
   - `timestamps: true`: Automatic `createdAt` and `updatedAt`.
   - Optimized compound and text indexes.

3. **Complete RESTful CRUD Endpoints (`routes/taskRoutes.js`)**:
   - **`POST /api/tasks`**: Create a new task with strict validation.
   - **`GET /api/tasks`**: Retrieve all tasks with query filtering (`category`, `status`, `search`, `sortBy`).
   - **`GET /api/tasks/:id`**: Retrieve single task by ID.
   - **`PUT /api/tasks/:id`**: Update existing task by ID with `runValidators: true`.
   - **`DELETE /api/tasks/:id`**: Delete a task by ID.
   - **`GET /api/health`**: Real-time server and database connection status check.

4. **Input Validation & Error Handling Middleware**:
   - `middleware/validation.js`: Validates required fields, character lengths, enum options, date formats, and ID integrity before hitting database controllers.
   - `middleware/errorHandler.js`: Intercepts Mongoose `ValidationError`, `CastError`, duplicate key errors, syntax errors, and sends standard HTTP error codes (`400`, `404`, `500`).

5. **Responsive Frontend UI (`public/`)**:
   - Header with mobile hamburger navigation, status badge, and GitHub links.
   - Metric overview cards (Total, Completed, In Progress, Pending).
   - Task creation form with real-time field validation and spinner.
   - Search box and dropdown filters.
   - Task cards with **Details (GET)**, **Edit (PUT)**, and **Delete (DELETE)** interactive triggers.
   - Modal dialogs for viewing single task and updating task fields.
   - Floating toast notification alerts.

---

## 📁 Project Directory Structure

```text
intership/
├── .env                   # Local environment variables (ignored by Git)
├── .env.example           # Template for environment variables
├── .gitignore             # Git ignore file (node_modules, .env, logs)
├── package.json           # Dependencies and scripts
├── package-lock.json      # Exact dependency tree
├── server.js              # Express app entry point
├── README.md              # Complete project documentation
├── config/
│   └── db.js              # MongoDB Atlas connection handler
├── models/
│   └── Task.js            # Mongoose Schema & model definition
├── routes/
│   └── taskRoutes.js      # Express router for CRUD operations
├── middleware/
│   ├── validation.js      # Input validation middleware
│   └── errorHandler.js    # Global error handling middleware
└── public/
    ├── index.html         # Responsive semantic UI (Header, Content, Footer, Modals)
    ├── css/
    │   └── styles.css     # CSS custom variables, Grid, Flexbox, media queries
    └── js/
        └── app.js         # Frontend fetch() async CRUD client logic
```

---

## 🚀 REST API Specification

| Method | Endpoint | Action | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/api/tasks` | Create new task | JSON task payload | `201 Created`, `400 Bad Request` |
| **GET** | `/api/tasks` | Read all tasks | Query params (optional) | `200 OK`, `500 Server Error` |
| **GET** | `/api/tasks/:id` | Read single task by ID | None | `200 OK`, `400 Invalid ID`, `404 Not Found` |
| **PUT** | `/api/tasks/:id` | Update task by ID | Partial / full JSON payload | `200 OK`, `400 Bad Request`, `404 Not Found` |
| **DELETE** | `/api/tasks/:id` | Delete task by ID | None | `200 OK`, `400 Invalid ID`, `404 Not Found` |
| **GET** | `/api/health` | Service & DB status | None | `200 OK` |

### Sample POST / PUT Request Body:
```json
{
  "title": "Setup MongoDB Atlas Replica Set",
  "description": "Configure connection strings, database users, and IP whitelisting.",
  "category": "Database",
  "priority": "High",
  "status": "In Progress",
  "assignedTo": "Shalini S",
  "dueDate": "2026-11-28"
}
```

### Sample Validation Error Response (HTTP 400):
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Input validation failed. Please check the provided fields.",
  "details": [
    {
      "field": "title",
      "message": "Task title must be at least 3 characters long."
    },
    {
      "field": "description",
      "message": "Task description is required."
    }
  ]
}
```

---

## 🍃 MongoDB Atlas Setup Guide (Free Tier M0)

Follow these steps to connect your own free MongoDB Atlas cluster:

1. **Sign Up / Log In**:
   Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register for a free account.
2. **Create a Free Cluster**:
   Choose the **Shared M0 (Free)** tier and select your nearest AWS/Google Cloud region.
3. **Create Database User**:
   In **Database Access**, click **Add New Database User**. Choose **Password Authentication**, enter a username (e.g. `shalini`) and password, and assign **Read and write to any database** privileges.
4. **Configure Network Access**:
   In **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`) or add your current IP.
5. **Obtain Connection String**:
   Click **Database** &rarr; **Connect** &rarr; **Drivers** (Node.js). Copy your connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskpulse?retryWrites=true&w=majority
   ```
6. **Add to `.env`**:
   Create or edit `.env` in the root folder:
   ```env
   PORT=3000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/taskpulse?retryWrites=true&w=majority
   ```

---

## 🛠️ Installation & Local Execution

### 1. Clone Repository
```bash
git clone https://github.com/shalini-s7/intership.git
cd intership
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```

### 4. Open Application
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Testing with cURL / Postman

```bash
# 1. Create a task (POST)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Dockerize Application","description":"Build multi-stage Dockerfile","category":"DevOps","priority":"High","status":"Pending","assignedTo":"DevOps Lead"}'

# 2. Get all tasks (GET)
curl http://localhost:3000/api/tasks

# 3. Get single task by ID (GET)
curl http://localhost:3000/api/tasks/<task_id>

# 4. Update task (PUT)
curl -X PUT http://localhost:3000/api/tasks/<task_id> \
  -H "Content-Type: application/json" \
  -d '{"status":"Completed","priority":"Low"}'

# 5. Delete task (DELETE)
curl -X DELETE http://localhost:3000/api/tasks/<task_id>
```

---

## 👩‍💻 Author

- **GitHub**: [@shalini-s7](https://github.com/shalini-s7)
- **Repository**: [shalini-s7/intership](https://github.com/shalini-s7/intership)
