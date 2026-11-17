const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// In-memory fallback user store in case MongoDB Atlas is not yet connected
const fallbackUsers = [];

// Seed an initial demo user into in-memory store
(async () => {
  const hashedPassword = await bcrypt.hash('password123', 10);
  fallbackUsers.push({
    id: '673a388f8b4d1a2f90999999',
    _id: '673a388f8b4d1a2f90999999',
    name: 'Shalini S',
    email: 'shalini@example.com',
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString()
  });
})();

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * -------------------------------------------------------------------------
 * 1. REGISTER / SIGNUP
 * Endpoint: POST /api/auth/register (also supports POST /api/auth/signup)
 * Body: { name, email, password }
 * -------------------------------------------------------------------------
 */
const handleRegister = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const errors = [];

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name is required and must be at least 2 characters long.' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email.trim())) {
      errors.push({ field: 'email', message: 'Please provide a valid email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid registration input.',
        details: errors
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'An account with this email address already exists. Please log in.'
        });
      }

      // Create new user in MongoDB (Mongoose pre-save hook automatically hashes password)
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: password
      });

      const token = generateToken({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      });

      return res.status(201).json({
        success: true,
        message: 'Account created successfully!',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // In-memory fallback registration
    const existing = fallbackUsers.find(u => u.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = new mongoose.Types.ObjectId().toString();

    const newUser = {
      id: userId,
      _id: userId,
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    fallbackUsers.push(newUser);

    const token = generateToken({
      id: userId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully (Memory Store).',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

router.post('/register', handleRegister);
router.post('/signup', handleRegister);

/**
 * -------------------------------------------------------------------------
 * 2. LOGIN
 * Endpoint: POST /api/auth/login
 * Body: { email, password }
 * -------------------------------------------------------------------------
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      // Find user and explicitly select password (since select: false in schema)
      const user = await User.findOne({ email: normalizedEmail }).select('+password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password.'
        });
      }

      // Check password using bcrypt.compare
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password.'
        });
      }

      // Generate JWT
      const token = generateToken({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // In-memory fallback login
    const user = fallbackUsers.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * -------------------------------------------------------------------------
 * 3. GET CURRENT USER PROFILE (PROTECTED)
 * Endpoint: GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * -------------------------------------------------------------------------
 */
router.get('/me', protect, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id || req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

module.exports = router;
