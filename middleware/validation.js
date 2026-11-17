const mongoose = require('mongoose');

const VALID_CATEGORIES = ['Frontend', 'Backend', 'Fullstack', 'Database', 'DevOps', 'Testing', 'General'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_STATUSES = ['Pending', 'In Progress', 'Completed'];

/**
 * Validates MongoDB ObjectId or non-empty string ID parameter
 */
const validateTaskId = (req, res, next) => {
  const { id } = req.params;

  if (!id || typeof id !== 'string' || id.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'A valid task ID parameter is required.'
    });
  }

  // Check if it's a valid MongoDB ObjectId or numeric ID
  const isObjectId = mongoose.Types.ObjectId.isValid(id);
  const isNumeric = /^\d+$/.test(id);

  if (!isObjectId && !isNumeric) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid ID format: "${id}". Must be a 24-character hex string (ObjectId) or numeric identifier.`
    });
  }

  next();
};

/**
 * Validates request body for POST /api/tasks (Create)
 */
const validateCreateTask = (req, res, next) => {
  const { title, description, category, priority, status, dueDate, assignedTo } = req.body;
  const errors = [];

  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Task title is required.' });
  } else if (title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Task title must be at least 3 characters long.' });
  } else if (title.trim().length > 100) {
    errors.push({ field: 'title', message: 'Task title cannot exceed 100 characters.' });
  }

  // Description validation
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Task description is required.' });
  } else if (description.trim().length < 5) {
    errors.push({ field: 'description', message: 'Task description must be at least 5 characters long.' });
  } else if (description.trim().length > 1000) {
    errors.push({ field: 'description', message: 'Task description cannot exceed 1000 characters.' });
  }

  // Category validation
  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    errors.push({
      field: 'category',
      message: `Invalid category "${category}". Allowed: ${VALID_CATEGORIES.join(', ')}.`
    });
  }

  // Priority validation
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push({
      field: 'priority',
      message: `Invalid priority "${priority}". Allowed: ${VALID_PRIORITIES.join(', ')}.`
    });
  }

  // Status validation
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push({
      field: 'status',
      message: `Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}.`
    });
  }

  // Due Date validation
  if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'dueDate', message: 'Invalid due date format. Must be an ISO date string (YYYY-MM-DD).' });
    }
  }

  // Assignee validation
  if (assignedTo !== undefined && typeof assignedTo === 'string' && assignedTo.length > 60) {
    errors.push({ field: 'assignedTo', message: 'Assignee name cannot exceed 60 characters.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Input validation failed. Please check the provided fields.',
      details: errors
    });
  }

  next();
};

/**
 * Validates request body for PUT /api/tasks/:id (Update)
 */
const validateUpdateTask = (req, res, next) => {
  const { title, description, category, priority, status, dueDate, assignedTo } = req.body;
  const errors = [];

  // Check that body is not empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Update payload cannot be empty. Please provide at least one field to update.'
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Task title cannot be empty.' });
    } else if (title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Task title must be at least 3 characters long.' });
    } else if (title.trim().length > 100) {
      errors.push({ field: 'title', message: 'Task title cannot exceed 100 characters.' });
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Task description cannot be empty.' });
    } else if (description.trim().length < 5) {
      errors.push({ field: 'description', message: 'Task description must be at least 5 characters long.' });
    } else if (description.trim().length > 1000) {
      errors.push({ field: 'description', message: 'Task description cannot exceed 1000 characters.' });
    }
  }

  if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
    errors.push({
      field: 'category',
      message: `Invalid category "${category}". Allowed: ${VALID_CATEGORIES.join(', ')}.`
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push({
      field: 'priority',
      message: `Invalid priority "${priority}". Allowed: ${VALID_PRIORITIES.join(', ')}.`
    });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push({
      field: 'status',
      message: `Invalid status "${status}". Allowed: ${VALID_STATUSES.join(', ')}.`
    });
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== '') {
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'dueDate', message: 'Invalid due date format. Must be an ISO date string.' });
    }
  }

  if (assignedTo !== undefined && typeof assignedTo === 'string' && assignedTo.length > 60) {
    errors.push({ field: 'assignedTo', message: 'Assignee name cannot exceed 60 characters.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Update validation failed.',
      details: errors
    });
  }

  next();
};

module.exports = {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask
};
