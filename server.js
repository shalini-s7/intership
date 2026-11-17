const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for internship tasks/projects
let tasks = [
  {
    id: 1,
    title: 'Design Responsive Web Portal',
    description: 'Create a clean, modern user interface featuring responsive header, content grid, and footer components across mobile, tablet, and desktop viewports.',
    category: 'Frontend',
    priority: 'High',
    status: 'Completed',
    assignedTo: 'Shalini S',
    dueDate: '2026-11-20',
    createdAt: new Date('2026-11-15T09:00:00Z').toISOString()
  },
  {
    id: 2,
    title: 'Develop Express.js REST API',
    description: 'Build backend routes using Express framework providing GET (all), GET (single by id), and POST (create item) with JSON validation.',
    category: 'Backend',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Backend Team',
    dueDate: '2026-11-22',
    createdAt: new Date('2026-11-16T11:30:00Z').toISOString()
  },
  {
    id: 3,
    title: 'Frontend-Backend Fetch Integration',
    description: 'Connect frontend UI with backend endpoints using modern asynchronous JavaScript fetch() calls, loading spinners, and toast notifications.',
    category: 'Fullstack',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Fullstack Dev',
    dueDate: '2026-11-25',
    createdAt: new Date('2026-11-17T14:15:00Z').toISOString()
  },
  {
    id: 4,
    title: 'Database Schema Optimization',
    description: 'Benchmark query performance and prepare schema migration scripts for high-concurrency production workload.',
    category: 'Database',
    priority: 'Low',
    status: 'Pending',
    assignedTo: 'Data Engineer',
    dueDate: '2026-11-28',
    createdAt: new Date('2026-11-17T18:00:00Z').toISOString()
  }
];

let nextId = 5;

/* ==========================================================
   REST API ENDPOINTS
   ========================================================== */

/**
 * 1. GET ALL: Retrieve all tasks
 * Endpoint: GET /api/tasks
 * Optional query filters: ?category=Frontend&status=Completed&search=design
 */
app.get('/api/tasks', (req, res) => {
  try {
    let result = [...tasks];
    const { category, status, search } = req.query;

    if (category && category !== 'All') {
      result = result.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'All') {
      result = result.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
      );
    }

    res.status(200).json({
      success: true,
      count: result.length,
      total: tasks.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
      error: error.message
    });
  }
});

/**
 * 2. GET ONE: Retrieve a single task by ID
 * Endpoint: GET /api/tasks/:id
 */
app.get('/api/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID provided. ID must be an integer.'
      });
    }

    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found.`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
});

/**
 * 3. POST CREATE: Add a new task
 * Endpoint: POST /api/tasks
 * Body: { title, description, category, priority, status, assignedTo, dueDate }
 */
app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, category, priority, status, assignedTo, dueDate } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Description is required.'
      });
    }

    const newTask = {
      id: nextId++,
      title: title.trim(),
      description: description.trim(),
      category: category && category.trim() ? category.trim() : 'General',
      priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
      status: ['Pending', 'In Progress', 'Completed'].includes(status) ? status : 'Pending',
      assignedTo: assignedTo && assignedTo.trim() ? assignedTo.trim() : 'Unassigned',
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);

    res.status(201).json({
      success: true,
      message: 'Task created successfully!',
      data: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'Internship Task Management REST API'
  });
});

// Fallback route to serve index.html for single-page layout
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API Endpoints available:`);
  console.log(` - GET    /api/tasks        (Get all tasks)`);
  console.log(` - GET    /api/tasks/:id    (Get one task by ID)`);
  console.log(` - POST   /api/tasks        (Create a new task)`);
  console.log(` - GET    /api/health       (Health check)`);
});
