const mongoose = require('mongoose');
const config = require('./backend-config');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      if (this.connection) {
        return this.connection;
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(config.mongodbUri, options);
      
      logger.info('Connected to MongoDB successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.connection = null;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

module.exports = new Database();
