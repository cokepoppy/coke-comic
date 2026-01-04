import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import app from './app';
import logger from './config/logger';
// Import database to trigger connection test
import './config/database';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info('🚀 ================================');
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('🚀 ================================');
  logger.info(`📍 API Base URL: http://localhost:${PORT}/api`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/health`);
  logger.info('🚀 ================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('⚠️  SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('⚠️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});
