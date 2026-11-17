require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const { connectDB } = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas (or fallback if URI not set)
connectDB();

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected (MongoDB Atlas)' : 'in-memory mode';
  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    databaseReadyState: mongoose.connection.readyState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TaskPulse Mongoose CRUD REST API'
  });
});

// Fallback to serve index.html for SPA frontend routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
  next();
});

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.originalUrl} does not exist.`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 TaskPulse Server is running on http://localhost:${PORT}`);
  console.log(`📡 Authentication Endpoints:`);
  console.log(`   - POST   /api/auth/register (Bcrypt password hashing & JWT)`);
  console.log(`   - POST   /api/auth/login    (Verify credentials & return JWT)`);
  console.log(`   - GET    /api/auth/me       (Protected with JWT middleware)`);
  console.log(`📡 Task Management Endpoints:`);
  console.log(`   - GET    /api/tasks         (Search & pagination: ?search=&page=&limit=)`);
  console.log(`   - GET    /api/tasks/:id     (Get single task by ID)`);
  console.log(`   - POST   /api/tasks         (Protected: Create task)`);
  console.log(`   - PUT    /api/tasks/:id     (Protected: Update task)`);
  console.log(`   - DELETE /api/tasks/:id     (Protected: Delete task)`);
  console.log(`   - GET    /api/health        (Database & Server status)`);
  console.log(`======================================================\n`);
});

module.exports = app;
