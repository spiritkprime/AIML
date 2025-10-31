import express from 'express';
import { WeatherService } from '../services/weatherService.js';
import { LoggerService } from '../services/loggerService.js';

const router = express.Router();
const weatherService = new WeatherService();
const logger = new LoggerService();

// Get weather forecast
router.get('/forecast/:location', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { location } = req.params;
    const { days = 7 } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    logger.info('Weather forecast request', { location, days });

    const forecast = await weatherService.getWeatherForecast(location, parseInt(days));
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/forecast/:location' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get weather forecast',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get current weather
router.get('/current/:location', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { location } = req.params;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    logger.info('Current weather request', { location });

    const currentWeather = await weatherService.getCurrentWeather(location);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: currentWeather,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/current/:location' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get current weather',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather alerts
router.get('/alerts/:location', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { location } = req.params;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    logger.info('Weather alerts request', { location });

    const alerts = await weatherService.getWeatherAlerts(location);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/alerts/:location' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get weather alerts',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical weather
router.get('/history/:location', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { location } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!location || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: location, startDate, endDate'
      });
    }

    logger.info('Historical weather request', { location, startDate, endDate });

    const history = await weatherService.getWeatherHistory(location, startDate, endDate);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/history/:location' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get historical weather',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather by coordinates
router.get('/coordinates', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { lat, lon, days = 7 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: lat, lon'
      });
    }

    logger.info('Weather by coordinates request', { lat, lon, days });

    // Convert coordinates to location name (reverse geocoding)
    const location = `${lat},${lon}`;
    const forecast = await weatherService.getWeatherForecast(location, parseInt(days));
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: forecast,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/coordinates' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get weather by coordinates',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get weather map data
router.get('/map/:location', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { location } = req.params;
    const { type = 'temperature' } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Location is required'
      });
    }

    logger.info('Weather map request', { location, type });

    // Mock weather map data - in production, this would come from a real API
    const mapData = {
      location,
      type,
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      },
      tiles: [
        'https://tile.openweathermap.org/map/temp_new/0/0/0.png',
        'https://tile.openweathermap.org/map/temp_new/0/0/1.png',
        'https://tile.openweathermap.org/map/temp_new/0/1/0.png',
        'https://tile.openweathermap.org/map/temp_new/0/1/1.png'
      ],
      legend: {
        min: -20,
        max: 40,
        unit: '°C'
      }
    };
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: mapData,
      timestamp: new Date().toISOString(),
      source: 'weather-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/weather/map/:location' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get weather map data',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
