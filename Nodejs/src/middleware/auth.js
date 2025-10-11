const logger = require('../utils/logger');

/**
 * Session-based authentication middleware
 * Gets user data from session and attaches to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
  try {
    // Check if session exists and has user data
    if (!req.session || !req.session.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No active session found.' 
      });
    }

    // Attach user from session to request
    req.user = req.session.user;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication.' 
    });
  }
};

module.exports = { auth };
