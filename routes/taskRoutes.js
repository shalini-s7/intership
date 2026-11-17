const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');
const {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask
} = require('../middleware/validation');

// Fallback in-memory store in case MongoDB Atlas is not yet connected
let fallbackTasks = [
  {
    id: '673a388f8b4d1a2f90111111',
    _id: '673a388f8b4d1a2f90111111',
    title: 'Design Responsive Web Portal',
    description: 'Create a clean, modern user interface featuring responsive header, content grid, and footer components across mobile, tablet, and desktop viewports.',
    category: 'Frontend',
    priority: 'High',
    status: 'Completed',
    assignedTo: 'Shalini S',
    createdBy: 'Shalini S',
    dueDate: '2026-11-20',
    createdAt: new Date('2026-11-15T09:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-15T09:00:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90222222',
    _id: '673a388f8b4d1a2f90222222',
    title: 'Develop Express.js REST API with Mongoose',
    description: 'Build backend routes using Express and Mongoose schemas providing POST, GET, PUT, and DELETE CRUD operations with input validation.',
    category: 'Backend',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Backend Team',
    createdBy: 'Backend Team',
    dueDate: '2026-11-22',
    createdAt: new Date('2026-11-16T11:30:00Z').toISOString(),
    updatedAt: new Date('2026-11-16T11:30:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90333333',
    _id: '673a388f8b4d1a2f90333333',
    title: 'MongoDB Atlas Free Tier Database Setup',
    description: 'Configure MongoDB Atlas cluster, define Mongoose models, indexes, and environment variables.',
    category: 'Database',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'DBA / Fullstack',
    createdBy: 'Lead Architect',
    dueDate: '2026-11-24',
    createdAt: new Date('2026-11-17T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T12:00:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90444444',
    _id: '673a388f8b4d1a2f90444444',
    title: 'JWT Authentication & Protected Middleware',
    description: 'Implement bcrypt password hashing, login token generation, and auth guard middleware to secure CRUD routes.',
    category: 'Backend',
    priority: 'High',
    status: 'Completed',
    assignedTo: 'Security Engineer',
    createdBy: 'Security Engineer',
    dueDate: '2026-11-25',
    createdAt: new Date('2026-11-17T13:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T13:00:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90555555',
    _id: '673a388f8b4d1a2f90555555',
    title: 'Client-Side CRUD Fetch Integration',
    description: 'Connect frontend UI with backend endpoints using modern asynchronous JavaScript fetch() calls for POST, GET, PUT, and DELETE.',
    category: 'Fullstack',
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Shalini S',
    createdBy: 'Shalini S',
    dueDate: '2026-11-26',
    createdAt: new Date('2026-11-17T14:15:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T14:15:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90666666',
    _id: '673a388f8b4d1a2f90666666',
    title: 'Pagination & Multi-Field Search Features',
    description: 'Add server-side pagination with page and limit parameters, search by title/desc/assignee, and responsive UI page switcher.',
    category: 'Fullstack',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: 'Fullstack Dev',
    createdBy: 'Fullstack Dev',
    dueDate: '2026-11-27',
    createdAt: new Date('2026-11-17T15:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T15:00:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90777777',
    _id: '673a388f8b4d1a2f90777777',
    title: 'Automated Test Suite & GitHub Actions',
    description: 'Write integration test scripts covering authentication, validation rules, pagination, and API error codes.',
    category: 'Testing',
    priority: 'Low',
    status: 'Pending',
    assignedTo: 'QA Lead',
    createdBy: 'QA Lead',
    dueDate: '2026-11-30',
    createdAt: new Date('2026-11-17T16:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T16:00:00Z').toISOString()
  }
];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * -------------------------------------------------------------------------
 * 1. GET ALL TASKS (SEARCH, FILTER & PAGINATION)
 * Endpoint: GET /api/tasks
 * Query Params: page, limit, search, category, status, sortBy, order
 * -------------------------------------------------------------------------
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 6,
      search,
      category,
      status,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 6));
    const skip = (pageNum - 1) * limitNum;

    if (isDbConnected()) {
      const query = {};

      if (category && category !== 'All') {
        query.category = category;
      }

      if (status && status !== 'All') {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { assignedTo: { $regex: search, $options: 'i' } }
        ];
      }

      const totalTasks = await Task.countDocuments(query);
      const totalPages = Math.ceil(totalTasks / limitNum) || 1;

      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      const tasks = await Task.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum);

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        count: tasks.length,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalTasks,
          limit: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        data: tasks
      });
    }

    // In-Memory Fallback Filter & Pagination
    let filtered = [...fallbackTasks];

    if (category && category !== 'All') {
      filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'All') {
      filtered = filtered.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))
      );
    }

    // Sorting
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalTasks = filtered.length;
    const totalPages = Math.ceil(totalTasks / limitNum) || 1;
    const paginated = filtered.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: paginated.length,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTasks,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      data: paginated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * -------------------------------------------------------------------------
 * 2. GET SINGLE TASK BY ID
 * Endpoint: GET /api/tasks/:id
 * -------------------------------------------------------------------------
 */
router.get('/:id', validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      const task = await Task.findById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        data: task
      });
    }

    // Fallback in-memory search
    const task = fallbackTasks.find(t => t.id === id || t._id === id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task with ID ${id} was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      data: task
    });
  } catch (error) {
    next(error);
  }
});

/**
 * -------------------------------------------------------------------------
 * 3. POST CREATE TASK (PROTECTED ROUTE)
 * Endpoint: POST /api/tasks
 * Headers: Authorization: Bearer <token>
 * -------------------------------------------------------------------------
 */
router.post('/', protect, validateCreateTask, async (req, res, next) => {
  try {
    const { title, description, category, priority, status, assignedTo, dueDate } = req.body;

    const creatorName = req.user && req.user.name ? req.user.name : 'Authenticated User';

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'General',
      priority: priority || 'Medium',
      status: status || 'Pending',
      assignedTo: assignedTo && assignedTo.trim() ? assignedTo.trim() : creatorName,
      createdBy: creatorName,
      dueDate: dueDate || undefined
    };

    if (isDbConnected()) {
      const newTask = await Task.create(payload);

      return res.status(201).json({
        success: true,
        source: 'mongodb',
        message: 'Task created successfully in MongoDB Atlas.',
        data: newTask
      });
    }

    // Fallback in-memory creation
    const generatedId = new mongoose.Types.ObjectId().toString();
    const newTask = {
      id: generatedId,
      _id: generatedId,
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fallbackTasks.unshift(newTask);

    return res.status(201).json({
      success: true,
      source: 'memory-fallback',
      message: 'Task created successfully.',
      data: newTask
    });
  } catch (error) {
    next(error);
  }
});

/**
 * -------------------------------------------------------------------------
 * 4. PUT UPDATE TASK BY ID (PROTECTED ROUTE)
 * Endpoint: PUT /api/tasks/:id
 * Headers: Authorization: Bearer <token>
 * -------------------------------------------------------------------------
 */
router.put('/:id', protect, validateTaskId, validateUpdateTask, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      const updatedTask = await Task.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true
      });

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        message: 'Task updated successfully in MongoDB Atlas.',
        data: updatedTask
      });
    }

    // Fallback in-memory update
    const index = fallbackTasks.findIndex(t => t.id === id || t._id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task with ID ${id} was not found.`
      });
    }

    const current = fallbackTasks[index];
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    fallbackTasks[index] = updated;

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      message: 'Task updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

/**
 * -------------------------------------------------------------------------
 * 5. DELETE TASK BY ID (PROTECTED ROUTE)
 * Endpoint: DELETE /api/tasks/:id
 * Headers: Authorization: Bearer <token>
 * -------------------------------------------------------------------------
 */
router.delete('/:id', protect, validateTaskId, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      const deletedTask = await Task.findByIdAndDelete(id);

      if (!deletedTask) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: `Task with ID ${id} was not found.`
        });
      }

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        message: `Task #${id} deleted successfully.`,
        data: deletedTask
      });
    }

    // Fallback in-memory delete
    const index = fallbackTasks.findIndex(t => t.id === id || t._id === id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Task with ID ${id} was not found.`
      });
    }

    const removed = fallbackTasks.splice(index, 1)[0];

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      message: `Task #${id} deleted successfully.`,
      data: removed
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
