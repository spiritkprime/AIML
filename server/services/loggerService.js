import winston from 'winston';

export class LoggerService {
  constructor() {
    // Check if instance already exists
    if (LoggerService.instance) {
      return LoggerService.instance;
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'ai-travel-planner' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // File transport for errors
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Handle uncaught exceptions (only once)
    if (!LoggerService.exceptionsHandled) {
      this.logger.exceptions.handle(
        new winston.transports.File({ filename: 'logs/exceptions.log' })
      );
      LoggerService.exceptionsHandled = true;
    }

    // Handle unhandled promise rejections (only once)
    if (!LoggerService.rejectionsHandled) {
      this.logger.rejections.handle(
        new winston.transports.File({ filename: 'logs/rejections.log' })
      );
      LoggerService.rejectionsHandled = true;
    }

    // Store the instance
    LoggerService.instance = this;
  }

  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  verbose(message, meta = {}) {
    this.logger.verbose(message, meta);
  }

  // Log API requests
  logRequest(req, res, responseTime) {
    this.info('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      responseTime: `${responseTime}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    });
  }

  // Log API errors
  logError(error, req = null, additionalInfo = {}) {
    const errorLog = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...additionalInfo
    };

    if (req) {
      errorLog.request = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        query: req.query,
        params: req.params
      };
    }

    this.error('API Error', errorLog);
  }

  // Log performance metrics
  logPerformance(operation, duration, metadata = {}) {
    this.info('Performance Metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Log cache operations
  logCache(operation, key, success, metadata = {}) {
    this.debug('Cache Operation', {
      operation,
      key,
      success,
      ...metadata
    });
  }

  // Log external API calls
  logExternalAPI(provider, endpoint, success, duration, metadata = {}) {
    this.info('External API Call', {
      provider,
      endpoint,
      success,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Log AI operations
  logAI(operation, model, success, duration, metadata = {}) {
    this.info('AI Operation', {
      operation,
      model,
      success,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  // Create child logger with additional context
  child(additionalMeta = {}) {
    const childLogger = new LoggerService();
    childLogger.logger.defaultMeta = {
      ...this.logger.defaultMeta,
      ...additionalMeta
    };
    return childLogger;
  }

  // Get logger instance for direct access
  getLogger() {
    return this.logger;
  }
}
