import axios from 'axios';
import { CacheService } from './cacheService.js';
import { LoggerService } from './loggerService.js';

export class FlightsService {
  constructor() {
    this.cache = new CacheService();
    this.logger = new LoggerService();
    this.apis = {
      amadeus: {
        baseUrl: 'https://test.api.amadeus.com/v2',
        apiKey: process.env.AMADEUS_API_KEY,
        apiSecret: process.env.AMADEUS_API_SECRET,
        token: null,
        tokenExpiry: null
      },
      skyscanner: {
        baseUrl: 'https://partners.api.skyscanner.net/apiservices/v3',
        apiKey: process.env.SKYSCANNER_API_KEY
      },
      google: {
        baseUrl: 'https://www.googleapis.com/qpxExpress/v1',
        apiKey: process.env.GOOGLE_FLIGHTS_API_KEY
      }
    };
  }

  async searchFlights(searchParams) {
    const cacheKey = this.cache.generateKey('flights', searchParams);
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchFlightsFromAPIs(searchParams),
      1800 // 30 minutes cache for flights
    );
  }

  async fetchFlightsFromAPIs(searchParams) {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Try Amadeus first (most reliable for international flights)
    try {
      const amadeusResults = await this.searchAmadeus(searchParams);
      if (amadeusResults && amadeusResults.length > 0) {
        results.push(...amadeusResults);
        this.logger.logExternalAPI('Amadeus', 'flight-search', true, Date.now() - startTime);
      }
    } catch (error) {
      errors.push({ provider: 'Amadeus', error: error.message });
      this.logger.logExternalAPI('Amadeus', 'flight-search', false, Date.now() - startTime, { error: error.message });
    }

    // If we don't have enough results, try Skyscanner
    if (results.length < 5) {
      try {
        const skyscannerResults = await this.searchSkyscanner(searchParams);
        if (skyscannerResults && skyscannerResults.length > 0) {
          results.push(...skyscannerResults);
          this.logger.logExternalAPI('Skyscanner', 'flight-search', true, Date.now() - startTime);
        }
      } catch (error) {
        errors.push({ provider: 'Skyscanner', error: error.message });
        this.logger.logExternalAPI('Skyscanner', 'flight-search', false, Date.now() - startTime, { error: error.message });
      }
    }

    // If still not enough results, try Google Flights
    if (results.length < 3) {
      try {
        const googleResults = await this.searchGoogleFlights(searchParams);
        if (googleResults && googleResults.length > 0) {
          results.push(...googleResults);
          this.logger.logExternalAPI('Google Flights', 'flight-search', true, Date.now() - startTime);
        }
      } catch (error) {
        errors.push({ provider: 'Google Flights', error: error.message });
        this.logger.logExternalAPI('Google Flights', 'flight-search', false, Date.now() - startTime, { error: error.message });
      }
    }

    // If no results from any API, generate fallback data
    if (results.length === 0) {
      const fallbackResults = this.generateFallbackFlights(searchParams);
      results.push(...fallbackResults);
      this.logger.warn('No flight results from APIs, using fallback data', { searchParams, errors });
    }

    // Remove duplicates and sort by price
    const uniqueResults = this.removeDuplicateFlights(results);
    const sortedResults = uniqueResults.sort((a, b) => a.price - b.price);

    return {
      flights: sortedResults.slice(0, 20), // Limit to top 20 results
      totalFound: sortedResults.length,
      sources: this.getSourcesUsed(results),
      errors: errors.length > 0 ? errors : undefined,
      fallbackUsed: results.length === 0 || results.some(f => f.source === 'fallback')
    };
  }

  async searchAmadeus(searchParams) {
    if (!this.apis.amadeus.apiKey || !this.apis.amadeus.apiSecret) {
      throw new Error('Amadeus API credentials not configured');
    }

    // Get or refresh token
    await this.refreshAmadeusToken();

    const response = await axios.get(`${this.apis.amadeus.baseUrl}/shopping/flight-offers`, {
      headers: {
        'Authorization': `Bearer ${this.apis.amadeus.token}`
      },
      params: {
        originLocationCode: searchParams.origin,
        destinationLocationCode: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate,
        adults: searchParams.travelers || 1,
        currencyCode: 'USD',
        max: 50
      },
      timeout: 10000
    });

    return response.data.data.map(flight => this.transformAmadeusFlight(flight));
  }

  async searchSkyscanner(searchParams) {
    if (!this.apis.skyscanner.apiKey) {
      throw new Error('Skyscanner API key not configured');
    }

    const response = await axios.get(`${this.apis.skyscanner.baseUrl}/flights/live/search/create`, {
      headers: {
        'x-api-key': this.apis.skyscanner.apiKey
      },
      data: {
        queryLegs: [
          {
            originPlaceId: searchParams.origin,
            destinationPlaceId: searchParams.destination,
            date: searchParams.departureDate
          }
        ],
        adults: searchParams.travelers || 1,
        childrenAges: [],
        cabinClass: 'CABIN_CLASS_ECONOMY'
      },
      timeout: 15000
    });

    // Skyscanner returns a session token, we'd need to poll for results
    // For simplicity, we'll return empty results here
    return [];
  }

  async searchGoogleFlights(searchParams) {
    if (!this.apis.google.apiKey) {
      throw new Error('Google Flights API key not configured');
    }

    const requestBody = {
      request: {
        passengers: {
          adultCount: searchParams.travelers || 1
        },
        slice: [
          {
            origin: searchParams.origin,
            destination: searchParams.destination,
            date: searchParams.departureDate
          }
        ],
        solutions: 20,
        refundable: false
      }
    };

    const response = await axios.post(
      `${this.apis.google.baseUrl}/trips/search?key=${this.apis.google.apiKey}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return response.data.trips.tripOption.map(option => this.transformGoogleFlight(option));
  }

  async refreshAmadeusToken() {
    if (this.apis.amadeus.token && this.apis.amadeus.tokenExpiry > Date.now()) {
      return; // Token is still valid
    }

    const response = await axios.post('https://test.api.amadeus.com/v1/security/oauth2/token', {
      grant_type: 'client_credentials',
      client_id: this.apis.amadeus.apiKey,
      client_secret: this.apis.amadeus.apiSecret
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });

    this.apis.amadeus.token = response.data.access_token;
    this.apis.amadeus.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
  }

  transformAmadeusFlight(flight) {
    return {
      id: flight.id,
      airline: flight.validatingAirlineCodes[0],
      airlineCode: flight.validatingAirlineCodes[0],
      flightNumber: flight.itineraries[0].segments[0].carrierCode + flight.itineraries[0].segments[0].number,
      departure: {
        airport: flight.itineraries[0].segments[0].departure.iataCode,
        airportCode: flight.itineraries[0].segments[0].departure.iataCode,
        time: flight.itineraries[0].segments[0].departure.at,
        city: flight.itineraries[0].segments[0].departure.iataCode,
        terminal: flight.itineraries[0].segments[0].departure.terminal
      },
      arrival: {
        airport: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode,
        airportCode: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode,
        time: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.at,
        city: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.iataCode,
        terminal: flight.itineraries[0].segments[flight.itineraries[0].segments.length - 1].arrival.terminal
      },
      duration: flight.itineraries[0].duration,
      price: parseFloat(flight.price.total),
      stops: flight.itineraries[0].segments.length - 1,
      aircraft: flight.itineraries[0].segments[0].aircraft?.code || 'Unknown',
      cabinClass: flight.travelerPricings[0].fareDetailsBySegment[0].cabin,
      baggageAllowance: flight.travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags?.weight || 'Not included',
      refundable: flight.pricingOptions.fareType === 'PUBLISHED',
      changeable: flight.pricingOptions.changePenalty === false,
      lastUpdated: new Date().toISOString(),
      source: 'amadeus'
    };
  }

  transformGoogleFlight(option) {
    // Simplified transformation for Google Flights
    return {
      id: option.id,
      airline: 'Google Flights',
      airlineCode: 'GF',
      flightNumber: 'GF' + Math.random().toString(36).substr(2, 6),
      departure: {
        airport: option.slice[0].segment[0].leg[0].origin,
        airportCode: option.slice[0].segment[0].leg[0].origin,
        time: option.slice[0].segment[0].leg[0].departureTime,
        city: option.slice[0].segment[0].leg[0].origin
      },
      arrival: {
        airport: option.slice[0].segment[0].leg[option.slice[0].segment[0].leg.length - 1].destination,
        airportCode: option.slice[0].segment[0].leg[option.slice[0].segment[0].leg.length - 1].destination,
        time: option.slice[0].segment[0].leg[option.slice[0].segment[0].leg.length - 1].arrivalTime,
        city: option.slice[0].segment[0].leg[option.slice[0].segment[0].leg.length - 1].destination
      },
      duration: option.slice[0].duration,
      price: parseFloat(option.pricing[0].saleTotal.replace('USD', '')),
      stops: option.slice[0].segment.length - 1,
      aircraft: 'Unknown',
      cabinClass: 'Economy',
      baggageAllowance: 'Not specified',
      refundable: false,
      changeable: false,
      lastUpdated: new Date().toISOString(),
      source: 'google'
    };
  }

  generateFallbackFlights(searchParams) {
    // Generate realistic fallback flight data when APIs fail
    const airlines = ['SkyLine Airways', 'Global Airlines', 'Premium Air', 'Express Jet'];
    const aircraft = ['Boeing 737', 'Airbus A320', 'Boeing 787', 'Airbus A350'];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `fallback-${i + 1}`,
      airline: airlines[i % airlines.length],
      airlineCode: airlines[i % airlines.length].substr(0, 2).toUpperCase(),
      flightNumber: `${airlines[i % airlines.length].substr(0, 2).toUpperCase()}${Math.floor(Math.random() * 9999) + 1000}`,
      departure: {
        airport: searchParams.origin,
        airportCode: searchParams.origin,
        time: '08:00',
        city: searchParams.origin
      },
      arrival: {
        airport: searchParams.destination,
        airportCode: searchParams.destination,
        time: '14:30',
        city: searchParams.destination
      },
      duration: '6h 30m',
      price: Math.floor(Math.random() * 400) + 300,
      stops: Math.random() > 0.7 ? 1 : 0,
      aircraft: aircraft[i % aircraft.length],
      cabinClass: 'Economy',
      baggageAllowance: '1 checked bag',
      refundable: false,
      changeable: true,
      lastUpdated: new Date().toISOString(),
      source: 'fallback'
    }));
  }

  removeDuplicateFlights(flights) {
    const seen = new Set();
    return flights.filter(flight => {
      const key = `${flight.airline}-${flight.flightNumber}-${flight.departure.time}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getSourcesUsed(flights) {
    const sources = new Set(flights.map(f => f.source));
    return Array.from(sources);
  }

  async getFlightDetails(flightId) {
    const cacheKey = `flight-details:${flightId}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchFlightDetails(flightId),
      3600 // 1 hour cache for flight details
    );
  }

  async fetchFlightDetails(flightId) {
    // This would typically fetch detailed information about a specific flight
    // For now, return mock data
    return {
      id: flightId,
      status: 'Scheduled',
      gate: 'A12',
      terminal: '1',
      boardingTime: '07:30',
      estimatedDeparture: '08:00',
      estimatedArrival: '14:30',
      actualDeparture: null,
      actualArrival: null,
      delays: 0,
      weather: 'Clear',
      lastUpdated: new Date().toISOString()
    };
  }
}
