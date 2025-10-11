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

/**
 * @desc    Detailed health check endpoint
 * @route   GET /api/health/detailed
 * @access  Public
 */
exports.detailedHealthCheck = async (req, res) => {
  const detailedHealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.environment,
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: {
        status: 'unknown',
        connectionState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'unknown',
        port: mongoose.connection.port || 'unknown',
        name: mongoose.connection.name || 'unknown'
      },
      gemini: {
        status: 'unknown',
        configured: !!(config.geminiApiKey && config.geminiApiKey.trim() !== ''),
        apiKeyLength: config.geminiApiKey ? config.geminiApiKey.length : 0
      },
      server: {
        status: 'ok',
        port: config.port,
        host: '0.0.0.0'
      }
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss,
      usedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalMB: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      externalMB: Math.round(process.memoryUsage().external / 1024 / 1024),
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      arch: process.arch,
      cwd: process.cwd()
    },
    config: {
      environment: config.environment,
      port: config.port,
      logLevel: config.logLevel,
      maxFileSize: config.maxFileSize,
      uploadDir: config.uploadDir
    }
  };

  try {
    // Check database connection
    if (mongoose.connection.readyState === 1) {
      detailedHealthCheck.services.database.status = 'connected';
    } else if (mongoose.connection.readyState === 2) {
      detailedHealthCheck.services.database.status = 'connecting';
    } else {
      detailedHealthCheck.services.database.status = 'disconnected';
    }

    // Check Gemini API configuration
    if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
      detailedHealthCheck.services.gemini.status = 'configured';
    } else {
      detailedHealthCheck.services.gemini.status = 'not_configured';
    }

    // Determine overall status
    const criticalServices = ['database', 'server'];
    const hasCriticalIssues = criticalServices.some(service => 
      detailedHealthCheck.services[service].status !== 'connected' && 
      detailedHealthCheck.services[service].status !== 'ok'
    );

    if (hasCriticalIssues) {
      detailedHealthCheck.status = 'degraded';
      res.status(503);
    }

    logger.info('Detailed health check requested', {
      status: detailedHealthCheck.status,
      database: detailedHealthCheck.services.database.status,
      gemini: detailedHealthCheck.services.gemini.status
    });

    res.json(detailedHealthCheck);

  } catch (error) {
    logger.error('Detailed health check failed:', error);
    
    detailedHealthCheck.status = 'error';
    detailedHealthCheck.error = error.message;
    
    res.status(500).json(detailedHealthCheck);
  }
};

/**
 * @desc    Readiness probe endpoint
 * @route   GET /api/health/ready
 * @access  Public
 */
exports.readinessCheck = async (req, res) => {
  try {
    // Check if critical services are ready
    const isDatabaseReady = mongoose.connection.readyState === 1;
    const isGeminiConfigured = config.geminiApiKey && config.geminiApiKey.trim() !== '';

    if (isDatabaseReady && isGeminiConfigured) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ready',
          gemini: 'ready'
        }
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          database: isDatabaseReady ? 'ready' : 'not_ready',
          gemini: isGeminiConfigured ? 'ready' : 'not_ready'
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * @desc    Liveness probe endpoint
 * @route   GET /api/health/live
 * @access  Public
 */
exports.livenessCheck = (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
};

