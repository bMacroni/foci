// Travel time service using GraphHopper API
// GraphHopper has a generous free tier (1000 requests/day)

const TRAVEL_CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const travelCache = new Map();

/**
 * Calculate travel time between two locations using OpenRouteService API
 * @param {string} origin - Origin location (coordinates or place name)
 * @param {string} destination - Destination location (coordinates or place name)
 * @param {string} mode - Transportation mode ('driving', 'walking', 'cycling', 'transit')
 * @returns {Promise<Object>} Travel time data object
 */
export async function calculateTravelTime(origin, destination, mode = 'driving') {
  try {
    // Generate cache key
    const cacheKey = `${origin}_${destination}_${mode}`;
    
    // Check cache first
    const cachedData = travelCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < TRAVEL_CACHE_DURATION) {
      console.log(`[TravelTimeService] Using cached travel data for ${origin} to ${destination}`);
      return cachedData.data;
    }

    console.log(`[TravelTimeService] Calculating travel time from ${origin} to ${destination} via ${mode}`);

    // Parse locations - if they're coordinates, use them directly
    let originCoords = await parseLocation(origin);
    let destCoords = await parseLocation(destination);

    // If geocoding fails, try with just the city name (before comma)
    if (!originCoords && origin.includes(',')) {
      const cityName = origin.split(',')[0].trim();
      console.log(`[TravelTimeService] Trying geocoding with city name only: ${cityName}`);
      originCoords = await parseLocation(cityName);
    }
    
    if (!destCoords && destination.includes(',')) {
      const cityName = destination.split(',')[0].trim();
      console.log(`[TravelTimeService] Trying geocoding with city name only: ${cityName}`);
      destCoords = await parseLocation(cityName);
    }

    if (!originCoords || !destCoords) {
      throw new Error(`Could not parse locations: ${origin} or ${destination}`);
    }

    // Map our modes to GraphHopper modes
    const ghMode = mapTransportMode(mode);

    // Build GraphHopper API URL
    const apiUrl = `https://graphhopper.com/api/1/route?point=${originCoords.latitude},${originCoords.longitude}&point=${destCoords.latitude},${destCoords.longitude}&vehicle=${ghMode}&key=test&instructions=false&calc_points=false&points_encoded=false`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`GraphHopper API error: ${response.status} ${response.statusText}`);
    }

    const travelData = await response.json();
    
    // Process the travel data
    const processedData = processTravelData(travelData, mode);
    
    // Cache the result
    travelCache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    console.log(`[TravelTimeService] Travel data fetched and cached for ${origin} to ${destination}`);
    return processedData;

  } catch (error) {
    console.error(`[TravelTimeService] Error calculating travel time from ${origin} to ${destination}:`, error);
    
    // Return fallback data if API fails
    return {
      duration_minutes: 30,
      distance_miles: 10,
      mode: mode,
      error: error.message
    };
  }
}

/**
 * Parse location string to coordinates
 * @param {string} location - Location string (coordinates or place name)
 * @returns {Promise<Object|null>} Object with latitude and longitude, or null if not found
 */
async function parseLocation(location) {
  // If it's already coordinates, parse them directly
  if (location.includes(',')) {
    const coords = location.split(',').map(coord => parseFloat(coord.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      return {
        latitude: coords[0],
        longitude: coords[1]
      };
    }
  }

  // If it's a special location like 'current_location', return null (will be handled by caller)
  if (location === 'current_location' || location === 'home' || location === 'work') {
    return null;
  }

  // Try to geocode the location using Open-Meteo geocoding (same as weather service)
  try {
    console.log(`[TravelTimeService] Geocoding location: ${location}`);
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    
    const response = await fetch(geocodeUrl);
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const geocodeData = await response.json();
    
    if (geocodeData.results && geocodeData.results.length > 0) {
      const result = geocodeData.results[0];
      console.log(`[TravelTimeService] Found coordinates: ${result.latitude}, ${result.longitude} for ${result.name}`);
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
      };
    }
    
    console.log(`[TravelTimeService] No geocoding results found for: ${location}`);
    return null;
  } catch (error) {
    console.error(`[TravelTimeService] Geocoding error for ${location}:`, error);
    return null;
  }
}

/**
 * Map our transportation modes to GraphHopper modes
 * @param {string} mode - Our mode string
 * @returns {string} GraphHopper mode
 */
function mapTransportMode(mode) {
  const modeMap = {
    'driving': 'car',
    'walking': 'foot',
    'cycling': 'bike',
    'transit': 'car' // GraphHopper doesn't have transit, fallback to car
  };
  
  return modeMap[mode] || 'car';
}

/**
 * Process raw travel data from GraphHopper API
 * @param {Object} travelData - Raw travel data from API
 * @param {string} mode - Transportation mode
 * @returns {Object} Processed travel data
 */
function processTravelData(travelData, mode) {
  // GraphHopper returns route data with paths array
  if (!travelData.paths || travelData.paths.length === 0) {
    throw new Error('No route found');
  }
  
  const path = travelData.paths[0];
  const duration = path.time; // Duration in milliseconds
  const distance = path.distance; // Distance in meters
  
  // Convert duration from milliseconds to minutes
  const durationMinutes = Math.round(duration / 60000);
  
  // Convert distance from meters to miles
  const distanceMiles = distance / 1609.34;
  
  return {
    duration_minutes: durationMinutes,
    distance_miles: Math.round(distanceMiles * 10) / 10, // Round to 1 decimal place
    mode: mode,
    duration_seconds: Math.round(duration / 1000),
    distance_meters: Math.round(distance)
  };
}

/**
 * Get travel time with fallback for special locations
 * @param {string} origin - Origin location
 * @param {string} destination - Destination location
 * @param {string} mode - Transportation mode
 * @returns {Promise<Object>} Travel time data
 */
export async function getTravelTime(origin, destination, mode = 'driving') {
  // Handle special location cases
  if (origin === 'current_location' || destination === 'current_location') {
    console.log('[TravelTimeService] Current location specified, using fallback travel time');
    return {
      duration_minutes: 15,
      distance_miles: 5,
      mode: mode,
      note: 'Using estimated travel time for current location'
    };
  }

  if (origin === 'home' || destination === 'home') {
    console.log('[TravelTimeService] Home location specified, using fallback travel time');
    return {
      duration_minutes: 20,
      distance_miles: 8,
      mode: mode,
      note: 'Using estimated travel time for home location'
    };
  }

  if (origin === 'work' || destination === 'work') {
    console.log('[TravelTimeService] Work location specified, using fallback travel time');
    return {
      duration_minutes: 25,
      distance_miles: 12,
      mode: mode,
      note: 'Using estimated travel time for work location'
    };
  }

  // If both locations are valid, calculate real travel time
  return await calculateTravelTime(origin, destination, mode);
}

/**
 * Clear the travel time cache (useful for testing or manual cache management)
 */
export function clearTravelCache() {
  travelCache.clear();
  console.log('[TravelTimeService] Travel cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getTravelCacheStats() {
  return {
    size: travelCache.size,
    entries: Array.from(travelCache.keys())
  };
} 