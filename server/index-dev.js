import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'AI Travel Planner API is running'
  });
});

// Mock API endpoints for development
app.get('/api/flights/search', (req, res) => {
  res.json({
    success: true,
    data: {
      flights: [
        {
          id: 'FL001',
          airline: 'Mock Airlines',
          departure: 'New York',
          arrival: 'London',
          price: 599,
          duration: '7h 30m',
          departureTime: '10:00 AM',
          arrivalTime: '9:30 PM'
        }
      ]
    }
  });
});

app.get('/api/hotels/search', (req, res) => {
  res.json({
    success: true,
    data: {
      hotels: [
        {
          id: 'HT001',
          name: 'Mock Hotel',
          location: 'London',
          price: 150,
          rating: 4.5,
          amenities: ['WiFi', 'Pool', 'Gym']
        }
      ]
    }
  });
});

app.get('/api/weather/forecast/:location', (req, res) => {
  res.json({
    success: true,
    data: {
      location: req.params.location,
      forecast: [
        {
          date: new Date().toISOString().split('T')[0],
          temperature: 22,
          condition: 'Sunny',
          humidity: 65
        }
      ]
    }
  });
});

app.post('/api/ai-planner/itinerary', (req, res) => {
  res.json({
    success: true,
    data: {
      itinerary: [
        {
          day: 1,
          activities: [
            {
              time: '09:00',
              activity: 'Visit Big Ben',
              location: 'Westminster',
              duration: '2 hours',
              cost: 25
            }
          ]
        }
      ],
      totalCost: 500,
      source: 'mock-ai'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Travel Planner DEV server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 API base: http://localhost:${PORT}/api`);
});

export default app;
