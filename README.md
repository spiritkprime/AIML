# AI Travel Planner

A comprehensive, AI-powered travel planning application that integrates real-time data from multiple APIs to create personalized travel itineraries with intelligent edge case handling.

## 🚀 Features

### Real-Time Data Integration
- **Flight APIs**: Amadeus, Skyscanner, Google Flights with fallback handling
- **Hotel APIs**: Booking.com, Expedia, Airbnb via RapidAPI
- **Weather APIs**: OpenWeather, WeatherAPI with real-time forecasts
- **Caching**: Redis-based caching to minimize API calls and improve performance

### AI-Powered Itinerary Generation
- **OpenAI Integration**: GPT-4 powered itinerary generation
- **Personalization**: Tailored to travel style, budget, interests, and group type
- **Edge Case Handling**: Intelligent handling of budget conflicts, duration mismatches, and climate preferences
- **Fallback Systems**: Graceful degradation when APIs fail

### Advanced Travel Planning
- **Day-by-Day Itineraries**: Detailed schedules with time slots and activities
- **Cost Optimization**: Dynamic pricing and budget management
- **Weather Integration**: Weather-aware planning and indoor alternatives
- **Multi-Traveler Support**: Scalable costs and group-friendly activities

### Modern Frontend
- **React + TypeScript**: Modern, type-safe development
- **Tailwind CSS**: Beautiful, responsive UI components
- **Interactive Maps**: Mapbox integration for destination visualization
- **Real-Time Updates**: Live data updates and notifications

### Production-Ready Backend
- **Express.js Server**: Scalable Node.js backend
- **Rate Limiting**: API protection and abuse prevention
- **Comprehensive Logging**: Winston-based logging with performance monitoring
- **Health Checks**: System monitoring and automated maintenance

## 🏗️ Architecture

```
AI-Travel-Planner/
├── server/                 # Backend Express.js server
│   ├── services/          # Business logic services
│   │   ├── flightsService.js
│   │   ├── hotelsService.js
│   │   ├── weatherService.js
│   │   ├── aiPlannerService.js
│   │   ├── cacheService.js
│   │   ├── loggerService.js
│   │   └── healthCheckService.js
│   ├── routes/            # API route handlers
│   │   ├── flights.js
│   │   ├── hotels.js
│   │   ├── weather.js
│   │   ├── aiPlanner.js
│   │   └── cache.js
│   └── index.js           # Main server file
├── src/                   # Frontend React application
│   ├── components/        # React components
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main application component
├── package.json           # Dependencies and scripts
└── env.example           # Environment configuration template
```

## 🛠️ Technology Stack

### Backend
- **Node.js** + **Express.js**
- **Redis** for caching
- **OpenAI API** for AI itinerary generation
- **Winston** for logging
- **Rate Limiting** for API protection

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Framer Motion** for animations
- **Mapbox GL** for maps

### APIs & Services
- **Amadeus** for flight data
- **RapidAPI** for hotel data
- **OpenWeather** for weather data
- **Mapbox** for mapping services

## 📋 Prerequisites

- **Node.js** 18+ and **pnpm**
- **Redis** server running locally or remotely
- API keys for the following services:
  - OpenAI
  - Amadeus
  - RapidAPI
  - OpenWeather
  - Mapbox

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd AI-Travel-Planner
pnpm install
```

### 2. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` with your API keys and configuration:

```env
# Required API Keys
OPENAI_API_KEY=your_openai_api_key
AMADEUS_API_KEY=your_amadeus_api_key
AMADEUS_API_SECRET=your_amadeus_api_secret
RAPIDAPI_KEY=your_rapidapi_key
OPENWEATHER_API_KEY=your_openweather_api_key
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 3. Start Redis Server

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download and install Redis from https://redis.io/download
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
pnpm run dev:full

# Or start them separately
pnpm run server    # Backend on port 3001
pnpm run dev       # Frontend on port 5173
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔧 Development

### Available Scripts

```bash
pnpm run dev              # Start frontend development server
pnpm run server           # Start backend server
pnpm run dev:full         # Start both servers concurrently
pnpm run build            # Build frontend for production
pnpm run lint             # Run ESLint
pnpm run preview          # Preview production build
```

### Project Structure

```
src/
├── components/           # Reusable React components
│   ├── TravelPreferencesForm.tsx
│   ├── TravelPlanCard.tsx
│   ├── TravelPlanDetails.tsx
│   ├── BookingModal.tsx
│   └── ...
├── types/               # TypeScript type definitions
│   └── travel.ts        # Travel-related interfaces
├── utils/               # Utility functions
│   ├── mlTravelEngine.ts
│   └── ...
└── App.tsx              # Main application component
```

### API Endpoints

#### Flights
- `POST /api/flights/search` - Search for flights
- `GET /api/flights/:id` - Get flight details
- `GET /api/flights/airports/search` - Search airports

#### Hotels
- `POST /api/hotels/search` - Search for hotels
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels/:id/availability` - Check availability

#### Weather
- `GET /api/weather/forecast/:location` - Get weather forecast
- `GET /api/weather/current/:location` - Get current weather
- `GET /api/weather/alerts/:location` - Get weather alerts

#### AI Planner
- `POST /api/ai-planner/itinerary` - Generate AI itinerary
- `POST /api/ai-planner/suggestions` - Get travel suggestions
- `POST /api/ai-planner/optimize` - Optimize existing itinerary

#### Cache Management
- `GET /api/cache/stats` - Get cache statistics
- `DELETE /api/cache/:key` - Delete cache entry
- `POST /api/cache/clear-expired` - Clear expired entries

## 🌟 Key Features in Detail

### Edge Case Handling

The AI planner intelligently handles various edge cases:

1. **Budget Conflicts**: Suggests alternatives when estimated costs exceed budget
2. **Duration Mismatches**: Adapts itineraries for very short or long trips
3. **Climate Conflicts**: Provides indoor alternatives for weather-dependent activities
4. **API Failures**: Graceful fallback to mock data when external APIs fail

### Real-Time Data Integration

- **Multi-API Strategy**: Primary and fallback APIs for each service
- **Intelligent Caching**: Redis-based caching with appropriate TTLs
- **Performance Monitoring**: Response time tracking and logging
- **Error Handling**: Comprehensive error handling and user feedback

### AI Itinerary Generation

- **Context-Aware**: Considers travel style, group type, and pace
- **Weather Integration**: Adapts plans based on weather forecasts
- **Cost Optimization**: Balances activities and costs within budget
- **Cultural Sensitivity**: Includes local customs and cultural tips

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers and protection
- **Environment Variables**: Secure API key management

## 📊 Monitoring & Logging

- **Health Checks**: Automated system health monitoring
- **Performance Metrics**: Response time and API call tracking
- **Structured Logging**: Winston-based logging with multiple transports
- **Error Tracking**: Comprehensive error logging and monitoring

## 🚀 Deployment

### Production Build

```bash
# Build frontend
pnpm run build

# Start production server
NODE_ENV=production pnpm run server
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
REDIS_URL=your_production_redis_url
OPENAI_API_KEY=your_production_openai_key
# ... other production API keys
```

### Docker Support (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "run", "server"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for AI itinerary generation capabilities
- Amadeus, Skyscanner, and other API providers
- The React and Node.js communities
- Contributors and beta testers

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Happy Travel Planning! ✈️🌍**