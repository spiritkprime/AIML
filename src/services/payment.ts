import { TravelPlan } from '../types/travel';

// Payment method types
export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'paypal' | 'bank_transfer';
  last4?: string;
  expiryDate?: string;
  cardBrand?: string;
  name: string;
}

export interface PaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  amount: number;
  currency: string;
  timestamp: string;
}

// Payment service for handling payments
export const paymentService = {
  // Process a payment for a travel booking
  async processPayment(plan: TravelPlan, paymentDetails: PaymentDetails): Promise<PaymentResult> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real app, this would make an API request to your payment processor
    // const response = await fetch('/api/payments/process', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ planId: plan.id, amount: plan.totalCost, paymentDetails })
    // });
    // return await response.json();
    
    // For demo purposes, we'll simulate a successful payment 90% of the time
    const isSuccessful = Math.random() > 0.1;
    
    if (isSuccessful) {
      return {
        success: true,
        transactionId: `txn_${Date.now()}`,
        amount: plan.totalCost,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        error: 'Payment processing failed. Please try again.',
        amount: plan.totalCost,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    }
  },
  
  // Get saved payment methods for a user
  async getSavedPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would fetch from your backend
    // const response = await fetch(`/api/users/${userId}/payment-methods`);
    // return await response.json();
    
    // For demo, return mock data
    return [
      {
        id: 'pm_1',
        type: 'credit_card',
        last4: '4242',
        expiryDate: '12/25',
        cardBrand: 'Visa',
        name: 'Personal Card'
      },
      {
        id: 'pm_2',
        type: 'paypal',
        name: 'PayPal Account'
      }
    ];
  },
  
  // Save a new payment method
  async savePaymentMethod(userId: string, paymentDetails: PaymentDetails): Promise<PaymentMethod> {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would make an API request to your backend
    // const response = await fetch(`/api/users/${userId}/payment-methods`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(paymentDetails)
    // });
    // return await response.json();
    
    // For demo, return a mock new payment method
    return {
      id: `pm_${Date.now()}`,
      type: 'credit_card',
      last4: paymentDetails.cardNumber.slice(-4),
      expiryDate: paymentDetails.expiryDate,
      cardBrand: getCardBrand(paymentDetails.cardNumber),
      name: paymentDetails.cardholderName
    };
  }
};

// Helper function to determine card brand from card number
function getCardBrand(cardNumber: string): string {
  // Very simplified version - in reality, you'd use a more robust method
  if (cardNumber.startsWith('4')) return 'Visa';
  if (cardNumber.startsWith('5')) return 'Mastercard';
  if (cardNumber.startsWith('3')) return 'American Express';
  if (cardNumber.startsWith('6')) return 'Discover';
  return 'Unknown';
}