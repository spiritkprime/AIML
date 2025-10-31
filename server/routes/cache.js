import express from 'express';
import { CacheService } from '../services/cacheService.js';
import { LoggerService } from '../services/loggerService.js';

const router = express.Router();
const cacheService = new CacheService();
const logger = new LoggerService();

// Get cache statistics
router.get('/stats', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Cache stats request');

    const stats = await cacheService.getStats();
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/stats' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Clear specific cache entry
router.delete('/:key', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Cache key is required'
      });
    }

    logger.info('Cache delete request', { key });

    const result = await cacheService.delete(key);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: result,
      data: { deleted: result, key },
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/:key' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete cache entry',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Clear cache by pattern
router.delete('/pattern/:pattern', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { pattern } = req.params;
    
    if (!pattern) {
      return res.status(400).json({
        success: false,
        error: 'Pattern is required'
      });
    }

    logger.info('Cache pattern delete request', { pattern });

    const deletedCount = await cacheService.clearPattern(pattern);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: { deletedCount, pattern },
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/pattern/:pattern' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache by pattern',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Clear all expired cache entries
router.post('/clear-expired', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Clear expired cache request');

    const result = await cacheService.clearExpired();
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: result,
      data: { cleared: result },
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/clear-expired' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear expired cache entries',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get cache entry
router.get('/:key', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Cache key is required'
      });
    }

    logger.info('Cache get request', { key });

    const data = await cacheService.get(key);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    if (data) {
      res.json({
        success: true,
        data: { key, value: data },
        timestamp: new Date().toISOString(),
        source: 'cache-api',
        cached: true,
        responseTime: `${responseTime}ms`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Cache entry not found',
        data: { key },
        timestamp: new Date().toISOString(),
        source: 'cache-api',
        cached: false,
        responseTime: `${responseTime}ms`
      });
    }

  } catch (error) {
    logger.logError(error, req, { route: '/cache/:key' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cache entry',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Set cache entry
router.post('/:key', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { key } = req.params;
    const { value, ttl = 3600 } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Cache key and value are required'
      });
    }

    logger.info('Cache set request', { key, ttl });

    const result = await cacheService.set(key, value, ttl);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: result,
      data: { set: result, key, ttl },
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/:key' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to set cache entry',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check for cache
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('Cache health check request');

    const stats = await cacheService.getStats();
    const isHealthy = stats.connected;
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        connected: isHealthy,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'cache-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/cache/health' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check cache health',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
