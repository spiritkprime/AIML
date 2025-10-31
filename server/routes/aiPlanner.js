import express from 'express';
import { AIPlannerService } from '../services/aiPlannerService.js';
import { LoggerService } from '../services/loggerService.js';

const router = express.Router();
const aiPlannerService = new AIPlannerService();
const logger = new LoggerService();

// Generate AI itinerary
router.post('/itinerary', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      destination,
      duration,
      budget,
      travelers,
      interests,
      travelStyle,
      groupType,
      pace,
      accessibility,
      dietaryRestrictions,
      departureDate,
      returnDate
    } = req.body;
    
    // Validate required parameters
    if (!destination || !duration || !budget || !travelers) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: destination, duration, budget, travelers'
      });
    }

    const request = {
      destination,
      duration: parseInt(duration),
      budget: parseFloat(budget),
      travelers: parseInt(travelers),
      interests: interests || [],
      travelStyle: travelStyle || 'any',
      groupType: groupType || 'couple',
      pace: pace || 'moderate',
      accessibility: accessibility || [],
      dietaryRestrictions: dietaryRestrictions || [],
      departureDate: departureDate || new Date().toISOString().split('T')[0],
      returnDate: returnDate || new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      climate: destination.climate || 'any'
    };

    logger.info('AI itinerary generation request', { request });

    const itinerary = await aiPlannerService.generateItinerary(request);
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: itinerary,
      timestamp: new Date().toISOString(),
      source: 'ai-planner-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/ai-planner/itinerary' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI itinerary',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get itinerary suggestions
router.post('/suggestions', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { destination, interests, budget, duration } = req.body;
    
    if (!destination || !interests) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: destination, interests'
      });
    }

    logger.info('AI suggestions request', { destination, interests, budget, duration });

    // Mock suggestions based on destination and interests
    const suggestions = {
      activities: [
        'Visit local museums and galleries',
        'Try authentic local cuisine',
        'Explore historical landmarks',
        'Take a guided city tour',
        'Experience local culture and traditions'
      ],
      restaurants: [
        'Traditional local restaurant',
        'Modern fusion cuisine',
        'Street food market',
        'Rooftop dining with views',
        'Family-owned authentic eatery'
      ],
      tips: [
        'Learn a few basic phrases in the local language',
        'Respect local customs and traditions',
        'Try to visit during off-peak hours',
        'Ask locals for recommendations',
        'Keep an open mind about new experiences'
      ]
    };
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString(),
      source: 'ai-planner-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/ai-planner/suggestions' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get AI suggestions',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Optimize existing itinerary
router.post('/optimize', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { itinerary, preferences, constraints } = req.body;
    
    if (!itinerary) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: itinerary'
      });
    }

    logger.info('AI itinerary optimization request', { preferences, constraints });

    // Mock optimization - in production, this would use AI to optimize the itinerary
    const optimizedItinerary = {
      ...itinerary,
      optimized: true,
      optimizationNotes: [
        'Reordered activities for better flow',
        'Added buffer time between activities',
        'Optimized for weather conditions',
        'Balanced high and low energy activities'
      ],
      estimatedSavings: Math.floor(Math.random() * 100) + 50,
      timeEfficiency: Math.floor(Math.random() * 20) + 80
    };
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: optimizedItinerary,
      timestamp: new Date().toISOString(),
      source: 'ai-planner-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/ai-planner/optimize' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to optimize itinerary',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get travel insights
router.post('/insights', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { destination, travelStyle, budget, duration } = req.body;
    
    if (!destination) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: destination'
      });
    }

    logger.info('AI travel insights request', { destination, travelStyle, budget, duration });

    // Mock insights based on destination
    const insights = {
      destination: destination.name,
      bestTimeToVisit: 'Spring and Fall offer the best weather and fewer crowds',
      localCustoms: [
        'Greet locals with a smile and basic phrases',
        'Dress modestly when visiting religious sites',
        'Remove shoes when entering homes or temples',
        'Use your right hand for eating and greeting'
      ],
      moneyTips: [
        'Carry small bills for tips and small purchases',
        'Use local currency for better rates',
        'Keep emergency cash in a safe place',
        'Notify your bank about international travel'
      ],
      safetyAdvice: [
        'Stay aware of your surroundings',
        'Keep important documents secure',
        'Use reputable transportation services',
        'Follow local safety guidelines'
      ],
      culturalHighlights: [
        'Visit local markets for authentic experiences',
        'Attend cultural festivals if timing permits',
        'Try traditional activities and crafts',
        'Learn about local history and traditions'
      ]
    };
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString(),
      source: 'ai-planner-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/ai-planner/insights' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get travel insights',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Get alternative destinations
router.post('/alternatives', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { preferences, budget, duration, excludedDestinations } = req.body;
    
    if (!preferences) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: preferences'
      });
    }

    logger.info('AI alternative destinations request', { preferences, budget, duration });

    // Mock alternative destinations based on preferences
    const alternatives = [
      {
        id: 'alt-1',
        name: 'Alternative Destination 1',
        country: 'Alternative Country',
        description: 'A great alternative that matches your preferences',
        matchScore: 0.85,
        reasons: ['Similar climate', 'Budget-friendly', 'Rich culture'],
        estimatedCost: Math.floor(budget * 0.8)
      },
      {
        id: 'alt-2',
        name: 'Alternative Destination 2',
        country: 'Alternative Country 2',
        description: 'Another excellent option for your travel style',
        matchScore: 0.78,
        reasons: ['Great food scene', 'Adventure opportunities', 'Local experiences'],
        estimatedCost: Math.floor(budget * 0.9)
      }
    ];
    
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);

    res.json({
      success: true,
      data: { alternatives },
      timestamp: new Date().toISOString(),
      source: 'ai-planner-api',
      cached: false,
      responseTime: `${responseTime}ms`
    });

  } catch (error) {
    logger.logError(error, req, { route: '/ai-planner/alternatives' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to get alternative destinations',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
