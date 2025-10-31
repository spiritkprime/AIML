import axios from 'axios';
import { CacheService } from './cacheService.js';
import { LoggerService } from './loggerService.js';

export class WeatherService {
  constructor() {
    this.cache = new CacheService();
    this.logger = new LoggerService();
    this.apis = {
      openweather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY
      },
      weatherapi: {
        baseUrl: 'http://api.weatherapi.com/v1',
        apiKey: process.env.WEATHERAPI_API_KEY
      }
    };
  }

  async getWeatherForecast(location, days = 7) {
    const cacheKey = `weather:${location}:${days}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchWeatherFromAPIs(location, days),
      1800 // 30 minutes cache for weather (changes frequently)
    );
  }

  async getCurrentWeather(location) {
    const cacheKey = `weather-current:${location}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchCurrentWeatherFromAPIs(location),
      900 // 15 minutes cache for current weather
    );
  }

  async fetchWeatherFromAPIs(location, days) {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Try OpenWeather first (most reliable)
    try {
      const openweatherResults = await this.fetchOpenWeatherForecast(location, days);
      if (openweatherResults) {
        results.push(openweatherResults);
        this.logger.logExternalAPI('OpenWeather', 'forecast', true, Date.now() - startTime);
      }
    } catch (error) {
      errors.push({ provider: 'OpenWeather', error: error.message });
      this.logger.logExternalAPI('OpenWeather', 'forecast', false, Date.now() - startTime, { error: error.message });
    }

    // If OpenWeather fails, try WeatherAPI
    if (results.length === 0) {
      try {
        const weatherapiResults = await this.fetchWeatherAPIForecast(location, days);
        if (weatherapiResults) {
          results.push(weatherapiResults);
          this.logger.logExternalAPI('WeatherAPI', 'forecast', true, Date.now() - startTime);
        }
      } catch (error) {
        errors.push({ provider: 'WeatherAPI', error: error.message });
        this.logger.logExternalAPI('WeatherAPI', 'forecast', false, Date.now() - startTime, { error: error.message });
      }
    }

    // If no results from any API, generate fallback data
    if (results.length === 0) {
      const fallbackResults = this.generateFallbackWeather(location, days);
      results.push(fallbackResults);
      this.logger.warn('No weather results from APIs, using fallback data', { location, days, errors });
    }

    return {
      location,
      forecast: results[0],
      sources: results.map(r => r.source),
      errors: errors.length > 0 ? errors : undefined,
      fallbackUsed: results.length === 0 || results.some(r => r.source === 'fallback'),
      lastUpdated: new Date().toISOString()
    };
  }

  async fetchCurrentWeatherFromAPIs(location) {
    const startTime = Date.now();
    const errors = [];

    // Try OpenWeather first
    try {
      const result = await this.fetchOpenWeatherCurrent(location);
      if (result) {
        this.logger.logExternalAPI('OpenWeather', 'current', true, Date.now() - startTime);
        return result;
      }
    } catch (error) {
      errors.push({ provider: 'OpenWeather', error: error.message });
      this.logger.logExternalAPI('OpenWeather', 'current', false, Date.now() - startTime, { error: error.message });
    }

    // Try WeatherAPI as fallback
    try {
      const result = await this.fetchWeatherAPICurrent(location);
      if (result) {
        this.logger.logExternalAPI('WeatherAPI', 'current', true, Date.now() - startTime);
        return result;
      }
    } catch (error) {
      errors.push({ provider: 'WeatherAPI', error: error.message });
      this.logger.logExternalAPI('WeatherAPI', 'current', false, Date.now() - startTime, { error: error.message });
    }

    // Generate fallback data if all APIs fail
    const fallbackResult = this.generateFallbackCurrentWeather(location);
    this.logger.warn('No current weather results from APIs, using fallback data', { location, errors });
    return fallbackResult;
  }

  async fetchOpenWeatherForecast(location, days) {
    if (!this.apis.openweather.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await axios.get(`${this.apis.openweather.baseUrl}/forecast`, {
      params: {
        q: location,
        appid: this.apis.openweather.apiKey,
        units: 'metric',
        cnt: Math.min(days * 8, 40) // OpenWeather provides 3-hour intervals
      },
      timeout: 10000
    });

    return this.transformOpenWeatherForecast(response.data, days);
  }

  async fetchOpenWeatherCurrent(location) {
    if (!this.apis.openweather.apiKey) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await axios.get(`${this.apis.openweather.baseUrl}/weather`, {
      params: {
        q: location,
        appid: this.apis.openweather.apiKey,
        units: 'metric'
      },
      timeout: 10000
    });

    return this.transformOpenWeatherCurrent(response.data);
  }

  async fetchWeatherAPIForecast(location, days) {
    if (!this.apis.weatherapi.apiKey) {
      throw new Error('WeatherAPI key not configured');
    }

    const response = await axios.get(`${this.apis.weatherapi.baseUrl}/forecast.json`, {
      params: {
        key: this.apis.weatherapi.apiKey,
        q: location,
        days: Math.min(days, 14), // WeatherAPI supports up to 14 days
        aqi: 'no'
      },
      timeout: 10000
    });

    return this.transformWeatherAPIForecast(response.data, days);
  }

  async fetchWeatherAPICurrent(location) {
    if (!this.apis.weatherapi.apiKey) {
      throw new Error('WeatherAPI key not configured');
    }

    const response = await axios.get(`${this.apis.weatherapi.baseUrl}/current.json`, {
      params: {
        key: this.apis.weatherapi.apiKey,
        q: location,
        aqi: 'no'
      },
      timeout: 10000
    });

    return this.transformWeatherAPICurrent(response.data);
  }

  transformOpenWeatherForecast(data, days) {
    const dailyData = this.groupOpenWeatherByDay(data.list, days);
    
    return {
      source: 'openweather',
      forecast: dailyData.map((dayData, index) => ({
        date: new Date(Date.now() + index * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: {
          min: Math.min(...dayData.map(d => d.main.temp_min)),
          max: Math.max(...dayData.map(d => d.main.temp_max)),
          current: dayData[0].main.temp
        },
        condition: this.getOpenWeatherCondition(dayData[0].weather[0].main),
        icon: dayData[0].weather[0].icon,
        humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
        windSpeed: Math.round(dayData.reduce((sum, d) => sum + d.wind.speed, 0) / dayData.length),
        precipitation: Math.round(dayData.reduce((sum, d) => sum + (d.rain?.['3h'] || 0), 0) / dayData.length),
        uvIndex: Math.round(dayData.reduce((sum, d) => sum + (d.uvi || 0), 0) / dayData.length),
        sunrise: new Date(dayData[0].sys.sunrise * 1000).toLocaleTimeString('en-US', { hour12: false }),
        sunset: new Date(dayData[0].sys.sunset * 1000).toLocaleTimeString('en-US', { hour12: false })
      }))
    };
  }

  transformOpenWeatherCurrent(data) {
    return {
      date: new Date().toISOString().split('T')[0],
      temperature: {
        min: data.main.temp_min,
        max: data.main.temp_max,
        current: data.main.temp
      },
      condition: this.getOpenWeatherCondition(data.weather[0].main),
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      precipitation: data.rain?.['1h'] || 0,
      uvIndex: data.uvi || 0,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour12: false }),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour12: false }),
      source: 'openweather'
    };
  }

  transformWeatherAPIForecast(data, days) {
    return {
      source: 'weatherapi',
      forecast: data.forecast.forecastday.slice(0, days).map(day => ({
        date: day.date,
        temperature: {
          min: day.day.mintemp_c,
          max: day.day.maxtemp_c,
          current: day.day.avgtemp_c
        },
        condition: day.day.condition.text,
        icon: day.day.condition.icon,
        humidity: day.day.avghumidity,
        windSpeed: day.day.maxwind_kph / 3.6, // Convert km/h to m/s
        precipitation: day.day.totalprecip_mm,
        uvIndex: day.day.uv,
        sunrise: day.astro.sunrise,
        sunset: day.astro.sunset
      }))
    };
  }

  transformWeatherAPICurrent(data) {
    return {
      date: new Date().toISOString().split('T')[0],
      temperature: {
        min: data.current.temp_c - 2,
        max: data.current.temp_c + 2,
        current: data.current.temp_c
      },
      condition: data.current.condition.text,
      icon: data.current.condition.icon,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph / 3.6, // Convert km/h to m/s
      precipitation: data.current.precip_mm,
      uvIndex: data.current.uv,
      sunrise: data.location.localtime,
      sunset: data.location.localtime,
      source: 'weatherapi'
    };
  }

  groupOpenWeatherByDay(list, days) {
    const dailyGroups = {};
    
    list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      if (!dailyGroups[date]) {
        dailyGroups[date] = [];
      }
      dailyGroups[date].push(item);
    });

    return Object.values(dailyGroups).slice(0, days);
  }

  getOpenWeatherCondition(weatherMain) {
    const conditionMap = {
      'Clear': 'Clear',
      'Clouds': 'Cloudy',
      'Rain': 'Rainy',
      'Snow': 'Snowy',
      'Thunderstorm': 'Stormy',
      'Drizzle': 'Light Rain',
      'Mist': 'Foggy',
      'Smoke': 'Hazy',
      'Haze': 'Hazy',
      'Dust': 'Dusty',
      'Fog': 'Foggy',
      'Sand': 'Sandy',
      'Ash': 'Ash',
      'Squall': 'Windy',
      'Tornado': 'Stormy'
    };
    
    return conditionMap[weatherMain] || weatherMain;
  }

  generateFallbackWeather(location, days) {
    const conditions = ['Clear', 'Cloudy', 'Partly Cloudy', 'Light Rain', 'Sunny'];
    const icons = ['01d', '02d', '03d', '10d', '01d'];
    
    return {
      source: 'fallback',
      forecast: Array.from({ length: days }, (_, i) => {
        const condition = conditions[i % conditions.length];
        const icon = icons[i % icons.length];
        const baseTemp = 20 + Math.sin(i * 0.5) * 10; // Varying temperature pattern
        
        return {
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          temperature: {
            min: Math.round(baseTemp - 5),
            max: Math.round(baseTemp + 5),
            current: Math.round(baseTemp)
          },
          condition,
          icon,
          humidity: Math.floor(Math.random() * 30) + 50,
          windSpeed: Math.floor(Math.random() * 10) + 5,
          precipitation: condition.includes('Rain') ? Math.floor(Math.random() * 10) + 5 : 0,
          uvIndex: Math.floor(Math.random() * 5) + 3,
          sunrise: '06:00',
          sunset: '18:00'
        };
      })
    };
  }

  generateFallbackCurrentWeather(location) {
    const conditions = ['Clear', 'Cloudy', 'Partly Cloudy', 'Light Rain', 'Sunny'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const baseTemp = 20 + (Math.random() - 0.5) * 20;
    
    return {
      date: new Date().toISOString().split('T')[0],
      temperature: {
        min: Math.round(baseTemp - 5),
        max: Math.round(baseTemp + 5),
        current: Math.round(baseTemp)
      },
      condition,
      icon: '01d',
      humidity: Math.floor(Math.random() * 30) + 50,
      windSpeed: Math.floor(Math.random() * 10) + 5,
      precipitation: condition.includes('Rain') ? Math.floor(Math.random() * 10) + 5 : 0,
      uvIndex: Math.floor(Math.random() * 5) + 3,
      sunrise: '06:00',
      sunset: '18:00',
      source: 'fallback'
    };
  }

  async getWeatherAlerts(location) {
    const cacheKey = `weather-alerts:${location}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchWeatherAlerts(location),
      3600 // 1 hour cache for weather alerts
    );
  }

  async fetchWeatherAlerts(location) {
    // This would typically fetch weather alerts from APIs
    // For now, return mock data
    return {
      location,
      alerts: [
        {
          type: 'Severe Weather',
          title: 'Heavy Rain Warning',
          description: 'Heavy rainfall expected in the next 24 hours',
          severity: 'moderate',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString()
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  async getWeatherHistory(location, startDate, endDate) {
    const cacheKey = `weather-history:${location}:${startDate}:${endDate}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchWeatherHistory(location, startDate, endDate),
      86400 // 24 hours cache for historical weather
    );
  }

  async fetchWeatherHistory(location, startDate, endDate) {
    // This would typically fetch historical weather data
    // For now, return mock data
    const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    
    return {
      location,
      startDate,
      endDate,
      data: Array.from({ length: days }, (_, i) => ({
        date: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temperature: {
          min: Math.floor(Math.random() * 20) + 10,
          max: Math.floor(Math.random() * 20) + 20,
          average: Math.floor(Math.random() * 15) + 15
        },
        precipitation: Math.floor(Math.random() * 20),
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 15) + 5
      })),
      lastUpdated: new Date().toISOString()
    };
  }
}
