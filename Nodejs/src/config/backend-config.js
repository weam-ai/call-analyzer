const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

const backendConfig = {
  // Environment
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Database
  mongodbUri: process.env.MONGODB_URI || null, // Don't use fallback, let database.js handle individual variables

  // API Keys
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
  uploadDir: process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), // Configurable upload directory

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // 100 requests per window

  validate() {
    const requiredVars = ['MONGODB_URI', 'GEMINI_API_KEY'];
    const missing = requiredVars.filter((v) => !process.env[v]);
    
    if (missing.length > 0) {
      console.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    }

    return true;
  },
};

// Run validation only in non-test environments
if (backendConfig.environment !== 'test') {
  backendConfig.validate();
}

module.exports = backendConfig;
