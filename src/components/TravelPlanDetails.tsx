import React from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  Plane, 
  Hotel, 
  Activity,
  DollarSign,
  Users,
  Wifi,
  Car,
  Coffee
} from 'lucide-react';
import { TravelPlan } from '../types/travel';

interface TravelPlanDetailsProps {
  plan: TravelPlan;
  onClose: () => void;
  onBook: (plan: TravelPlan) => void;
}

export const TravelPlanDetails: React.FC<TravelPlanDetailsProps> = ({ plan, onClose, onBook }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative h-64 overflow-hidden rounded-t-3xl">
          <img 
            src={plan.destination.imageUrl} 
            alt={plan.destination.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{plan.destination.name}</h2>
            <div className="flex items-center space-x-2 text-white/90">
              <MapPin className="w-5 h-5" />
              <span className="text-lg">{plan.destination.city}, {plan.destination.country}</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-2xl p-6 text-center">
              <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-blue-900">{plan.itinerary.length}</div>
              <div className="text-blue-700">Days</div>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-green-900">${plan.totalCost.toLocaleString()}</div>
              <div className="text-green-700">Total Cost</div>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 text-center">
              <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-purple-900">{Math.round(plan.confidence * 100)}%</div>
              <div className="text-purple-700">AI Match</div>
            </div>
          </div>

          {/* Flights */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Plane className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Flight Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outbound */}
              <div className="bg-white rounded-xl p-4">
                <div className="text-sm font-semibold text-blue-600 mb-3">OUTBOUND FLIGHT</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airline</span>
                    <span className="font-medium">{plan.flights.outbound.airline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure</span>
                    <span className="font-medium">{plan.flights.outbound.departure.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrival</span>
                    <span className="font-medium">{plan.flights.outbound.arrival.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{plan.flights.outbound.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-bold text-blue-600">${plan.flights.outbound.price}</span>
                  </div>
                </div>
              </div>

              {/* Return */}
              <div className="bg-white rounded-xl p-4">
                <div className="text-sm font-semibold text-green-600 mb-3">RETURN FLIGHT</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Airline</span>
                    <span className="font-medium">{plan.flights.return.airline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure</span>
                    <span className="font-medium">{plan.flights.return.departure.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Arrival</span>
                    <span className="font-medium">{plan.flights.return.arrival.time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{plan.flights.return.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-bold text-green-600">${plan.flights.return.price}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Hotel className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-900">Accommodation</h3>
            </div>
            
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-1">{plan.hotel.name}</h4>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{plan.hotel.rating}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{plan.hotel.location}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.hotel.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">${plan.hotel.pricePerNight}</div>
                  <div className="text-sm text-gray-500">per night</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-2">Amenities</div>
                <div className="flex flex-wrap gap-2">
                  {plan.hotel.amenities.map(amenity => (
                    <span key={amenity} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center space-x-1">
                      {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                      {amenity === 'Restaurant' && <Coffee className="w-3 h-3" />}
                      {amenity === 'Pool' && <Activity className="w-3 h-3" />}
                      <span>{amenity}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Activities & Experiences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plan.activities.map(activity => (
                <div key={activity.id} className="bg-white rounded-xl p-4">
                  <img 
                    src={activity.imageUrl} 
                    alt={activity.name}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-semibold text-gray-900 mb-1">{activity.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-600">{activity.duration}h</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-gray-600">{activity.rating}</span>
                    </div>
                    <span className="font-semibold text-purple-600">${activity.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itinerary */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900">Daily Itinerary</h3>
            </div>
            
            <div className="space-y-4">
              {plan.itinerary.map(day => (
                <div key={day.day} className="bg-white rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {day.day}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Day {day.day}</div>
                      <div className="text-sm text-gray-600">{day.date}</div>
                    </div>
                  </div>
                  
                  <div className="ml-11 space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Activities: </span>
                      <span className="text-sm text-gray-600">
                        {day.activities.map(a => a.name).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Transportation: </span>
                      <span className="text-sm text-gray-600">{day.transportation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Button */}
          <div className="flex justify-center pt-6">
            <button
              onClick={() => onBook(plan)}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-3"
            >
              <span>Book This Trip</span>
              <DollarSign className="w-5 h-5" />
              <span>${plan.totalCost.toLocaleString()}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};