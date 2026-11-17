const mongoose = require('mongoose');

/**
 * Task Schema Definition
 * Implements strict type checking, required constraints, and custom validators
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [100, 'Task title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      minlength: [5, 'Task description must be at least 5 characters long'],
      maxlength: [1000, 'Task description cannot exceed 1000 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: ['Frontend', 'Backend', 'Fullstack', 'Database', 'DevOps', 'Testing', 'General'],
        message: '{VALUE} is not an accepted category'
      },
      default: 'General'
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: '{VALUE} is not an accepted priority (must be High, Medium, or Low)'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: '{VALUE} is not an accepted status (must be Pending, In Progress, or Completed)'
      },
      default: 'Pending'
    },
    assignedTo: {
      type: String,
      trim: true,
      default: 'Unassigned',
      maxlength: [60, 'Assignee name cannot exceed 60 characters']
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function(value) {
          if (!value) return true;
          return !isNaN(new Date(value).getTime());
        },
        message: 'Invalid due date format'
      }
    }
  },
  {
    timestamps: true, // Automatically provides createdAt and updatedAt
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      }
    }
  }
);

// Add index on title, category, and status for faster querying
taskSchema.index({ title: 'text', description: 'text' });
taskSchema.index({ category: 1, status: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

module.exports = Task;

