// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');

// Clear Mongoose cache to ensure new collection names are used
if (mongoose.models.Analysis) {
  delete mongoose.models.Analysis;
}
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const config = require('./config/backend-config');
const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const analysisRoutes = require('./routes/analysis');
const enhancedAnalysisRoutes = require('./routes/enhanced-analysis');
const comprehensiveAnalysisRoutes = require('./routes/comprehensive-analysis');
const audioAnalysisRoutes = require('./routes/audioAnalysis');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: "*",
  credentials: true
}));

// Rate limiting (disabled in development for testing)
if (config.isDevelopment) {
  // More lenient rate limiting for development
  const devLimiter = rateLimit({
    windowMs: 60000, // 1 minute
    max: 1000, // 1000 requests per minute in development
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/call-analyzer-api/', devLimiter);
} else {
  // Production rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/call-analyzer-api/', limiter);
}

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Request logging
app.use(logger.requestLogger);

// Call Analyzer API health check endpoint
app.get('/call-analyzer-api/health', async (req, res) => {
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
});

// API routes
app.use('/call-analyzer-api/auth', authRoutes);
app.use('/call-analyzer-api/analysis', analysisRoutes);
app.use('/call-analyzer-api/enhanced', enhancedAnalysisRoutes);
app.use('/call-analyzer-api/comprehensive', comprehensiveAnalysisRoutes);
app.use('/call-analyzer-api/audio-analysis', audioAnalysisRoutes);

// Serve static files (if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.disconnect();
  process.exit(0);
});

// Unhandled promise rejection
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Uncaught exception
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Sales Call Analyzer API server running on port ${config.port}`);
      logger.info(`Environment: ${config.environment}`);
      logger.info(`CORS Origin: ${config.corsOrigin || 'http://localhost:3000'}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
