const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/sales_call_analyzer',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Google Gemini API Configuration
  geminiApiKey: process.env.GEMINI_API_KEY,
  
  // File Upload Configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50000000, // 50MB
  uploadPath: process.env.UPLOAD_DIR || './uploads',
  tempPath: process.env.TEMP_PATH || './temp',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',
  
  // Gemini API Limits
  geminiMaxFileSize: 20 * 1024 * 1024, // 20MB
  geminiMaxDuration: 60 * 60 * 1000, // 60 minutes in milliseconds
  
  // Analysis Configuration
  maxAnalysisRetries: 3,
  analysisTimeout: 300000, // 5 minutes
};

// Validate required environment variables
const requiredEnvVars = ['GEMINI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = config;
