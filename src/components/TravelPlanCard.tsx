import React from 'react';
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Plane, 
  Hotel, 
  Calendar,
  DollarSign,
  TrendingUp,
  Heart
} from 'lucide-react';
import { TravelPlan } from '../types/travel';

interface TravelPlanCardProps {
  plan: TravelPlan;
  onSelect: (plan: TravelPlan) => void;
  onBook: (plan: TravelPlan) => void;
}

export const TravelPlanCard: React.FC<TravelPlanCardProps> = ({ plan, onSelect, onBook }) => {
  const confidenceColor = plan.confidence >= 0.8 ? 'text-green-600' : 
                          plan.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
      {/* Header Image */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={plan.destination.imageUrl} 
          alt={plan.destination.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Confidence Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <TrendingUp className={`w-4 h-4 ${confidenceColor}`} />
          <span className={`text-sm font-semibold ${confidenceColor}`}>
            {Math.round(plan.confidence * 100)}% Match
          </span>
        </div>

        {/* Destination Info */}
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-2xl font-bold mb-1">{plan.destination.name}</h3>
          <div className="flex items-center space-x-2 text-white/90">
            <MapPin className="w-4 h-4" />
            <span>{plan.destination.city}, {plan.destination.country}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Rating & Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="font-semibold text-gray-900">{plan.destination.averageRating}</span>
            </div>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-600 capitalize">{plan.destination.priceRange}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">${plan.totalCost.toLocaleString()}</div>
            <div className="text-sm text-gray-500">total cost</div>
          </div>
        </div>

        {/* Flight Info */}
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Plane className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Flights</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Outbound</div>
              <div className="text-gray-600">{plan.flights.outbound.departure.time} - {plan.flights.outbound.arrival.time}</div>
              <div className="text-gray-500">{plan.flights.outbound.duration}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Return</div>
              <div className="text-gray-600">{plan.flights.return.departure.time} - {plan.flights.return.arrival.time}</div>
              <div className="text-gray-500">{plan.flights.return.duration}</div>
            </div>
          </div>
        </div>

        {/* Hotel Info */}
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Hotel className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Accommodation</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">{plan.hotel.name}</div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span>{plan.hotel.rating}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">${plan.hotel.pricePerNight}</div>
              <div className="text-sm text-gray-500">per night</div>
            </div>
          </div>
        </div>

        {/* Activities Preview */}
        <div className="bg-purple-50 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Heart className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-900">Activities</span>
          </div>
          <div className="space-y-2">
            {plan.activities.slice(0, 2).map(activity => (
              <div key={activity.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-900">{activity.name}</span>
                <span className="text-gray-600">${activity.price}</span>
              </div>
            ))}
            {plan.activities.length > 2 && (
              <div className="text-sm text-purple-600 font-medium">
                +{plan.activities.length - 2} more activities
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <Calendar className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{plan.itinerary.length} Days</div>
          </div>
          <div className="text-center">
            <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{plan.activities.length} Activities</div>
          </div>
          <div className="text-center">
            <DollarSign className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <div className="text-sm font-medium text-gray-900">{plan.destination.priceRange}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            onClick={() => onSelect(plan)}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            View Details
          </button>
          <button
            onClick={() => onBook(plan)}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};