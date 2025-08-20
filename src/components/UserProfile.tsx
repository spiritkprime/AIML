import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Calendar, Clock, CreditCard, Edit, Save, X } from 'lucide-react';
import { authService, User as UserType } from '../services/auth';
import { travelAPI } from '../services/api';

interface UserProfileProps {
  user: UserType;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email,
    phone: '',
    address: '',
    preferences: {
      preferredDestinations: [] as string[],
      travelStyle: '',
      dietaryRestrictions: [] as string[],
      accessibility: [] as string[]
    }
  });

  useEffect(() => {
    loadBookingHistory();
  }, []);

  const loadBookingHistory = async () => {
    setLoading(true);
    try {
      const history = await authService.getBookingHistory();
      setBookings(history);
    } catch (error) {
      console.error('Failed to load booking history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = () => {
    // In a real app, this would save to the backend
    console.log('Saving profile:', profileData);
    setEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              {!editing ? (
                <button 
                  onClick={() => setEditing(true)}
                  className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={handleSaveProfile}
                    className="text-green-600 hover:text-green-800 flex items-center text-sm font-medium"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save
                  </button>
                  <button 
                    onClick={() => setEditing(false)}
                    className="text-red-600 hover:text-red-800 flex items-center text-sm font-medium"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 mb-4">
                <img 
                  src={user.profileImage || 'https://i.pravatar.cc/150?img=68'} 
                  alt={user.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {editing ? (
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="text-xl font-bold text-center w-full border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <h3 className="text-xl font-bold">{user.name}</h3>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  {editing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full text-gray-900 border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <User className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  {editing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full text-gray-900 border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5 mr-3" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  {editing ? (
                    <textarea
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full text-gray-900 border-b border-gray-300 pb-1 focus:outline-none focus:border-blue-500"
                      placeholder="123 Main St, City, Country"
                      rows={2}
                    />
                  ) : (
                    <p className="text-gray-900">{profileData.address || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Booking History Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Booking History</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : bookings.length > 0 ? (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{booking.plan.destination.name}</h3>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {booking.plan.destination.city}, {booking.plan.destination.country}
                        </div>
                      </div>
                      <div className="mt-2 md:mt-0 flex items-center">
                        <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {booking.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-500">Travel Dates</p>
                          <p className="font-medium">{booking.startDate} - {booking.endDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">{booking.plan.itinerary.length} days</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-500">Total Cost</p>
                          <p className="font-medium">${booking.plan.totalCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <a 
                        href={`/bookings/${booking.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-500 mb-4">You haven't made any bookings yet.</p>
                <a 
                  href="/"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  Start planning your first trip
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};