import { TravelPreferences, TravelPlan, Destination } from '../types/travel';

// Base API URL - in a real app, this would be your actual backend URL
const API_BASE_URL = 'https://api.aitravelplanner.com/v1';

// Helper function for making API requests
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // For demo purposes, we're simulating API calls
  // In a real app, this would make actual network requests
  console.log(`API Request to: ${url}`, options);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would be:
  // const response = await fetch(url, options);
  // if (!response.ok) throw new Error(`API Error: ${response.status}`);
  // return response.json();
  
  // For now, we'll just return mock data from the ML engine
  return {} as T;
}

// Travel API Service
export const travelAPI = {
  // Get travel recommendations based on user preferences
  async getRecommendations(preferences: TravelPreferences): Promise<TravelPlan[]> {
    try {
      return await fetchAPI<TravelPlan[]>('/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      // For demo, we'll use the ML engine directly instead of failing
      return [];
    }
  },
  
  // Get destinations with optional filtering
  async getDestinations(filters?: Record<string, any>): Promise<Destination[]> {
    try {
      const queryParams = filters ? `?${new URLSearchParams(filters)}` : '';
      return await fetchAPI<Destination[]>(`/destinations${queryParams}`);
    } catch (error) {
      console.error('Failed to get destinations:', error);
      return [];
    }
  },
  
  // Book a travel plan
  async bookTrip(bookingData: any): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      return await fetchAPI<{ success: boolean; bookingId?: string }>('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
    } catch (error) {
      console.error('Failed to book trip:', error);
      return { success: false, error: 'Booking service unavailable' };
    }
  },
  
  // Get user's booking history
  async getBookingHistory(userId: string): Promise<any[]> {
    try {
      return await fetchAPI<any[]>(`/users/${userId}/bookings`);
    } catch (error) {
      console.error('Failed to get booking history:', error);
      return [];
    }
  },
  
  // Get detailed information about a specific travel plan
  async getTravelPlanDetails(planId: string): Promise<TravelPlan | null> {
    try {
      return await fetchAPI<TravelPlan>(`/travel-plans/${planId}`);
    } catch (error) {
      console.error('Failed to get travel plan details:', error);
      return null;
    }
  }
};