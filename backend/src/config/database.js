const mongoose = require('mongoose');
const logger = require('./logger');

const dns = require('dns');
let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (uri) {
    try {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (dnsErr) {
        // Continue if setting custom DNS servers is restricted
      }
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      logger.info('MongoDB connected successfully to real database');
      return true;
    } catch (error) {
      logger.warn(`Primary MongoDB connection failed (${error.message}). Falling back to local embedded MongoDB...`);
    }
  }

  // Fallback to local in-memory Mongo server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    const memoryUri = memoryServer.getUri() + 'fixora-x';
    await mongoose.connect(memoryUri);
    logger.info(`MongoDB connected to local embedded instance: ${memoryUri}`);
    return true;
  } catch (error) {
    logger.error('Failed to initialize MongoDB:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  mongoose
};

