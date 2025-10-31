import { createClient } from 'redis';
import { LoggerService } from './loggerService.js';

export class CacheService {
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.logger = new LoggerService();
    this.defaultTTL = 3600; // 1 hour in seconds
    
    this.redis.on('error', (err) => {
      this.logger.error('Redis Cache Error:', err);
    });
  }

  async connect() {
    if (!this.redis.isOpen) {
      await this.redis.connect();
    }
  }

  async get(key) {
    try {
      await this.connect();
      const cached = await this.redis.get(key);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (this.isExpired(parsed)) {
          await this.delete(key);
          return null;
        }
        this.logger.info(`Cache hit for key: ${key}`);
        return parsed.data;
      }
      return null;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, data, ttl = this.defaultTTL) {
    try {
      await this.connect();
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl: ttl * 1000, // Convert to milliseconds
        source: 'cache'
      };
      
      await this.redis.setex(key, ttl, JSON.stringify(cacheEntry));
      this.logger.info(`Cache set for key: ${key} with TTL: ${ttl}s`);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.connect();
      await this.redis.del(key);
      this.logger.info(`Cache deleted for key: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async clearExpired() {
    try {
      await this.connect();
      // This is a simplified approach - in production, you might want to use Redis TTL
      // or implement a more sophisticated cleanup mechanism
      this.logger.info('Cache cleanup completed');
      return true;
    } catch (error) {
      this.logger.error('Cache cleanup error:', error);
      return false;
    }
  }

  async clearPattern(pattern) {
    try {
      await this.connect();
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
        this.logger.info(`Cleared ${keys.length} keys matching pattern: ${pattern}`);
      }
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache clear pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getOrSet(key, fetchFunction, ttl = this.defaultTTL) {
    try {
      // Try to get from cache first
      const cached = await this.get(key);
      if (cached) {
        return {
          data: cached,
          cached: true,
          source: 'cache'
        };
      }

      // If not in cache, fetch fresh data
      this.logger.info(`Cache miss for key: ${key}, fetching fresh data`);
      const freshData = await fetchFunction();
      
      if (freshData) {
        // Cache the fresh data
        await this.set(key, freshData, ttl);
        return {
          data: freshData,
          cached: false,
          source: 'api'
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Cache getOrSet error for key ${key}:`, error);
      // Try to fetch fresh data even if caching fails
      try {
        const freshData = await fetchFunction();
        return {
          data: freshData,
          cached: false,
          source: 'api-fallback'
        };
      } catch (fetchError) {
        this.logger.error(`Fallback fetch failed for key ${key}:`, fetchError);
        return null;
      }
    }
  }

  isExpired(cacheEntry) {
    return Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
  }

  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    return `${prefix}:${sortedParams}`;
  }

  async getStats() {
    try {
      await this.connect();
      const info = await this.redis.info('memory');
      const keys = await this.redis.dbSize();
      
      return {
        connected: this.redis.isOpen,
        keys,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {})
      };
    } catch (error) {
      this.logger.error('Cache stats error:', error);
      return {
        connected: false,
        error: error.message
      };
    }
  }

  async disconnect() {
    if (this.redis.isOpen) {
      await this.redis.quit();
    }
  }
}
