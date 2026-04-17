const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * MongoDB Connection
 *
 * Connects to MongoDB Atlas using Mongoose.
 * Includes connection event handlers for monitoring.
 */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);

    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
