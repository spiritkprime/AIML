import express from 'express';
import { HotelsService } from '../services/hotelsService.js';
import { LoggerService } from '../services/loggerService.js';

const router = express.Router();
const hotelsService = new HotelsService();
const logger = new LoggerService();

// Search hotels
router.post('/search', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { destination, checkInDate, checkOutDate, travelers, roomCount, priceRange, amenities } = req.body;
    
    // Validate required parameters
    if (!destination || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: destination, checkInDate, checkOutDate'
      });
    }

    const searchParams = {
      destination,
      checkInDate,
      checkOutDate,
      travelers: travelers || 2,
      roomCount: roomCount || 1,
      priceRange: priceRange || 'any',
      amenities: amenities || []
    };

    logger.info('Hotel search request', { searchParams });

    const results = await hotelsService.searchHotels(searchParams);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      source: 'hotels-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/hotels/search' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to search hotels',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get hotel details
router.get('/:hotelId', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { hotelId } = req.params;
    
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID is required'
      });
    }

    logger.info('Hotel details request', { hotelId });

    const hotelDetails = await hotelsService.getHotelDetails(hotelId);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: hotelDetails,
      timestamp: new Date().toISOString(),
      source: 'hotels-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/hotels/:hotelId' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel details',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Check hotel availability
router.post('/:hotelId/availability', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { hotelId } = req.params;
    const { checkIn, checkOut, guests } = req.body;
    
    if (!hotelId || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: checkIn, checkOut, guests'
      });
    }

    logger.info('Hotel availability request', { hotelId, checkIn, checkOut, guests });

    const availability = await hotelsService.getHotelAvailability(hotelId, checkIn, checkOut, guests);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: availability,
      timestamp: new Date().toISOString(),
      source: 'hotels-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/hotels/:hotelId/availability' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to check hotel availability',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get hotel reviews
router.get('/:hotelId/reviews', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { hotelId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID is required'
      });
    }

    logger.info('Hotel reviews request', { hotelId, page, limit });

    // Mock reviews data - in production, this would come from a real API
    const reviews = Array.from({ length: parseInt(limit) }, (_, i) => ({
      id: `review-${hotelId}-${i + 1}`,
      author: `Traveler ${i + 1}`,
      rating: Math.floor(Math.random() * 2) + 4,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      title: `Great experience at hotel ${hotelId}`,
      content: `This is a mock review for hotel ${hotelId}. The service was excellent and the rooms were comfortable.`,
      helpful: Math.floor(Math.random() * 20),
      verified: Math.random() > 0.5
    }));

    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 100,
          pages: Math.ceil(100 / parseInt(limit))
        }
      },
      timestamp: new Date().toISOString(),
      source: 'hotels-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/hotels/:hotelId/reviews' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get hotel reviews',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get nearby attractions
router.get('/:hotelId/nearby', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { hotelId } = req.params;
    const { radius = 5, category } = req.query;
    
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: 'Hotel ID is required'
      });
    }

    logger.info('Nearby attractions request', { hotelId, radius, category });

    // Mock nearby attractions data
    const attractions = [
      {
        id: 'attraction-1',
        name: 'City Center',
        type: 'landmark',
        distance: 0.5,
        rating: 4.5,
        description: 'Historic city center with shops and restaurants'
      },
      {
        id: 'attraction-2',
        name: 'Local Museum',
        type: 'museum',
        distance: 1.2,
        rating: 4.2,
        description: 'Fascinating local history and culture'
      },
      {
        id: 'attraction-3',
        name: 'Shopping Mall',
        type: 'shopping',
        distance: 2.0,
        rating: 4.0,
        description: 'Modern shopping center with various stores'
      }
    ].filter(attraction => 
      !category || attraction.type === category
    );

    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: { attractions },
      timestamp: new Date().toISOString(),
      source: 'hotels-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/hotels/:hotelId/nearby' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby attractions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
