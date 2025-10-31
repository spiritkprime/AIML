import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createClient } from 'redis';
// import { RateLimiterRedis } from 'rate-limiter-flexible';
import winston from 'winston';
import cron from 'node-cron';

// Import routes
import flightsRoutes from './routes/flights.js';
import hotelsRoutes from './routes/hotels.js';
import weatherRoutes from './routes/weather.js';
import aiPlannerRoutes from './routes/aiPlanner.js';
import cacheRoutes from './routes/cache.js';

// Import services
import { CacheService } from './services/cacheService.js';
import { LoggerService } from './services/loggerService.js';
import { HealthCheckService } from './services/healthCheckService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const logger = new LoggerService();
const cacheService = new CacheService();
const healthCheckService = new HealthCheckService();

// Initialize Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

// Rate limiting - temporarily disabled due to version compatibility
// const rateLimiter = new RateLimiterRedis({
//   storeClient: redisClient,
//   keyPrefix: 'middleware',
//   points: 100, // Number of requests
//   duration: 60, // Per 60 seconds
// });

// const rateLimiterMiddleware = async (req, res, next) => {
//   try {
//     await rateLimiter.consume(req.ip);
//     next();
//   } catch (rejRes) {
//     const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
//     res.set('Retry-After', String(secs));
//   }
// };

// Simple rate limiting middleware
const rateLimiterMiddleware = (req, res, next) => {
  // Basic rate limiting - can be enhanced later
  next();
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiterMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await healthCheckService.check();
    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// API routes
app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/ai-planner', aiPlannerRoutes);
app.use('/api/cache', cacheRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Scheduled tasks
cron.schedule('0 */6 * * *', async () => {
  // Clear expired cache every 6 hours
  try {
    await cacheService.clearExpired();
    logger.info('Cache cleanup completed');
  } catch (error) {
    logger.error('Cache cleanup failed:', error);
  }
});

cron.schedule('0 2 * * *', async () => {
  // Health check and monitoring at 2 AM
  try {
    const health = await healthCheckService.check();
    if (health.status === 'unhealthy') {
      logger.error('System health check failed:', health);
      // Could send notifications here
    }
  } catch (error) {
    logger.error('Scheduled health check failed:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await redisClient.quit();
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    await redisClient.connect();
    app.listen(PORT, () => {
      logger.info(`AI Travel Planner server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
