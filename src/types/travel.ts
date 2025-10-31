export interface Destination {
  id: string;
  name: string;
  country: string;
  city: string;
  description: string;
  imageUrl: string;
  averageRating: number;
  priceRange: 'budget' | 'mid-range' | 'luxury';
  climate: string;
  bestMonths: number[];
  activities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
  currency: string;
  language: string;
  visaRequired: boolean;
  covidRestrictions?: string;
  safetyRating: number;
  accessibility: string[];
}

export interface TravelPreferences {
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  accommodationType: 'hotel' | 'hostel' | 'apartment' | 'resort' | 'any';
  travelStyle: 'adventure' | 'relaxation' | 'cultural' | 'business' | 'any';
  climate: 'tropical' | 'temperate' | 'cold' | 'any';
  departureCity: string;
  departureDate: string;
  returnDate: string;
  accessibility: string[];
  dietaryRestrictions: string[];
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  pace: 'relaxed' | 'moderate' | 'fast';
  budgetFlexibility: 'strict' | 'moderate' | 'flexible';
}

export interface Flight {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  departure: {
    airport: string;
    airportCode: string;
    time: string;
    city: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    airportCode: string;
    time: string;
    city: string;
    terminal?: string;
    gate?: string;
  };
  duration: string;
  price: number;
  stops: number;
  aircraft: string;
  cabinClass: string;
  baggageAllowance: string;
  refundable: boolean;
  changeable: boolean;
  lastUpdated: string;
  source: 'amadeus' | 'skyscanner' | 'google' | 'mock';
}

export interface Hotel {
  id: string;
  name: string;
  rating: number;
  pricePerNight: number;
  imageUrl: string;
  amenities: string[];
  location: string;
  description: string;
  availability: boolean;
  checkIn: string;
  checkOut: string;
  roomType: string;
  cancellationPolicy: string;
  breakfast: boolean;
  wifi: boolean;
  parking: boolean;
  petFriendly: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceFromAirport: number;
  distanceFromCityCenter: number;
  source: 'booking' | 'expedia' | 'airbnb' | 'mock';
  lastUpdated: string;
}

export interface Weather {
  date: string;
  temperature: {
    min: number;
    max: number;
    current: number;
  };
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  source: 'openweather' | 'weatherapi' | 'mock';
}

export interface Activity {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  rating: number;
  imageUrl: string;
  location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  availability: {
    startTime: string;
    endTime: string;
    daysAvailable: string[];
  };
  difficulty: 'easy' | 'moderate' | 'hard';
  groupSize: {
    min: number;
    max: number;
  };
  included: string[];
  excluded: string[];
  requirements: string[];
  cancellationPolicy: string;
  source: 'viator' | 'getyourguide' | 'mock';
}

export interface ItineraryDay {
  day: number;
  date: string;
  weather: Weather;
  activities: ItineraryActivity[];
  meals: Meal[];
  transportation: Transportation[];
  accommodation: Hotel;
  notes: string;
  estimatedCost: number;
  estimatedDuration: number;
}

export interface ItineraryActivity {
  activity: Activity;
  startTime: string;
  endTime: string;
  travelTime: number;
  travelMethod: string;
  notes: string;
}

export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  location: string;
  cuisine: string;
  estimatedCost: number;
  dietaryOptions: string[];
  reservationRequired: boolean;
}

export interface Transportation {
  type: 'flight' | 'train' | 'bus' | 'car' | 'walking' | 'taxi' | 'subway';
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  cost: number;
  bookingReference?: string;
  notes: string;
}

export interface TravelPlan {
  id: string;
  destination: Destination;
  flights: {
    outbound: Flight;
    return: Flight;
  };
  hotel: Hotel;
  activities: Activity[];
  totalCost: number;
  confidence: number;
  itinerary: ItineraryDay[];
  weather: Weather[];
  budgetBreakdown: BudgetBreakdown;
  alternativeOptions: TravelPlan[];
  warnings: string[];
  recommendations: string[];
  lastUpdated: string;
  source: 'ai' | 'hybrid' | 'manual';
}

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  activities: number;
  meals: number;
  transportation: number;
  insurance: number;
  visa: number;
  miscellaneous: number;
  total: number;
  currency: string;
  exchangeRate: number;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
  source: string;
  cached: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  source: string;
}

export interface FallbackData {
  type: 'flight' | 'hotel' | 'weather' | 'activity';
  originalQuery: any;
  fallbackReason: string;
  data: any;
  confidence: number;
}

export interface AIItineraryRequest {
  preferences: TravelPreferences;
  destination: Destination;
  duration: number;
  budget: number;
  interests: string[];
  travelStyle: string;
  groupType: string;
  pace: string;
  accessibility: string[];
  dietaryRestrictions: string[];
}

export interface AIItineraryResponse {
  itinerary: ItineraryDay[];
  totalCost: number;
  budgetBreakdown: BudgetBreakdown;
  recommendations: string[];
  warnings: string[];
  alternatives: string[];
  confidence: number;
  reasoning: string;
}

export interface EdgeCaseHandling {
  budgetConflict: {
    detected: boolean;
    originalBudget: number;
    requiredBudget: number;
    suggestions: string[];
    alternatives: TravelPlan[];
  };
  durationConflict: {
    detected: boolean;
    originalDuration: number;
    suggestedDuration: number;
    reasoning: string;
    adaptedItinerary: ItineraryDay[];
  };
  climateConflict: {
    detected: boolean;
    preferredClimate: string;
    destinationClimate: string;
    explanation: string;
    alternatives: Destination[];
  };
  noDataAvailable: {
    detected: boolean;
    reason: string;
    aiSuggestions: string[];
    fallbackData: any;
  };
}