import express from 'express';
import cors from 'cors';
import path from 'path';
import logger from './config/logger';
import { errorHandler } from './middleware/error';
import authRoutes from './routes/auth';
import comicsRoutes from './routes/comics';

const app = express();

// Middleware
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
logger.info('🌐 CORS enabled for origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploads directory
const uploadsPath = path.join(__dirname, '../public/uploads');
app.use('/uploads', express.static(uploadsPath));
logger.info('📁 Serving static files from:', uploadsPath);

// Request logging middleware
app.use((req, res, next) => {
  logger.debug(`📨 ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comics', comicsRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.debug('❤️  Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('⚠️  404 Not Found:', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
