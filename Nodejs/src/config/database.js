const mongoose = require('mongoose');
const logger = require('../utils/logger');
const config = require('./backend-config');

const connectDB = async () => {
  let mongoURI;
  try {

    // First try to get MONGODB_URI (check for both null and empty string)
    mongoURI = config.mongodbUri;
    if (mongoURI && mongoURI.trim() !== '') {
      logger.info(`Using MONGODB_URI for ${config.environment} connection`);
    } else {
      logger.info('MONGODB_URI not provided, constructing from individual variables');
    }

    // If MONGODB_URI is not available or empty, construct it from individual DB variables
    if (!mongoURI || mongoURI.trim() === '') {
      logger.info('Constructing MongoDB URI from individual environment variables');
      
      const dbConnection = process.env.DB_CONNECTION || 'mongodb';
      const dbHost = process.env.DB_HOST || 'localhost:27017';
      const dbDatabase = process.env.DB_DATABASE || 'sales_call_analyzer';
      const dbUsername = process.env.DB_USERNAME;
      const dbPassword = process.env.DB_PASSWORD;
      const dbPort = process.env.DB_PORT;

      if (!dbHost || !dbDatabase) {
        throw new Error('Either MONGODB_URI or DB_HOST and DB_DATABASE must be defined in environment variables');
      }

      // Construct MongoDB URI based on connection type
      if (dbConnection === 'mongodb+srv') {
        // For MongoDB Atlas (cloud)
        if (!dbUsername || !dbPassword) {
          throw new Error('DB_USERNAME and DB_PASSWORD are required for mongodb+srv connection');
        }
        mongoURI = `${dbConnection}://${dbUsername}:${dbPassword}@${dbHost}/${dbDatabase}?retryWrites=true&w=majority`;
        logger.info('Generated MongoDB Atlas URI');
        logger.info(`Connecting to: ${dbConnection}://${dbUsername}:***@${dbHost}/${dbDatabase}`);
      } else {
        // For local MongoDB
        const port = dbPort ? `:${dbPort}` : '';
        const auth = dbUsername && dbPassword ? `${dbUsername}:${dbPassword}@` : '';
        mongoURI = `${dbConnection}://${auth}${dbHost}${port}/${dbDatabase}`;
        logger.info('Generated local MongoDB URI');
        logger.info(`Connecting to: ${mongoURI}`);
      }
    }

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000, // Increased timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Added connection timeout
      retryWrites: true,
      w: 'majority'
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB connection closure:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    
    // Try fallback to local MongoDB if Atlas fails
    if (mongoURI && mongoURI.includes('mongodb+srv')) {
      logger.info('Atlas connection failed, trying local MongoDB fallback...');
      try {
        const localURI = 'mongodb://localhost:27017/sales_call_analyzer';
        const conn = await mongoose.connect(localURI, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        logger.info(`MongoDB Connected to local: ${conn.connection.host}`);
        logger.info(`Database: ${conn.connection.name}`);
        return;
      } catch (localError) {
        logger.error('Local MongoDB connection also failed:', localError.message);
      }
    }
    
    logger.error('All database connection attempts failed. Please check your MongoDB configuration.');
    process.exit(1);
  }
};

module.exports = connectDB;
