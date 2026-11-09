const mongoose = require('mongoose');
const config = require('./env');

const connectDatabase = async () => {
  if (!config.mongoUri) {
    console.warn('MongoDB connection skipped: MONGODB_URI is not configured.');
    return;
  }

  try {
    await mongoose.connect(config.mongoUri);
    console.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
  }
};

const getDatabaseStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = { connectDatabase, getDatabaseStatus };
