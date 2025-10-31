import express from 'express';
import { FlightsService } from '../services/flightsService.js';
import { LoggerService } from '../services/loggerService.js';

const router = express.Router();
const flightsService = new FlightsService();
const logger = new LoggerService();

// Search flights
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { origin, destination, departureDate, returnDate, travelers, cabinClass } = req.body;
    
    // Validate required parameters
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: origin, destination, departureDate'
      });
    }

    const searchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      travelers: travelers || 1,
      cabinClass: cabinClass || 'economy'
    };

    logger.info('Flight search request', { searchParams });

    const results = await flightsService.searchFlights(searchParams);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      source: 'flights-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/flights/search' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to search flights',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get flight details
router.get('/:flightId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { flightId } = req.params;
    
    if (!flightId) {
      return res.status(400).json({
        success: false,
        error: 'Flight ID is required'
      });
    }

    logger.info('Flight details request', { flightId });

    const flightDetails = await flightsService.getFlightDetails(flightId);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: flightDetails,
      timestamp: new Date().toISOString(),
      source: 'flights-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/flights/:flightId' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get flight details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get available airports
router.get('/airports/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long'
      });
    }

    logger.info('Airport search request', { query });

    // Mock airport data - in production, this would come from a real API
    const airports = [
      { code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'USA' },
      { code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'USA' },
      { code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'UK' },
      { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
      { code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' }
    ].filter(airport => 
      airport.code.toLowerCase().includes(query.toLowerCase()) ||
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase())
    );

    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: { airports },
      timestamp: new Date().toISOString(),
      source: 'flights-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/flights/airports/search' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to search airports',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get flight status
router.get('/:flightId/status', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { flightId } = req.params;
    
    if (!flightId) {
      return res.status(400).json({
        success: false,
        error: 'Flight ID is required'
      });
    }

    logger.info('Flight status request', { flightId });

    // Mock flight status - in production, this would come from a real API
    const flightStatus = {
      flightId,
      status: 'On Time',
      departure: {
        scheduled: '08:00',
        actual: '08:00',
        gate: 'A12',
        terminal: '1'
      },
      arrival: {
        scheduled: '14:30',
        actual: '14:30',
        gate: 'B8',
        terminal: '2'
      },
      lastUpdated: new Date().toISOString()
    };

    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: flightStatus,
      timestamp: new Date().toISOString(),
      source: 'flights-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/flights/:flightId/status' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get flight status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
