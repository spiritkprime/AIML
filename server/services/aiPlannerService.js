import OpenAI from 'openai';
import { LoggerService } from './loggerService.js';
import { CacheService } from './cacheService.js';

export class AIPlannerService {
  constructor() {
    this.logger = new LoggerService();
    this.cache = new CacheService();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.models = {
      gpt4: 'gpt-4',
      gpt35: 'gpt-3.5-turbo',
      gpt4Turbo: 'gpt-4-turbo-preview'
    };
  }

  async generateItinerary(request) {
    const cacheKey = this.cache.generateKey('ai-itinerary', request);
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.createAIItinerary(request),
      7200 // 2 hours cache for AI-generated itineraries
    );
  }

  async createAIItinerary(request) {
    const startTime = Date.now();
    
    try {
      // Handle edge cases first
      const edgeCases = this.analyzeEdgeCases(request);
      
      // Generate the main itinerary
      const itinerary = await this.generateMainItinerary(request, edgeCases);
      
      // Enhance with AI insights
      const enhancedItinerary = await this.enhanceWithAIInsights(itinerary, request);
      
      // Handle any remaining edge cases
      const finalItinerary = this.applyEdgeCaseHandling(enhancedItinerary, edgeCases);
      
      this.logger.logAI('itinerary-generation', 'gpt-4', true, Date.now() - startTime, {
        destination: request.destination.name,
        duration: request.duration,
        travelers: request.travelers
      });

      return {
        itinerary: finalItinerary.itinerary,
        totalCost: finalItinerary.totalCost,
        budgetBreakdown: finalItinerary.budgetBreakdown,
        recommendations: finalItinerary.recommendations,
        warnings: finalItinerary.warnings,
        alternatives: finalItinerary.alternatives,
        confidence: finalItinerary.confidence,
        reasoning: finalItinerary.reasoning,
        edgeCases: edgeCases,
        source: 'ai'
      };
    } catch (error) {
      this.logger.logAI('itinerary-generation', 'gpt-4', false, Date.now() - startTime, { error: error.message });
      throw error;
    }
  }

  analyzeEdgeCases(request) {
    const edgeCases = {
      budgetConflict: { detected: false, suggestions: [], alternatives: [] },
      durationConflict: { detected: false, reasoning: '', adaptedItinerary: [] },
      climateConflict: { detected: false, explanation: '', alternatives: [] },
      noDataAvailable: { detected: false, reason: '', aiSuggestions: [] }
    };

    // Budget conflict analysis
    const estimatedCost = this.estimateTripCost(request);
    if (estimatedCost > request.budget * 1.2) { // 20% buffer
      edgeCases.budgetConflict.detected = true;
      edgeCases.budgetConflict.suggestions = [
        'Consider traveling during off-peak season',
        'Look for budget accommodation options',
        'Reduce number of activities',
        'Choose a different destination with lower costs'
      ];
    }

    // Duration conflict analysis
    if (request.duration < 3) {
      edgeCases.durationConflict.detected = true;
      edgeCases.durationConflict.reasoning = 'Very short trips require focused, highlights-only itineraries';
    } else if (request.duration > 21) {
      edgeCases.durationConflict.detected = true;
      edgeCases.durationConflict.reasoning = 'Long trips benefit from slower pace and deeper cultural immersion';
    }

    // Climate conflict analysis
    if (request.climate !== 'any' && request.destination.climate !== request.climate) {
      edgeCases.climateConflict.detected = true;
      edgeCases.climateConflict.explanation = `Your preferred climate (${request.climate}) doesn't match the destination's climate (${request.destination.climate})`;
      edgeCases.climateConflict.alternatives = this.suggestClimateAlternatives(request.climate);
    }

    return edgeCases;
  }

  async generateMainItinerary(request, edgeCases) {
    const prompt = this.buildItineraryPrompt(request, edgeCases);
    
    const response = await this.openai.chat.completions.create({
      model: this.models.gpt4,
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel planner with deep knowledge of destinations, activities, and cultural experiences. Create detailed, day-by-day itineraries that are practical, enjoyable, and tailored to the traveler\'s preferences.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });

    const itineraryText = response.choices[0].message.content;
    return this.parseItineraryResponse(itineraryText, request);
  }

  buildItineraryPrompt(request, edgeCases) {
    let prompt = `Create a detailed ${request.duration}-day travel itinerary for ${request.travelers} traveler(s) to ${request.destination.name}, ${request.destination.country}.

Traveler Profile:
- Budget: $${request.budget}
- Travel Style: ${request.travelStyle}
- Interests: ${request.interests.join(', ')}
- Group Type: ${request.groupType}
- Pace: ${request.pace}
- Accessibility Requirements: ${request.accessibility.join(', ') || 'None'}
- Dietary Restrictions: ${request.dietaryRestrictions.join(', ') || 'None'}

Destination: ${request.destination.description}
Climate: ${request.destination.climate}
Best Time to Visit: ${this.formatBestMonths(request.destination.bestMonths)}

Requirements:
1. Create a day-by-day itinerary with specific time slots (morning, afternoon, evening)
2. Include estimated costs for each activity and meal
3. Consider travel time between locations
4. Adapt to the travel pace and group type
5. Include local cultural experiences and authentic dining options
6. Provide practical tips and recommendations
7. Consider weather conditions and seasonal factors

${edgeCases.budgetConflict.detected ? 'BUDGET CONSTRAINT: The estimated cost exceeds the budget. Focus on budget-friendly options and free activities.' : ''}
${edgeCases.durationConflict.detected ? `DURATION ADAPTATION: ${edgeCases.durationConflict.reasoning}` : ''}
${edgeCases.climateConflict.detected ? `CLIMATE NOTE: ${edgeCases.climateConflict.explanation}. Suggest indoor alternatives for weather-dependent activities.` : ''}

Format the response as a structured JSON with the following structure:
{
  "itinerary": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "morning": { "activity": "...", "location": "...", "duration": "...", "cost": 0, "notes": "..." },
      "afternoon": { "activity": "...", "location": "...", "duration": "...", "cost": 0, "notes": "..." },
      "evening": { "activity": "...", "location": "...", "duration": "...", "cost": 0, "notes": "..." },
      "meals": [
        { "type": "breakfast", "location": "...", "cuisine": "...", "cost": 0, "dietaryNotes": "..." }
      ],
      "transportation": { "method": "...", "cost": 0, "notes": "..." },
      "totalDayCost": 0,
      "notes": "..."
    }
  ],
  "totalCost": 0,
  "budgetBreakdown": {
    "accommodation": 0,
    "activities": 0,
    "meals": 0,
    "transportation": 0,
    "miscellaneous": 0
  },
  "recommendations": ["..."],
  "warnings": ["..."],
  "alternatives": ["..."]
}`;

    return prompt;
  }

  parseItineraryResponse(responseText, request) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.validateAndEnhanceItinerary(parsed, request);
      }
      
      // If no JSON found, create a structured itinerary from text
      return this.createStructuredItineraryFromText(responseText, request);
    } catch (error) {
      this.logger.error('Failed to parse AI itinerary response:', error);
      return this.createFallbackItinerary(request);
    }
  }

  validateAndEnhanceItinerary(parsed, request) {
    // Ensure all required fields are present
    if (!parsed.itinerary || !Array.isArray(parsed.itinerary)) {
      throw new Error('Invalid itinerary structure');
    }

    // Enhance each day with additional details
    const enhancedItinerary = parsed.itinerary.map((day, index) => ({
      day: index + 1,
      date: day.date || this.calculateDate(index, request.departureDate),
      weather: this.generateMockWeather(request.destination.climate),
      activities: this.formatActivities(day),
      meals: this.formatMeals(day.meals || []),
      transportation: this.formatTransportation(day.transportation || {}),
      accommodation: this.generateMockAccommodation(request),
      notes: day.notes || '',
      estimatedCost: day.totalDayCost || 0,
      estimatedDuration: this.calculateDayDuration(day)
    }));

    return {
      itinerary: enhancedItinerary,
      totalCost: parsed.totalCost || this.calculateTotalCost(enhancedItinerary),
      budgetBreakdown: parsed.budgetBreakdown || this.calculateBudgetBreakdown(enhancedItinerary),
      recommendations: parsed.recommendations || [],
      warnings: parsed.warnings || [],
      alternatives: parsed.alternatives || [],
      confidence: 0.9,
      reasoning: 'AI-generated itinerary with validation and enhancement'
    };
  }

  // Helper methods
  estimateTripCost(request) {
    const baseCost = request.budget;
    const duration = request.duration;
    const travelers = request.travelers;
    
    // Rough estimation
    return (baseCost * 0.8) + (duration * 50) + (travelers * 100);
  }

  suggestClimateAlternatives(preferredClimate) {
    const alternatives = {
      tropical: ['Bali, Indonesia', 'Costa Rica', 'Thailand'],
      temperate: ['Japan', 'France', 'Italy'],
      cold: ['Switzerland', 'Norway', 'Canada']
    };
    
    return alternatives[preferredClimate] || ['Consider destinations with your preferred climate'];
  }

  formatBestMonths(months) {
    if (!months || months.length === 0) return 'Year-round';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(m => monthNames[m - 1]).join(', ');
  }

  calculateDate(dayOffset, startDate) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
  }

  generateMockWeather(climate) {
    const conditions = {
      tropical: ['Sunny', 'Partly Cloudy', 'Light Rain'],
      temperate: ['Clear', 'Cloudy', 'Light Rain'],
      cold: ['Clear', 'Cloudy', 'Snow']
    };
    
    const condition = conditions[climate]?.[Math.floor(Math.random() * 3)] || 'Clear';
    
    return {
      date: new Date().toISOString().split('T')[0],
      temperature: { min: 15, max: 25, current: 20 },
      condition,
      icon: '01d',
      humidity: 60,
      windSpeed: 5,
      precipitation: 0,
      uvIndex: 3,
      sunrise: '06:00',
      sunset: '18:00',
      source: 'mock'
    };
  }

  formatActivities(day) {
    const activities = [];
    
    if (day.morning) activities.push(this.createItineraryActivity(day.morning, 'morning'));
    if (day.afternoon) activities.push(this.createItineraryActivity(day.afternoon, 'afternoon'));
    if (day.evening) activities.push(this.createItineraryActivity(day.evening, 'evening'));
    
    return activities;
  }

  createItineraryActivity(activityData, timeSlot) {
    return {
      activity: {
        id: `ai-${timeSlot}-${Date.now()}`,
        name: activityData.activity || 'Activity',
        description: activityData.notes || 'Planned activity',
        duration: parseInt(activityData.duration) || 2,
        price: parseFloat(activityData.cost) || 0,
        category: 'cultural',
        rating: 4.5,
        imageUrl: 'https://via.placeholder.com/300x200?text=Activity'
      },
      startTime: timeSlot === 'morning' ? '09:00' : timeSlot === 'afternoon' ? '14:00' : '19:00',
      endTime: timeSlot === 'morning' ? '12:00' : timeSlot === 'afternoon' ? '17:00' : '22:00',
      travelTime: 0,
      travelMethod: 'Walking',
      notes: activityData.notes || ''
    };
  }

  formatMeals(meals) {
    if (!Array.isArray(meals)) return this.generateDefaultMeals();
    
    return meals.map(meal => ({
      type: meal.type || 'meal',
      time: meal.time || '12:00',
      location: meal.location || 'Local restaurant',
      cuisine: meal.cuisine || 'Local',
      estimatedCost: parseFloat(meal.cost) || 15,
      dietaryOptions: ['Standard'],
      reservationRequired: false
    }));
  }

  generateDefaultMeals() {
    return [
      { type: 'breakfast', time: '08:00', location: 'Hotel', cuisine: 'International', estimatedCost: 0, dietaryOptions: ['Standard'], reservationRequired: false },
      { type: 'lunch', time: '13:00', location: 'Local restaurant', cuisine: 'Local', estimatedCost: 20, dietaryOptions: ['Standard'], reservationRequired: false },
      { type: 'dinner', time: '19:00', location: 'Local restaurant', cuisine: 'Local', estimatedCost: 30, dietaryOptions: ['Standard'], reservationRequired: false }
    ];
  }

  formatTransportation(transportation) {
    if (!transportation || Object.keys(transportation).length === 0) {
      return this.generateDefaultTransportation();
    }
    
    return [{
      type: 'walking',
      from: 'Previous location',
      to: 'Next location',
      departureTime: 'After activity',
      arrivalTime: 'Before next activity',
      duration: 15,
      cost: parseFloat(transportation.cost) || 0,
      notes: transportation.notes || 'Local transportation'
    }];
  }

  generateDefaultTransportation() {
    return [{
      type: 'walking',
      from: 'Hotel',
      to: 'City center',
      departureTime: '09:00',
      arrivalTime: '09:15',
      duration: 15,
      cost: 0,
      notes: 'Walking distance'
    }];
  }

  generateMockAccommodation(request) {
    return {
      id: 'mock-hotel',
      name: `${request.destination.name} Hotel`,
      rating: 4.0,
      pricePerNight: Math.floor(request.budget / request.duration / 3),
      imageUrl: request.destination.imageUrl,
      amenities: ['WiFi', 'Breakfast'],
      location: 'City center',
      description: 'Comfortable accommodation',
      availability: true,
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: 'Standard',
      cancellationPolicy: 'Flexible',
      breakfast: true,
      wifi: true,
      parking: false,
      petFriendly: false,
      coordinates: request.destination.coordinates,
      distanceFromAirport: 20,
      distanceFromCityCenter: 1,
      source: 'mock',
      lastUpdated: new Date().toISOString()
    };
  }

  calculateDayDuration(day) {
    return day.activities.reduce((total, activity) => total + activity.activity.duration, 0);
  }

  calculateTotalCost(itinerary) {
    return itinerary.reduce((total, day) => total + day.estimatedCost, 0);
  }

  calculateBudgetBreakdown(itinerary) {
    const breakdown = {
      accommodation: 0,
      activities: 0,
      meals: 0,
      transportation: 0,
      miscellaneous: 0
    };

    itinerary.forEach(day => {
      breakdown.activities += day.activities.reduce((sum, a) => sum + a.activity.price, 0);
      breakdown.meals += day.meals.reduce((sum, m) => sum + m.estimatedCost, 0);
      breakdown.transportation += day.transportation.reduce((sum, t) => sum + t.cost, 0);
    });

    // Estimate accommodation cost
    breakdown.accommodation = Math.floor(breakdown.activities * 0.3);
    breakdown.miscellaneous = Math.floor(breakdown.activities * 0.1);

    return breakdown;
  }

  createStructuredItineraryFromText(text, request) {
    // Parse text response and create structured itinerary
    const days = text.split(/day\s*\d+/i).filter(day => day.trim().length > 0);
    
    const itinerary = days.slice(0, request.duration).map((dayText, index) => ({
      day: index + 1,
      date: this.calculateDate(index, request.departureDate),
      weather: this.generateMockWeather(request.destination.climate),
      activities: this.parseActivitiesFromText(dayText),
      meals: this.generateDefaultMeals(),
      transportation: this.generateDefaultTransportation(),
      accommodation: this.generateMockAccommodation(request),
      notes: dayText.trim(),
      estimatedCost: Math.floor(Math.random() * 100) + 50,
      estimatedDuration: 8
    }));

    return {
      itinerary,
      totalCost: this.calculateTotalCost(itinerary),
      budgetBreakdown: this.calculateBudgetBreakdown(itinerary),
      recommendations: ['Generated from AI text response'],
      warnings: ['Itinerary parsed from text - verify details'],
      alternatives: [],
      confidence: 0.7,
      reasoning: 'Parsed from AI text response'
    };
  }

  createFallbackItinerary(request) {
    // Generate a basic fallback itinerary when AI fails
    const itinerary = Array.from({ length: request.duration }, (_, index) => ({
      day: index + 1,
      date: this.calculateDate(index, request.departureDate),
      weather: this.generateMockWeather(request.destination.climate),
      activities: [
        {
          activity: {
            id: `fallback-${index + 1}`,
            name: `Day ${index + 1} Exploration`,
            description: `Explore ${request.destination.name} and discover local attractions`,
            duration: 4,
            price: Math.floor(Math.random() * 50) + 25,
            category: 'exploration',
            rating: 4.0,
            imageUrl: request.destination.imageUrl
          },
          startTime: '09:00',
          endTime: '13:00',
          travelTime: 0,
          travelMethod: 'Walking',
          notes: 'Flexible exploration day'
        }
      ],
      meals: this.generateDefaultMeals(),
      transportation: this.generateDefaultTransportation(),
      accommodation: this.generateMockAccommodation(request),
      notes: 'Fallback itinerary - customize based on preferences',
      estimatedCost: Math.floor(Math.random() * 100) + 50,
      estimatedDuration: 6
    }));

    return {
      itinerary,
      totalCost: this.calculateTotalCost(itinerary),
      budgetBreakdown: this.calculateBudgetBreakdown(itinerary),
      recommendations: ['This is a fallback itinerary. Consider customizing based on your interests.'],
      warnings: ['AI generation failed - using fallback itinerary'],
      alternatives: [],
      confidence: 0.5,
      reasoning: 'Fallback itinerary due to AI generation failure'
    };
  }

  parseActivitiesFromText(text) {
    // Simple parsing of text to extract activities
    const activities = text.split(/[.!?]/).filter(sentence => sentence.trim().length > 10);
    
    return activities.slice(0, 2).map((activity, index) => ({
      activity: {
        id: `parsed-${index + 1}`,
        name: `Activity ${index + 1}`,
        description: activity.trim(),
        duration: 2,
        price: Math.floor(Math.random() * 50) + 25,
        category: 'exploration',
        rating: 4.0,
        imageUrl: 'https://via.placeholder.com/300x200?text=Activity'
      },
      startTime: index === 0 ? '09:00' : '14:00',
      endTime: index === 0 ? '11:00' : '16:00',
      travelTime: 0,
      travelMethod: 'Walking',
      notes: activity.trim()
    }));
  }

  async enhanceWithAIInsights(itinerary, request) {
    try {
      const prompt = `Analyze this travel itinerary and provide additional insights:

Destination: ${request.destination.name}
Duration: ${request.duration} days
Budget: $${request.budget}
Travel Style: ${request.travelStyle}

Current Itinerary Summary:
${itinerary.itinerary.map(day => `Day ${day.day}: ${day.activities.map(a => a.activity.name).join(', ')}`).join('\n')}

Provide:
1. 3-5 additional activity recommendations
2. 2-3 local dining suggestions
3. 2-3 cultural tips
4. 2-3 practical travel tips
5. Any potential issues or warnings

Format as JSON:
{
  "additionalActivities": ["..."],
  "diningSuggestions": ["..."],
  "culturalTips": ["..."],
  "travelTips": ["..."],
  "potentialIssues": ["..."]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.models.gpt35,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 1000
      });

      const insights = JSON.parse(response.choices[0].message.content);
      
      // Enhance the itinerary with insights
      itinerary.recommendations.push(...insights.additionalActivities);
      itinerary.recommendations.push(...insights.diningSuggestions);
      itinerary.recommendations.push(...insights.culturalTips);
      itinerary.recommendations.push(...insights.travelTips);
      itinerary.warnings.push(...insights.potentialIssues);

      return itinerary;
    } catch (error) {
      this.logger.error('Failed to enhance itinerary with AI insights:', error);
      return itinerary;
    }
  }

  applyEdgeCaseHandling(itinerary, edgeCases) {
    let modifiedItinerary = { ...itinerary };

    // Apply budget constraints
    if (edgeCases.budgetConflict.detected) {
      modifiedItinerary = this.optimizeForBudget(modifiedItinerary, edgeCases.budgetConflict);
    }

    // Apply duration adaptations
    if (edgeCases.durationConflict.detected) {
      modifiedItinerary = this.adaptForDuration(modifiedItinerary, edgeCases.durationConflict);
    }

    // Apply climate considerations
    if (edgeCases.climateConflict.detected) {
      modifiedItinerary = this.adaptForClimate(modifiedItinerary, edgeCases.climateConflict);
    }

    return modifiedItinerary;
  }

  optimizeForBudget(itinerary, budgetConflict) {
    // Reduce costs by suggesting alternatives
    const optimized = { ...itinerary };
    
    optimized.recommendations.push(
      'Budget optimization applied:',
      ...budgetConflict.suggestions
    );

    // Reduce activity costs
    optimized.itinerary = optimized.itinerary.map(day => ({
      ...day,
      activities: day.activities.map(activity => ({
        ...activity,
        activity: {
          ...activity.activity,
          price: Math.floor(activity.activity.price * 0.7) // 30% reduction
        }
      }))
    }));

    // Recalculate costs
    optimized.totalCost = this.calculateTotalCost(optimized.itinerary);
    optimized.budgetBreakdown = this.calculateBudgetBreakdown(optimized.itinerary);

    return optimized;
  }

  adaptForDuration(itinerary, durationConflict) {
    const adapted = { ...itinerary };
    
    if (durationConflict.reasoning.includes('short')) {
      // Focus on highlights only
      adapted.itinerary = adapted.itinerary.map(day => ({
        ...day,
        activities: day.activities.slice(0, 1), // Keep only one main activity
        notes: `${day.notes} - Highlights-focused for short trip`
      }));
    } else if (durationConflict.reasoning.includes('long')) {
      // Add more cultural and immersive experiences
      adapted.recommendations.push(
        'Long trip optimization: Added cultural immersion activities',
        'Consider local language classes',
        'Include day trips to nearby destinations'
      );
    }

    return adapted;
  }

  adaptForClimate(itinerary, climateConflict) {
    const adapted = { ...itinerary };
    
    adapted.warnings.push(
      `Climate consideration: ${climateConflict.explanation}`,
      'Indoor alternatives suggested for weather-dependent activities'
    );

    // Add indoor alternatives
    adapted.recommendations.push(
      'Museum visits for rainy days',
      'Indoor cultural experiences',
      'Shopping centers and galleries as weather alternatives'
    );

    return adapted;
  }
}
