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
}

export interface TravelPreferences {
  budget: number;
  duration: number;
  travelers: number;
  interests: string[];
  accommodationType: 'hotel' | 'hostel' | 'apartment' | 'resort';
  travelStyle: 'adventure' | 'relaxation' | 'cultural' | 'business';
  climate: 'tropical' | 'temperate' | 'cold' | 'any';
}

export interface Flight {
  id: string;
  airline: string;
  departure: {
    airport: string;
    time: string;
    city: string;
  };
  arrival: {
    airport: string;
    time: string;
    city: string;
  };
  duration: string;
  price: number;
  stops: number;
  aircraft: string;
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
}

export interface ItineraryDay {
  day: number;
  date: string;
  activities: Activity[];
  meals: string[];
  transportation: string;
}