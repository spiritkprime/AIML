import { createClient } from 'redis';
import axios from 'axios';
import { LoggerService } from './loggerService.js';

export class HealthCheckService {
  constructor() {
    this.logger = new LoggerService();
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {}
    };
  }

  async check() {
    const startTime = Date.now();
    this.healthStatus.timestamp = new Date().toISOString();
    
    try {
      // Check Redis connection
      const redisHealth = await this.checkRedis();
      this.healthStatus.checks.redis = redisHealth;

      // Check external APIs
      const apisHealth = await this.checkExternalAPIs();
      this.healthStatus.checks.externalAPIs = apisHealth;

      // Check system resources
      const systemHealth = await this.checkSystemResources();
      this.healthStatus.checks.system = systemHealth;

      // Check database connections (if applicable)
      const databaseHealth = await this.checkDatabase();
      this.healthStatus.checks.database = databaseHealth;

      // Determine overall health status
      this.healthStatus.status = this.determineOverallHealth();
      this.healthStatus.responseTime = Date.now() - startTime;

      this.logger.info('Health check completed', {
        status: this.healthStatus.status,
        responseTime: this.healthStatus.responseTime
      });

      return this.healthStatus;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      this.healthStatus.status = 'unhealthy';
      this.healthStatus.error = error.message;
      this.healthStatus.responseTime = Date.now() - startTime;
      return this.healthStatus;
    }
  }

  async checkRedis() {
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connected: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkExternalAPIs() {
    const apis = [
      {
        name: 'OpenWeather',
        url: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=test',
        timeout: 5000
      },
      {
        name: 'Amadeus',
        url: 'https://test.api.amadeus.com/v1/security/oauth2/token',
        timeout: 5000
      },
      {
        name: 'Google Flights',
        url: 'https://www.googleapis.com/discovery/v1/apis',
        timeout: 5000
      }
    ];

    const results = {};

    for (const api of apis) {
      try {
        const startTime = Date.now();
        const response = await axios.get(api.url, {
          timeout: api.timeout,
          validateStatus: () => true // Accept any status code for health check
        });
        const responseTime = Date.now() - startTime;

        results[api.name] = {
          status: response.status < 500 ? 'healthy' : 'degraded',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        results[api.name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
      }
    }

    return results;
  }

  async checkSystemResources() {
    try {
      const usage = process.memoryUsage();
      const uptime = process.uptime();
      
      return {
        status: 'healthy',
        memory: {
          rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(usage.external / 1024 / 1024)}MB`
        },
        uptime: `${Math.round(uptime)}s`,
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('System resources health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkDatabase() {
    // Placeholder for database health checks
    // In a real application, you would check your database connections here
    return {
      status: 'healthy',
      message: 'No database configured',
      timestamp: new Date().toISOString()
    };
  }

  determineOverallHealth() {
    const checks = this.healthStatus.checks;
    const allChecks = Object.values(checks).flat();

    // Check if any critical service is unhealthy
    const criticalServices = ['redis'];
    const criticalStatus = criticalServices.some(service => 
      checks[service]?.status === 'unhealthy'
    );

    if (criticalStatus) {
      return 'unhealthy';
    }

    // Check if any service is degraded
    const hasDegraded = allChecks.some(check => 
      check.status === 'degraded'
    );

    if (hasDegraded) {
      return 'degraded';
    }

    return 'healthy';
  }

  async getDetailedHealth() {
    await this.check();
    return {
      ...this.healthStatus,
      details: {
        redis: await this.getRedisDetails(),
        system: await this.getSystemDetails(),
        apis: await this.getAPIDetails()
      }
    };
  }

  async getRedisDetails() {
    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      
      const info = await this.redis.info('server');
      const dbSize = await this.redis.dbSize();
      
      return {
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {}),
        dbSize,
        connected: this.redis.isOpen
      };
    } catch (error) {
      return { error: error.message, connected: false };
    }
  }

  async getSystemDetails() {
    return {
      pid: process.pid,
      arch: process.arch,
      cwd: process.cwd(),
      env: process.env.NODE_ENV,
      versions: process.versions
    };
  }

  async getAPIDetails() {
    return {
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 3001,
      frontendUrl: process.env.FRONTEND_URL,
      redisUrl: process.env.REDIS_URL ? 'configured' : 'not configured'
    };
  }

  // Method to reset health status
  reset() {
    this.healthStatus = {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      checks: {}
    };
  }
}
