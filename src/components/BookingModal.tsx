import React, { useState } from 'react';
import { X, CreditCard, User, Mail, Phone, Calendar, Check } from 'lucide-react';
import { TravelPlan } from '../types/travel';

interface BookingModalProps {
  plan: TravelPlan;
  onClose: () => void;
  onConfirm: (bookingData: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ plan, onClose, onConfirm }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    specialRequests: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    onConfirm({ ...bookingData, plan });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return bookingData.firstName && bookingData.lastName && bookingData.email && bookingData.phone;
      case 2:
        return bookingData.cardNumber && bookingData.expiryDate && bookingData.cvv;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Book Your Trip</h2>
            <p className="text-gray-600">{plan.destination.name} • ${plan.totalCost.toLocaleString()}</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map(stepNum => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step >= stepNum 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Personal Info</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Payment</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Confirmation</span>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <User className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={bookingData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={bookingData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                <textarea
                  value={bookingData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special requests or requirements..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Payment Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-gray-900">Payment Information</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                <input
                  type="text"
                  value={bookingData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                  <input
                    type="text"
                    value={bookingData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                  <input
                    type="text"
                    value={bookingData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Address</label>
                <textarea
                  value={bookingData.billingAddress}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your billing address..."
                />
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flights</span>
                    <span>${(plan.flights.outbound.price + plan.flights.return.price).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hotel ({plan.itinerary.length} nights)</span>
                    <span>${(plan.hotel.pricePerNight * plan.itinerary.length).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Activities</span>
                    <span>${plan.activities.reduce((sum, a) => sum + a.price, 0).toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${plan.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Book!</h3>
                <p className="text-gray-600">Please review your booking details before confirming</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <h4 className="font-semibold text-gray-900 mb-4">Booking Summary</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Destination</span>
                    <span className="font-medium">{plan.destination.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{plan.itinerary.length} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Traveler</span>
                    <span className="font-medium">{bookingData.firstName} {bookingData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{bookingData.email}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>Total Cost</span>
                    <span className="text-green-600">${plan.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
                <strong>Note:</strong> This is a demo booking system. No actual payment will be processed.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-8 border-t border-gray-100 mt-8">
            <button
              onClick={step === 1 ? onClose : handleBack}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            <button
              onClick={step === 3 ? handleConfirm : handleNext}
              disabled={!isStepValid()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
            >
              {step === 3 ? 'Confirm Booking' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};