const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'taskpulse_super_secret_jwt_key_2026';

/**
 * Protect middleware: Verifies JWT token and attaches user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if MongoDB is connected
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Unauthorized',
            message: 'User belonging to this token no longer exists.'
          });
        }
        req.user = user;
      } else {
        // Fallback user from decoded token payload
        req.user = {
          id: decoded.id,
          _id: decoded.id,
          name: decoded.name || 'Demo User',
          email: decoded.email,
          role: decoded.role || 'user'
        };
      }

      next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired token. Please log in again.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied. No authorization token provided. Please log in.'
    });
  }
};

/**
 * Helper to generate signed JWT tokens
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

module.exports = {
  protect,
  generateToken,
  JWT_SECRET
};
