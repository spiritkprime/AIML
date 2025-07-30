import React, { useState } from 'react';
import { Calendar, Users, DollarSign, MapPin, Heart, Plane } from 'lucide-react';
import { TravelPreferences } from '../types/travel';

interface TravelPreferencesFormProps {
  onSubmit: (preferences: TravelPreferences) => void;
  isLoading: boolean;
}

export const TravelPreferencesForm: React.FC<TravelPreferencesFormProps> = ({ onSubmit, isLoading }) => {
  const [preferences, setPreferences] = useState<TravelPreferences>({
    budget: 2000,
    duration: 7,
    travelers: 2,
    interests: [],
    accommodationType: 'hotel',
    travelStyle: 'relaxation',
    climate: 'any'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(preferences);
  };

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const interests = [
    'beach', 'culture', 'adventure', 'nature', 'food', 'relaxation', 
    'shopping', 'nightlife', 'history', 'art', 'photography', 'wellness'
  ];

  return (
    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Plane className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Perfect Trip</h2>
        <p className="text-gray-600">Tell us your preferences and let AI create your ideal travel experience</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Budget & Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              Budget (USD)
            </label>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={preferences.budget}
              onChange={(e) => setPreferences(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$500</span>
              <span className="font-semibold text-blue-600">${preferences.budget.toLocaleString()}</span>
              <span>$10,000</span>
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Duration (Days)
            </label>
            <input
              type="range"
              min="3"
              max="30"
              value={preferences.duration}
              onChange={(e) => setPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>3 days</span>
              <span className="font-semibold text-blue-600">{preferences.duration} days</span>
              <span>30 days</span>
            </div>
          </div>
        </div>

        {/* Travelers */}
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <Users className="w-4 h-4 mr-2 text-purple-600" />
            Number of Travelers
          </label>
          <div className="flex space-x-3">
            {[1, 2, 3, 4, 5, 6].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, travelers: num }))}
                className={`w-12 h-12 rounded-xl font-semibold transition-all duration-200 ${
                  preferences.travelers === num
                    ? 'bg-purple-600 text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Travel Style */}
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <Heart className="w-4 h-4 mr-2 text-red-500" />
            Travel Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'adventure', label: 'Adventure', emoji: '🏔️' },
              { value: 'relaxation', label: 'Relaxation', emoji: '🏖️' },
              { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
              { value: 'business', label: 'Business', emoji: '💼' }
            ].map(style => (
              <button
                key={style.value}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, travelStyle: style.value as any }))}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${
                  preferences.travelStyle === style.value
                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div className="text-sm font-medium">{style.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Climate Preference */}
        <div>
          <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
            <MapPin className="w-4 h-4 mr-2 text-orange-600" />
            Climate Preference
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'tropical', label: 'Tropical', emoji: '🌴' },
              { value: 'temperate', label: 'Temperate', emoji: '🌸' },
              { value: 'cold', label: 'Cold', emoji: '❄️' },
              { value: 'any', label: 'Any', emoji: '🌍' }
            ].map(climate => (
              <button
                key={climate.value}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, climate: climate.value as any }))}
                className={`p-3 rounded-xl text-center transition-all duration-200 ${
                  preferences.climate === climate.value
                    ? 'bg-orange-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-xl mb-1">{climate.emoji}</div>
                <div className="text-sm font-medium">{climate.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            What interests you? (Select multiple)
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {interests.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  preferences.interests.includes(interest)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest.charAt(0).toUpperCase() + interest.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Accommodation Type */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            Accommodation Preference
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: 'hotel', label: 'Hotel', emoji: '🏨' },
              { value: 'hostel', label: 'Hostel', emoji: '🏠' },
              { value: 'apartment', label: 'Apartment', emoji: '🏢' },
              { value: 'resort', label: 'Resort', emoji: '🏖️' }
            ].map(accom => (
              <button
                key={accom.value}
                type="button"
                onClick={() => setPreferences(prev => ({ ...prev, accommodationType: accom.value as any }))}
                className={`p-4 rounded-xl text-center transition-all duration-200 ${
                  preferences.accommodationType === accom.value
                    ? 'bg-green-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{accom.emoji}</div>
                <div className="text-sm font-medium">{accom.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || preferences.interests.length === 0}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI is planning your trip...</span>
            </>
          ) : (
            <>
              <span>Find My Perfect Trip</span>
              <Plane className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};