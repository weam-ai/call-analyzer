const logger = require('../../utils/logger');

/**
 * @desc    Get current user session
 * @route   GET /call-analyzer-api/auth/session
 * @access  Private (requires active session)
 */
exports.getSession = async (req, res) => {
  try {
    // Check if session exists
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'No active session found'
      });
    }

    // Return user data from session
    res.json({
      success: true,
      data: {
        user: req.session.user
      }
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session data'
    });
  }
};
