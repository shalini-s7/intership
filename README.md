# TaskPulse - Full-Stack Web Application

A clean, responsive web application with an **Express.js** backend and dynamic **vanilla JavaScript** frontend connecting to a RESTful API via `fetch()`. Built for the full-stack internship submission.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?logo=github)](https://github.com/shalini-s7/intership)
[![Node.js Version](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Project Overview

This project satisfies all requirements for the full-stack internship assessment:
1. **Responsive Frontend UI**: Clean layout structured with semantic `<header>`, `<main class="content">`, and `<footer>`. Fully responsive on mobile, tablet, and desktop.
2. **Express.js Backend**: Initialized with `npm init`, Express dependencies installed, and modular server setup in `server.js`.
3. **3 REST API Endpoints**:
   - `GET /api/tasks` — Retrieve all tasks (supports query filtering).
   - `GET /api/tasks/:id` — Retrieve a single task by ID.
   - `POST /api/tasks` — Create a new task with JSON validation.
4. **Asynchronous API Integration**: Frontend uses modern `fetch()` to communicate seamlessly with backend endpoints, including live state updates, loading spinners, and toast alerts.
5. **Version Control**: Complete source code structured and pushed to GitHub.

---

## 📁 Project Directory Structure

```text
intership/
├── .gitignore             # Ignores node_modules, temp logs, OS files
├── package.json           # Dependencies and project metadata
├── package-lock.json      # Dependency lockfile
├── server.js              # Express backend and REST API routes
├── README.md              # Documentation and instructions
└── public/                # Static frontend assets
    ├── index.html         # Semantic HTML5 markup (Header, Content, Footer, Modal)
    ├── css/
    │   └── styles.css     # Clean responsive styling, CSS variables & media queries
    └── js/
        └── app.js         # Client-side fetch() API calls & DOM interactions
```

---

## 🚀 REST API Specification

| Method | Endpoint | Description | Request Body | Response Status |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/tasks` | Fetch list of all tasks | None | `200 OK` |
| **GET** | `/api/tasks/:id` | Fetch single task by numeric ID | None | `200 OK` or `404 Not Found` |
| **POST** | `/api/tasks` | Create a new task | JSON Object (see schema below) | `201 Created` or `400 Bad Request` |
| **GET** | `/api/health` | Server uptime & status check | None | `200 OK` |

### Sample POST Request Body:
```json
{
  "title": "Build Authentication Module",
  "description": "Implement secure authentication tokens and middleware guards.",
  "category": "Backend",
  "priority": "High",
  "status": "In Progress",
  "assignedTo": "Shalini S",
  "dueDate": "2026-11-25"
}
```

---

## 💻 Frontend & UI Features

- **Semantic Layout**:
  - **Header**: Brand identity, responsive navigation links, mobile hamburger menu, GitHub shortcut.
  - **Content (Main)**:
    - Welcome hero banner with live metric counter cards.
    - Responsive two-column workspace (Left: Task creation form; Right: Task grid).
    - Real-time search filter and category/status dropdowns.
    - Interactive "View Details" trigger calling `GET /api/tasks/:id` to display modal.
  - **Footer**: Brand summary, server status badge, tech stack breakdown, and GitHub repository links.
- **Asynchronous Data Layer (`fetch`)**:
  - `loadTasks()`: Calls `GET /api/tasks` to render dynamic task cards.
  - `viewTaskDetails(id)`: Calls `GET /api/tasks/:id` to populate single-task modal dialog.
  - `handleFormSubmit()`: Calls `POST /api/tasks` with JSON payload and refreshes state.
- **Responsive Design**: Fluid grid and flexbox layout optimized for all device sizes (`mobile < 768px`, `tablet 768px-1024px`, `desktop > 1024px`).

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16.x or higher)
- [npm](https://www.npmjs.com/) (v8.x or higher)
- [Git](https://git-scm.com/)

### 2. Clone the Repository
```bash
git clone https://github.com/shalini-s7/intership.git
cd intership
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Application
```bash
npm start
```
By default, the server runs on `http://localhost:3000`.

### 5. Access the Web App
Open your favorite browser and visit:
```
http://localhost:3000
```

---

## 🧪 Testing the API via cURL

You can also test the endpoints directly from your command line:

```bash
# 1. GET all tasks
curl http://localhost:3000/api/tasks

# 2. GET single task by ID
curl http://localhost:3000/api/tasks/1

# 3. POST create a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"API Testing","description":"Verify endpoint status codes","category":"Testing","priority":"High","status":"Completed","assignedTo":"QA Lead"}'
```

---

## 👩‍💻 Author

- **GitHub Profile**: [@shalini-s7](https://github.com/shalini-s7)
- **Repository**: [shalini-s7/intership](https://github.com/shalini-s7/intership)
