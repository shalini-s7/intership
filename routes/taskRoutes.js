const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
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
    dueDate: '2026-11-24',
    createdAt: new Date('2026-11-17T12:00:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T12:00:00Z').toISOString()
  },
  {
    id: '673a388f8b4d1a2f90444444',
    _id: '673a388f8b4d1a2f90444444',
    title: 'Client-Side CRUD Fetch Integration',
    description: 'Connect frontend UI with backend endpoints using modern asynchronous JavaScript fetch() calls for POST, GET, PUT, and DELETE.',
    category: 'Fullstack',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: 'Shalini S',
    dueDate: '2026-11-26',
    createdAt: new Date('2026-11-17T14:15:00Z').toISOString(),
    updatedAt: new Date('2026-11-17T14:15:00Z').toISOString()
  }
];

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * -------------------------------------------------------------------------
 * 1. GET ALL TASKS
 * Endpoint: GET /api/tasks
 * Query Params: category, status, search, sortBy, order
 * -------------------------------------------------------------------------
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, status, search, sortBy = 'createdAt', order = 'desc' } = req.query;

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

      const sortOptions = {};
      sortOptions[sortBy] = order === 'asc' ? 1 : -1;

      const tasks = await Task.find(query).sort(sortOptions);

      return res.status(200).json({
        success: true,
        source: 'mongodb',
        count: tasks.length,
        data: tasks
      });
    }

    // Fallback in-memory filter
    let results = [...fallbackTasks];

    if (category && category !== 'All') {
      results = results.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== 'All') {
      results = results.filter(t => t.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.assignedTo.toLowerCase().includes(q)
      );
    }

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({
      success: true,
      source: 'memory-fallback',
      count: results.length,
      data: results
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
 * 3. POST CREATE TASK
 * Endpoint: POST /api/tasks
 * Body: { title, description, category, priority, status, assignedTo, dueDate }
 * -------------------------------------------------------------------------
 */
router.post('/', validateCreateTask, async (req, res, next) => {
  try {
    const { title, description, category, priority, status, assignedTo, dueDate } = req.body;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category || 'General',
      priority: priority || 'Medium',
      status: status || 'Pending',
      assignedTo: assignedTo && assignedTo.trim() ? assignedTo.trim() : 'Unassigned',
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
 * 4. PUT UPDATE TASK BY ID
 * Endpoint: PUT /api/tasks/:id
 * Body: partial or full update fields
 * -------------------------------------------------------------------------
 */
router.put('/:id', validateTaskId, validateUpdateTask, async (req, res, next) => {
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
        new: true, // Return updated document
        runValidators: true // Enforce schema validations on update
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
 * 5. DELETE TASK BY ID
 * Endpoint: DELETE /api/tasks/:id
 * -------------------------------------------------------------------------
 */
router.delete('/:id', validateTaskId, async (req, res, next) => {
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
