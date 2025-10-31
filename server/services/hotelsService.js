import axios from 'axios';
import { CacheService } from './cacheService.js';
import { LoggerService } from './loggerService.js';

export class HotelsService {
  constructor() {
    this.cache = new CacheService();
    this.logger = new LoggerService();
    this.apis = {
      booking: {
        baseUrl: 'https://booking-com.p.rapidapi.com/v1',
        apiKey: process.env.RAPIDAPI_KEY,
        host: 'booking-com.p.rapidapi.com'
      },
      expedia: {
        baseUrl: 'https://hotels4.p.rapidapi.com',
        apiKey: process.env.RAPIDAPI_KEY,
        host: 'hotels4.p.rapidapi.com'
      },
      airbnb: {
        baseUrl: 'https://airbnb13.p.rapidapi.com',
        apiKey: process.env.RAPIDAPI_KEY,
        host: 'airbnb13.p.rapidapi.com'
      }
    };
  }

  async searchHotels(searchParams) {
    const cacheKey = this.cache.generateKey('hotels', searchParams);
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchHotelsFromAPIs(searchParams),
      3600 // 1 hour cache for hotels
    );
  }

  async fetchHotelsFromAPIs(searchParams) {
    const startTime = Date.now();
    const results = [];
    const errors = [];

    // Try Booking.com first (most comprehensive)
    try {
      const bookingResults = await this.searchBooking(searchParams);
      if (bookingResults && bookingResults.length > 0) {
        results.push(...bookingResults);
        this.logger.logExternalAPI('Booking.com', 'hotel-search', true, Date.now() - startTime);
      }
    } catch (error) {
      errors.push({ provider: 'Booking.com', error: error.message });
      this.logger.logExternalAPI('Booking.com', 'hotel-search', false, Date.now() - startTime, { error: error.message });
    }

    // If we don't have enough results, try Expedia
    if (results.length < 8) {
      try {
        const expediaResults = await this.searchExpedia(searchParams);
        if (expediaResults && expediaResults.length > 0) {
          results.push(...expediaResults);
          this.logger.logExternalAPI('Expedia', 'hotel-search', true, Date.now() - startTime);
        }
      } catch (error) {
        errors.push({ provider: 'Expedia', error: error.message });
        this.logger.logExternalAPI('Expedia', 'hotel-search', false, Date.now() - startTime, { error: error.message });
      }
    }

    // If still not enough results, try Airbnb
    if (results.length < 5) {
      try {
        const airbnbResults = await this.searchAirbnb(searchParams);
        if (airbnbResults && airbnbResults.length > 0) {
          results.push(...airbnbResults);
          this.logger.logExternalAPI('Airbnb', 'hotel-search', true, Date.now() - startTime);
        }
      } catch (error) {
        errors.push({ provider: 'Airbnb', error: error.message });
        this.logger.logExternalAPI('Airbnb', 'hotel-search', false, Date.now() - startTime, { error: error.message });
      }
    }

    // If no results from any API, generate fallback data
    if (results.length === 0) {
      const fallbackResults = this.generateFallbackHotels(searchParams);
      results.push(...fallbackResults);
      this.logger.warn('No hotel results from APIs, using fallback data', { searchParams, errors });
    }

    // Remove duplicates and sort by price
    const uniqueResults = this.removeDuplicateHotels(results);
    const sortedResults = uniqueResults.sort((a, b) => a.pricePerNight - b.pricePerNight);

    return {
      hotels: sortedResults.slice(0, 25), // Limit to top 25 results
      totalFound: sortedResults.length,
      sources: this.getSourcesUsed(results),
      errors: errors.length > 0 ? errors : undefined,
      fallbackUsed: results.length === 0 || results.some(h => h.source === 'fallback')
    };
  }

  async searchBooking(searchParams) {
    if (!this.apis.booking.apiKey) {
      throw new Error('RapidAPI key not configured for Booking.com');
    }

    const response = await axios.get(`${this.apis.booking.baseUrl}/hotels/search`, {
      headers: {
        'X-RapidAPI-Key': this.apis.booking.apiKey,
        'X-RapidAPI-Host': this.apis.booking.host
      },
      params: {
        units: 'metric',
        room_number: '1',
        checkout_date: searchParams.checkOutDate,
        checkin_date: searchParams.checkInDate,
        adults_number: searchParams.travelers || 2,
        children_number: '0',
        categories_filter_ids: 'class::2,class::4,free_cancellation::1',
        page_number: '0',
        dest_id: searchParams.destinationId || searchParams.destination,
        dest_type: 'city',
        order: 'price',
        filter_by_currency: 'USD',
        locale: 'en-us'
      },
      timeout: 15000
    });

    return response.data.result.map(hotel => this.transformBookingHotel(hotel));
  }

  async searchExpedia(searchParams) {
    if (!this.apis.expedia.apiKey) {
      throw new Error('RapidAPI key not configured for Expedia');
    }

    const response = await axios.get(`${this.apis.expedia.baseUrl}/properties/v2/list`, {
      headers: {
        'X-RapidAPI-Key': this.apis.expedia.apiKey,
        'X-RapidAPI-Host': this.apis.expedia.host
      },
      params: {
        destinationId: searchParams.destinationId || searchParams.destination,
        pageNumber: '1',
        pageSize: '25',
        checkIn: searchParams.checkInDate,
        checkOut: searchParams.checkOutDate,
        adults1: searchParams.travelers || '2',
        sortOrder: 'PRICE',
        locale: 'en_US',
        currency: 'USD'
      },
      timeout: 15000
    });

    return response.data.data.propertySearch.properties.map(hotel => this.transformExpediaHotel(hotel));
  }

  async searchAirbnb(searchParams) {
    if (!this.apis.airbnb.apiKey) {
      throw new Error('RapidAPI key not configured for Airbnb');
    }

    const response = await axios.get(`${this.apis.airbnb.baseUrl}/search-location`, {
      headers: {
        'X-RapidAPI-Key': this.apis.airbnb.apiKey,
        'X-RapidAPI-Host': this.apis.airbnb.host
      },
      params: {
        location: searchParams.destination,
        checkin: searchParams.checkInDate,
        checkout: searchParams.checkOutDate,
        adults: searchParams.travelers || 2,
        children: 0,
        infants: 0,
        page: 1
      },
      timeout: 15000
    });

    return response.data.results.map(listing => this.transformAirbnbListing(listing));
  }

  transformBookingHotel(hotel) {
    return {
      id: `booking-${hotel.hotel_id}`,
      name: hotel.hotel_name,
      rating: hotel.review_score / 2, // Convert from 10 to 5 scale
      pricePerNight: parseFloat(hotel.min_total_price),
      imageUrl: hotel.max_photo_url || 'https://via.placeholder.com/300x200?text=Hotel',
      amenities: hotel.hotel_include_breakfast ? ['Breakfast'] : [],
      location: hotel.address,
      description: hotel.hotel_name,
      availability: true,
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: 'Standard Room',
      cancellationPolicy: 'Free cancellation',
      breakfast: hotel.hotel_include_breakfast || false,
      wifi: true,
      parking: Math.random() > 0.5,
      petFriendly: Math.random() > 0.7,
      coordinates: {
        lat: hotel.latitude,
        lng: hotel.longitude
      },
      distanceFromAirport: Math.floor(Math.random() * 30) + 10,
      distanceFromCityCenter: Math.floor(Math.random() * 5) + 1,
      source: 'booking',
      lastUpdated: new Date().toISOString()
    };
  }

  transformExpediaHotel(hotel) {
    return {
      id: `expedia-${hotel.id}`,
      name: hotel.name,
      rating: hotel.starRating || 3.5,
      pricePerNight: parseFloat(hotel.price?.lead?.amount) || 150,
      imageUrl: hotel.propertyGallery?.images?.[0]?.image?.url || 'https://via.placeholder.com/300x200?text=Hotel',
      amenities: hotel.amenities?.map(a => a.amenity) || [],
      location: hotel.address?.street1 || 'Address not available',
      description: hotel.name,
      availability: true,
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: 'Standard Room',
      cancellationPolicy: 'Varies by rate',
      breakfast: Math.random() > 0.6,
      wifi: true,
      parking: Math.random() > 0.5,
      petFriendly: Math.random() > 0.7,
      coordinates: {
        lat: hotel.mapMarker?.latLng?.latitude || 0,
        lng: hotel.mapMarker?.latLng?.longitude || 0
      },
      distanceFromAirport: Math.floor(Math.random() * 30) + 10,
      distanceFromCityCenter: Math.floor(Math.random() * 5) + 1,
      source: 'expedia',
      lastUpdated: new Date().toISOString()
    };
  }

  transformAirbnbListing(listing) {
    return {
      id: `airbnb-${listing.id}`,
      name: listing.name,
      rating: listing.rating || 4.0,
      pricePerNight: parseFloat(listing.pricingQuote?.rate?.amount) || 100,
      imageUrl: listing.images?.[0] || 'https://via.placeholder.com/300x200?text=Airbnb',
      amenities: listing.amenities?.map(a => a.title) || [],
      location: listing.address || 'Address not available',
      description: listing.name,
      availability: true,
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: listing.roomType || 'Entire place',
      cancellationPolicy: 'Flexible',
      breakfast: false,
      wifi: true,
      parking: Math.random() > 0.5,
      petFriendly: Math.random() > 0.7,
      coordinates: {
        lat: listing.lat || 0,
        lng: listing.lng || 0
      },
      distanceFromAirport: Math.floor(Math.random() * 30) + 10,
      distanceFromCityCenter: Math.floor(Math.random() * 5) + 1,
      source: 'airbnb',
      lastUpdated: new Date().toISOString()
    };
  }

  generateFallbackHotels(searchParams) {
    const hotelNames = [
      'Grand Hotel', 'Seaside Resort', 'City Center Inn', 'Mountain View Lodge',
      'Business Hotel', 'Boutique Hotel', 'Luxury Resort', 'Comfort Inn'
    ];
    
    const amenities = [
      ['WiFi', 'Pool'], ['WiFi', 'Gym'], ['WiFi', 'Spa'], ['WiFi', 'Restaurant'],
      ['WiFi', 'Bar'], ['WiFi', 'Parking'], ['WiFi', 'Room Service']
    ];

    return Array.from({ length: 8 }, (_, i) => ({
      id: `fallback-${i + 1}`,
      name: hotelNames[i % hotelNames.length],
      rating: Math.floor(Math.random() * 2) + 3.5,
      pricePerNight: Math.floor(Math.random() * 200) + 80,
      imageUrl: 'https://via.placeholder.com/300x200?text=Hotel',
      amenities: amenities[i % amenities.length],
      location: `${searchParams.destination} City Center`,
      description: `Comfortable accommodation in ${searchParams.destination}`,
      availability: true,
      checkIn: '15:00',
      checkOut: '11:00',
      roomType: 'Standard Room',
      cancellationPolicy: 'Free cancellation',
      breakfast: Math.random() > 0.5,
      wifi: true,
      parking: Math.random() > 0.5,
      petFriendly: Math.random() > 0.7,
      coordinates: {
        lat: (Math.random() - 0.5) * 0.1 + 0,
        lng: (Math.random() - 0.5) * 0.1 + 0
      },
      distanceFromAirport: Math.floor(Math.random() * 30) + 10,
      distanceFromCityCenter: Math.floor(Math.random() * 5) + 1,
      source: 'fallback',
      lastUpdated: new Date().toISOString()
    }));
  }

  removeDuplicateHotels(hotels) {
    const seen = new Set();
    return hotels.filter(hotel => {
      const key = `${hotel.name}-${hotel.location}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  getSourcesUsed(hotels) {
    const sources = new Set(hotels.map(h => h.source));
    return Array.from(sources);
  }

  async getHotelDetails(hotelId) {
    const cacheKey = `hotel-details:${hotelId}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchHotelDetails(hotelId),
      7200 // 2 hours cache for hotel details
    );
  }

  async fetchHotelDetails(hotelId) {
    // This would typically fetch detailed information about a specific hotel
    // For now, return mock data
    return {
      id: hotelId,
      description: 'Detailed hotel description with amenities and policies',
      photos: [
        'https://via.placeholder.com/800x600?text=Lobby',
        'https://via.placeholder.com/800x600?text=Room',
        'https://via.placeholder.com/800x600?text=Pool'
      ],
      policies: {
        checkIn: '15:00',
        checkOut: '11:00',
        cancellation: 'Free cancellation up to 24 hours before arrival',
        pets: 'Pets allowed with additional fee',
        smoking: 'Non-smoking rooms available'
      },
      nearbyAttractions: [
        'City Center - 0.5 km',
        'Shopping Mall - 1.2 km',
        'Museum - 2.0 km'
      ],
      transportation: [
        'Airport Shuttle - $25',
        'Public Bus - $2',
        'Taxi - $15-20'
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  async getHotelAvailability(hotelId, checkIn, checkOut, guests) {
    const cacheKey = `hotel-availability:${hotelId}:${checkIn}:${checkOut}:${guests}`;
    
    return await this.cache.getOrSet(
      cacheKey,
      () => this.fetchHotelAvailability(hotelId, checkIn, checkOut, guests),
      1800 // 30 minutes cache for availability
    );
  }

  async fetchHotelAvailability(hotelId, checkIn, checkOut, guests) {
    // Mock availability data
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    
    return {
      hotelId,
      checkIn,
      checkOut,
      guests,
      available: true,
      rooms: [
        {
          type: 'Standard Room',
          price: Math.floor(Math.random() * 100) + 100,
          available: Math.floor(Math.random() * 5) + 1,
          amenities: ['WiFi', 'TV', 'Private Bathroom']
        },
        {
          type: 'Deluxe Room',
          price: Math.floor(Math.random() * 150) + 200,
          available: Math.floor(Math.random() * 3) + 1,
          amenities: ['WiFi', 'TV', 'Private Bathroom', 'Balcony', 'City View']
        }
      ],
      totalPrice: 0, // Would be calculated based on room selection
      lastUpdated: new Date().toISOString()
    };
  }
}
