const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/backend-config');
const database = require('./config/database');
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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost on any port
    if (origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
      return callback(null, true);
    }
    
    // Allow specific origins
    const allowedOrigins = [
      config.corsOrigin,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:3002'
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow all origins
    if (config.nodeEnv === 'development') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Origin',
    'X-Requested-With',
    'sec-ch-ua',
    'sec-ch-ua-mobile',
    'sec-ch-ua-platform',
    'User-Agent',
    'Referer'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Rate limiting
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
app.use('/api/', limiter);

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sales Call Analyzer API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/enhanced', enhancedAnalysisRoutes);
app.use('/api/comprehensive', comprehensiveAnalysisRoutes);
app.use('/api/audio-analysis', audioAnalysisRoutes);

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
    await database.connect();
    
    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Sales Call Analyzer API server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`CORS Origin: ${config.corsOrigin}`);
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
