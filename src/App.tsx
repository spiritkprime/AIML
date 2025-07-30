import React, { useState, useEffect } from 'react';
import { Plane, Brain, MapPin, Star, TrendingUp, CheckCircle } from 'lucide-react';
import { TravelPreferencesForm } from './components/TravelPreferencesForm';
import { TravelPlanCard } from './components/TravelPlanCard';
import { TravelPlanDetails } from './components/TravelPlanDetails';
import { BookingModal } from './components/BookingModal';
import { mlTravelEngine } from './utils/mlTravelEngine';
import { TravelPreferences, TravelPlan } from './types/travel';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [recommendations, setRecommendations] = useState<TravelPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TravelPlan | null>(null);
  const [bookingPlan, setBookingPlan] = useState<TravelPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    initializeML();
  }, []);

  const initializeML = async () => {
    try {
      setIsLoading(true);
      await mlTravelEngine.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize ML engine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (preferences: TravelPreferences) => {
    setIsLoading(true);
    try {
      const plans = await mlTravelEngine.generateRecommendations(preferences);
      
      // Optimize pricing for each plan
      const optimizedPlans = await Promise.all(
        plans.map(async (plan) => ({
          ...plan,
          totalCost: await mlTravelEngine.optimizePricing(plan, {})
        }))
      );
      
      setRecommendations(optimizedPlans);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan: TravelPlan) => {
    setSelectedPlan(plan);
  };

  const handleBooking = (plan: TravelPlan) => {
    setBookingPlan(plan);
  };

  const handleBookingConfirm = (bookingData: any) => {
    console.log('Booking confirmed:', bookingData);
    setBookingPlan(null);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const resetApp = () => {
    setRecommendations([]);
    setSelectedPlan(null);
    setBookingPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span>Booking confirmed! Check your email for details.</span>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Travel Planner
            </h1>
            <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-lg">
              <Plane className="w-10 h-10 text-white" />
            </div>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover your perfect destination with AI-powered recommendations, personalized itineraries, 
            and intelligent booking optimization
          </p>
        </div>

        {/* Loading State */}
        {!isInitialized && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing AI travel engine...</p>
          </div>
        )}

        {/* Main Content */}
        {isInitialized && (
          <>
            {recommendations.length === 0 ? (
              <div className="max-w-2xl mx-auto">
                <TravelPreferencesForm 
                  onSubmit={handlePreferencesSubmit}
                  isLoading={isLoading}
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* Results Header */}
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Your AI-Curated Travel Recommendations
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Based on your preferences, our AI has found {recommendations.length} perfect matches
                  </p>
                  <button
                    onClick={resetApp}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Plan Another Trip
                  </button>
                </div>

                {/* Recommendations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.map(plan => (
                    <TravelPlanCard
                      key={plan.id}
                      plan={plan}
                      onSelect={handlePlanSelect}
                      onBook={handleBooking}
                    />
                  ))}
                </div>

                {/* AI Insights */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/60 shadow-xl">
                  <div className="flex items-center space-x-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI Travel Insights</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-2xl">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Brain className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Smart Matching</h4>
                      <p className="text-sm text-gray-600">
                        Our neural network analyzed 15+ factors to find your perfect destinations
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-2xl">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Dynamic Pricing</h4>
                      <p className="text-sm text-gray-600">
                        Real-time price optimization based on demand and seasonal trends
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-2xl">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Personalized Itineraries</h4>
                      <p className="text-sm text-gray-600">
                        Custom day-by-day plans tailored to your interests and travel style
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Brain,
              title: 'AI-Powered Recommendations',
              description: 'Machine learning algorithms analyze your preferences to suggest perfect destinations',
              color: 'blue'
            },
            {
              icon: TrendingUp,
              title: 'Dynamic Pricing',
              description: 'Real-time price optimization considering demand, seasonality, and market trends',
              color: 'green'
            },
            {
              icon: MapPin,
              title: 'Smart Itineraries',
              description: 'Automatically generated day-by-day plans optimized for your interests',
              color: 'purple'
            },
            {
              icon: Star,
              title: 'Personalized Experience',
              description: 'Every recommendation is tailored to your unique travel style and preferences',
              color: 'orange'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className={`w-12 h-12 bg-${feature.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedPlan && (
        <TravelPlanDetails
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onBook={handleBooking}
        />
      )}

      {bookingPlan && (
        <BookingModal
          plan={bookingPlan}
          onClose={() => setBookingPlan(null)}
          onConfirm={handleBookingConfirm}
        />
      )}
    </div>
  );
}

export default App;