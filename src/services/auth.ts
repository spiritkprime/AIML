import { travelAPI } from './api';

// Types for authentication
export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Mock user data for demonstration
const MOCK_USERS = [
  {
    id: 'user-1',
    email: 'demo@example.com',
    password: 'password123',
    name: 'Demo User',
    profileImage: 'https://i.pravatar.cc/150?img=68'
  }
];

// Auth service for handling authentication
export const authService = {
  // Current auth state
  currentUser: null as User | null,
  
  // Check if user is logged in (would use JWT or session in a real app)
  isAuthenticated(): boolean {
    return !!this.currentUser || !!localStorage.getItem('auth_token');
  },
  
  // Get the current user
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    
    // Try to restore from localStorage in a real app
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
        return this.currentUser;
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    
    return null;
  },
  
  // Login with email and password
  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would make an API request to your backend
    // const response = await fetch('/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email, password })
    // });
    // const data = await response.json();
    
    // For demo, we'll use mock data
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      // Create a user object without the password
      const { password: _, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword as User;
      
      // Store auth data in localStorage (in a real app, you'd store a JWT token)
      localStorage.setItem('auth_token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(this.currentUser));
      
      return { success: true, user: this.currentUser };
    }
    
    return { success: false, error: 'Invalid email or password' };
  },
  
  // Register a new user
  async register(userData: { name: string; email: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API request delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (MOCK_USERS.some(u => u.email === userData.email)) {
      return { success: false, error: 'Email already in use' };
    }
    
    // In a real app, this would make an API request to your backend
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(userData)
    // });
    // const data = await response.json();
    
    // For demo, create a new mock user
    const newUser = {
      id: `user-${MOCK_USERS.length + 1}`,
      ...userData,
      profileImage: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`
    };
    
    MOCK_USERS.push(newUser);
    
    // Create a user object without the password
    const { password: _, ...userWithoutPassword } = newUser;
    this.currentUser = userWithoutPassword as User;
    
    // Store auth data in localStorage
    localStorage.setItem('auth_token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(this.currentUser));
    
    return { success: true, user: this.currentUser };
  },
  
  // Logout the current user
  async logout(): Promise<void> {
    // In a real app, you might need to invalidate the token on the server
    // await fetch('/api/auth/logout', { method: 'POST' });
    
    // Clear local storage and state
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    this.currentUser = null;
  },
  
  // Get the user's booking history
  async getBookingHistory(): Promise<any[]> {
    const user = this.getCurrentUser();
    if (!user) return [];
    
    return await travelAPI.getBookingHistory(user.id);
  }
};