import * as tf from '@tensorflow/tfjs';
import { TravelPreferences, Destination, TravelPlan } from '../types/travel';

export class MLTravelEngine {
  private model: tf.LayersModel | null = null;
  private destinations: Destination[] = [];
  private userProfiles: Map<string, number[]> = new Map();

  async initialize(): Promise<void> {
    // Initialize TensorFlow.js
    await tf.ready();
    
    // Create a neural network for travel recommendations
    this.model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [15], units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
      ]
    });

    this.model.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Load sample destinations
    this.loadDestinations();
  }

  private loadDestinations(): void {
    this.destinations = [
      {
        id: '1',
        name: 'Bali Paradise',
        country: 'Indonesia',
        city: 'Bali',
        description: 'Tropical paradise with stunning beaches and rich culture',
        imageUrl: 'https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800',
        averageRating: 4.8,
        priceRange: 'mid-range',
        climate: 'tropical',
        bestMonths: [4, 5, 6, 7, 8, 9],
        activities: ['beach', 'culture', 'adventure', 'spa'],
        coordinates: { lat: -8.3405, lng: 115.0920 }
      },
      {
        id: '2',
        name: 'Tokyo Metropolitan',
        country: 'Japan',
        city: 'Tokyo',
        description: 'Modern metropolis blending tradition with innovation',
        imageUrl: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=800',
        averageRating: 4.9,
        priceRange: 'luxury',
        climate: 'temperate',
        bestMonths: [3, 4, 5, 9, 10, 11],
        activities: ['culture', 'food', 'shopping', 'technology'],
        coordinates: { lat: 35.6762, lng: 139.6503 }
      },
      {
        id: '3',
        name: 'Swiss Alps Adventure',
        country: 'Switzerland',
        city: 'Interlaken',
        description: 'Breathtaking mountain scenery and outdoor adventures',
        imageUrl: 'https://images.pexels.com/photos/1586298/pexels-photo-1586298.jpeg?auto=compress&cs=tinysrgb&w=800',
        averageRating: 4.7,
        priceRange: 'luxury',
        climate: 'cold',
        bestMonths: [6, 7, 8, 12, 1, 2],
        activities: ['adventure', 'nature', 'skiing', 'hiking'],
        coordinates: { lat: 46.6863, lng: 7.8632 }
      },
      {
        id: '4',
        name: 'Santorini Sunset',
        country: 'Greece',
        city: 'Santorini',
        description: 'Iconic white buildings and spectacular sunsets',
        imageUrl: 'https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=800',
        averageRating: 4.6,
        priceRange: 'mid-range',
        climate: 'temperate',
        bestMonths: [4, 5, 6, 7, 8, 9, 10],
        activities: ['relaxation', 'culture', 'photography', 'wine'],
        coordinates: { lat: 36.3932, lng: 25.4615 }
      },
      {
        id: '5',
        name: 'Costa Rica Eco',
        country: 'Costa Rica',
        city: 'San José',
        description: 'Biodiversity hotspot with rainforests and wildlife',
        imageUrl: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=800',
        averageRating: 4.5,
        priceRange: 'budget',
        climate: 'tropical',
        bestMonths: [12, 1, 2, 3, 4],
        activities: ['adventure', 'nature', 'wildlife', 'eco-tourism'],
        coordinates: { lat: 9.7489, lng: -83.7534 }
      }
    ];
  }

  async generateRecommendations(preferences: TravelPreferences): Promise<TravelPlan[]> {
    const userVector = this.preferencesToVector(preferences);
    const recommendations: TravelPlan[] = [];

    for (const destination of this.destinations) {
      const destinationVector = this.destinationToVector(destination);
      const compatibility = await this.calculateCompatibility(userVector, destinationVector);
      
      if (compatibility > 0.6) {
        const plan = await this.generateTravelPlan(destination, preferences, compatibility);
        recommendations.push(plan);
      }
    }

    // Sort by confidence score
    return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  private preferencesToVector(preferences: TravelPreferences): number[] {
    const vector = new Array(15).fill(0);
    
    // Budget (normalized)
    vector[0] = Math.min(preferences.budget / 10000, 1);
    
    // Duration (normalized)
    vector[1] = Math.min(preferences.duration / 30, 1);
    
    // Travelers (normalized)
    vector[2] = Math.min(preferences.travelers / 10, 1);
    
    // Travel style encoding
    const styles = ['adventure', 'relaxation', 'cultural', 'business'];
    const styleIndex = styles.indexOf(preferences.travelStyle);
    if (styleIndex !== -1) vector[3 + styleIndex] = 1;
    
    // Climate preference
    const climates = ['tropical', 'temperate', 'cold', 'any'];
    const climateIndex = climates.indexOf(preferences.climate);
    if (climateIndex !== -1) vector[7 + climateIndex] = 1;
    
    // Accommodation type
    const accommodations = ['hotel', 'hostel', 'apartment', 'resort'];
    const accomIndex = accommodations.indexOf(preferences.accommodationType);
    if (accomIndex !== -1) vector[11 + accomIndex] = 1;
    
    return vector;
  }

  private destinationToVector(destination: Destination): number[] {
    const vector = new Array(15).fill(0);
    
    // Price range encoding
    const priceRanges = ['budget', 'mid-range', 'luxury'];
    vector[0] = priceRanges.indexOf(destination.priceRange) / 2;
    
    // Rating (normalized)
    vector[1] = destination.averageRating / 5;
    
    // Climate encoding
    const climates = ['tropical', 'temperate', 'cold'];
    const climateIndex = climates.indexOf(destination.climate);
    if (climateIndex !== -1) vector[2 + climateIndex] = 1;
    
    // Activities encoding
    const activities = ['beach', 'culture', 'adventure', 'nature', 'food', 'relaxation'];
    activities.forEach((activity, index) => {
      if (destination.activities.includes(activity)) {
        vector[5 + index] = 1;
      }
    });
    
    return vector;
  }

  private async calculateCompatibility(userVector: number[], destinationVector: number[]): Promise<number> {
    // Calculate cosine similarity
    const dotProduct = userVector.reduce((sum, val, i) => sum + val * destinationVector[i], 0);
    const userMagnitude = Math.sqrt(userVector.reduce((sum, val) => sum + val * val, 0));
    const destMagnitude = Math.sqrt(destinationVector.reduce((sum, val) => sum + val * val, 0));
    
    if (userMagnitude === 0 || destMagnitude === 0) return 0;
    
    return dotProduct / (userMagnitude * destMagnitude);
  }

  private async generateTravelPlan(
    destination: Destination, 
    preferences: TravelPreferences, 
    confidence: number
  ): Promise<TravelPlan> {
    // Generate mock flight data
    const outboundFlight = {
      id: `flight-out-${destination.id}`,
      airline: 'SkyLine Airways',
      departure: {
        airport: 'JFK',
        time: '08:00',
        city: 'New York'
      },
      arrival: {
        airport: 'DEST',
        time: '14:30',
        city: destination.city
      },
      duration: '8h 30m',
      price: this.calculateFlightPrice(preferences.budget, destination.priceRange),
      stops: Math.random() > 0.5 ? 0 : 1,
      aircraft: 'Boeing 787'
    };

    const returnFlight = {
      ...outboundFlight,
      id: `flight-ret-${destination.id}`,
      departure: outboundFlight.arrival,
      arrival: outboundFlight.departure,
      price: outboundFlight.price * 0.9
    };

    // Generate hotel recommendation
    const hotel = {
      id: `hotel-${destination.id}`,
      name: `${destination.name} Resort`,
      rating: destination.averageRating,
      pricePerNight: this.calculateHotelPrice(preferences.budget, destination.priceRange, preferences.duration),
      imageUrl: destination.imageUrl,
      amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym'],
      location: `${destination.city}, ${destination.country}`,
      description: `Luxury accommodation in the heart of ${destination.city}`,
      availability: true
    };

    // Generate activities
    const activities = this.generateActivities(destination, preferences);
    
    // Generate itinerary
    const itinerary = this.generateItinerary(preferences.duration, activities);

    const totalCost = outboundFlight.price + returnFlight.price + 
                     (hotel.pricePerNight * preferences.duration) +
                     activities.reduce((sum, activity) => sum + activity.price, 0);

    return {
      id: `plan-${destination.id}`,
      destination,
      flights: {
        outbound: outboundFlight,
        return: returnFlight
      },
      hotel,
      activities,
      totalCost,
      confidence,
      itinerary
    };
  }

  private calculateFlightPrice(budget: number, priceRange: string): number {
    const basePrice = priceRange === 'budget' ? 400 : priceRange === 'mid-range' ? 800 : 1200;
    const variation = (Math.random() - 0.5) * 200;
    return Math.max(300, basePrice + variation);
  }

  private calculateHotelPrice(budget: number, priceRange: string, duration: number): number {
    const basePrice = priceRange === 'budget' ? 80 : priceRange === 'mid-range' ? 150 : 300;
    const budgetFactor = Math.min(budget / (duration * 200), 2);
    return Math.max(50, basePrice * budgetFactor);
  }

  private generateActivities(destination: Destination, preferences: TravelPreferences) {
    const activities = [
      {
        id: `activity-1-${destination.id}`,
        name: `${destination.city} City Tour`,
        description: `Explore the highlights of ${destination.city}`,
        duration: 4,
        price: 75,
        category: 'culture',
        rating: 4.5,
        imageUrl: destination.imageUrl
      },
      {
        id: `activity-2-${destination.id}`,
        name: 'Local Cuisine Experience',
        description: 'Taste authentic local dishes and specialties',
        duration: 3,
        price: 95,
        category: 'food',
        rating: 4.7,
        imageUrl: destination.imageUrl
      },
      {
        id: `activity-3-${destination.id}`,
        name: 'Adventure Excursion',
        description: 'Thrilling outdoor activities and adventures',
        duration: 6,
        price: 120,
        category: 'adventure',
        rating: 4.6,
        imageUrl: destination.imageUrl
      }
    ];

    return activities.filter(activity => 
      preferences.interests.some(interest => 
        activity.category.includes(interest) || activity.name.toLowerCase().includes(interest)
      )
    ).slice(0, 3);
  }

  private generateItinerary(duration: number, activities: any[]) {
    const itinerary = [];
    const startDate = new Date();
    
    for (let day = 1; day <= duration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day - 1);
      
      itinerary.push({
        day,
        date: currentDate.toISOString().split('T')[0],
        activities: activities.slice(0, Math.min(2, activities.length)),
        meals: ['Breakfast', 'Lunch', 'Dinner'],
        transportation: day === 1 ? 'Airport Transfer' : 'Local Transport'
      });
    }
    
    return itinerary;
  }

  async optimizePricing(plan: TravelPlan, marketData: any): Promise<number> {
    // Simulate dynamic pricing optimization
    const demandFactor = Math.random() * 0.3 + 0.85; // 0.85 - 1.15
    const seasonalFactor = this.getSeasonalFactor(plan.destination);
    const competitionFactor = Math.random() * 0.2 + 0.9; // 0.9 - 1.1
    
    const optimizedPrice = plan.totalCost * demandFactor * seasonalFactor * competitionFactor;
    return Math.round(optimizedPrice);
  }

  private getSeasonalFactor(destination: Destination): number {
    const currentMonth = new Date().getMonth() + 1;
    const isHighSeason = destination.bestMonths.includes(currentMonth);
    return isHighSeason ? 1.2 : 0.9;
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}

export const mlTravelEngine = new MLTravelEngine();