const mongoose = require('mongoose');
const config = require('../config/backend-config');
const logger = require('../utils/logger');

/**
 * @desc    Basic health check endpoint
 * @route   GET /call-analyzer-api/health
 * @access  Public
 */
exports.healthCheck = async (req, res) => {
  const healthCheck = {
    success: true,
    message: 'Call Analyzer API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'call-analyzer-api',
    status: 'healthy',
    uptime: process.uptime(),
    environment: config.environment,
    services: {
      database: 'unknown',
      server: 'ok'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.services.database = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      healthCheck.services.database = 'connecting';
    } else {
      healthCheck.services.database = 'disconnected';
    }

    // Determine overall status
    if (healthCheck.services.database !== 'connected') {
      healthCheck.status = 'degraded';
      healthCheck.success = false;
      res.status(503);
    }

    logger.info('Call Analyzer API health check requested', {
      status: healthCheck.status,
      database: healthCheck.services.database
    });

    res.json(healthCheck);

  } catch (error) {
    logger.error('Call Analyzer API health check failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Call Analyzer API health check failed',
      timestamp: new Date().toISOString(),
      service: 'call-analyzer-api',
      status: 'error',
      error: error.message
    });
  }
};

