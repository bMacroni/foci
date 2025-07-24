import { createClient } from '@supabase/supabase-js';

// Weather service using Open-Meteo API
// Open-Meteo is completely free and doesn't require an API key

const WEATHER_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const weatherCache = new Map();

/**
 * Get weather data for a location using Open-Meteo API
 * @param {string} location - Location string (can be coordinates or place name)
 * @param {Date} date - Date to get weather for
 * @returns {Promise<Object>} Weather data object
 */
export async function getWeatherData(location, date = new Date()) {
  try {
    // Generate cache key
    const cacheKey = `${location}_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < WEATHER_CACHE_DURATION) {
      console.log(`[WeatherService] Using cached weather data for ${location}`);
      return cachedData.data;
    }

    console.log(`[WeatherService] Fetching weather data for ${location} on ${date.toISOString().split('T')[0]}`);

    // Parse location - if it's coordinates, use them directly
    let latitude, longitude;
    
    if (location.includes(',')) {
      // Assume it's coordinates
      const coords = location.split(',').map(coord => parseFloat(coord.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        latitude = coords[0];
        longitude = coords[1];
      }
    }

    // If not coordinates, try to geocode the location
    if (!latitude || !longitude) {
      let geocodeResult = await geocodeLocation(location);
      
      // If geocoding fails, try with just the city name (before comma)
      if (!geocodeResult && location.includes(',')) {
        const cityName = location.split(',')[0].trim();
        console.log(`[WeatherService] Trying geocoding with city name only: ${cityName}`);
        geocodeResult = await geocodeLocation(cityName);
      }
      
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      } else {
        throw new Error(`Could not geocode location: ${location}`);
      }
    }

    // Format date for API
    const dateStr = date.toISOString().split('T')[0];
    
    // Fetch weather data from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
    
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }

    const weatherData = await response.json();
    
    // Process the weather data
    const processedData = processWeatherData(weatherData, date);
    
    // Cache the result
    weatherCache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    console.log(`[WeatherService] Weather data fetched and cached for ${location}`);
    return processedData;

  } catch (error) {
    console.error(`[WeatherService] Error fetching weather data for ${location}:`, error);
    
    // Return fallback data if API fails
    return {
      temperature: 70,
      condition: 'unknown',
      precipitation_chance: 0.2,
      suitable_for_outdoor: true,
      error: error.message
    };
  }
}

/**
 * Geocode a location string to coordinates using Open-Meteo's geocoding API
 * @param {string} location - Location string (e.g., "New York, NY")
 * @returns {Promise<Object|null>} Object with latitude and longitude, or null if not found
 */
async function geocodeLocation(location) {
  try {
    console.log(`[WeatherService] Geocoding location: ${location}`);
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    
    console.log(`[WeatherService] Geocoding URL: ${geocodeUrl}`);
    const response = await fetch(geocodeUrl);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const geocodeData = await response.json();
    console.log(`[WeatherService] Geocoding response:`, geocodeData);
    
    if (geocodeData.results && geocodeData.results.length > 0) {
      const result = geocodeData.results[0];
      console.log(`[WeatherService] Found coordinates: ${result.latitude}, ${result.longitude} for ${result.name}`);
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        name: result.name,
        country: result.country
      };
    }
    
    console.log(`[WeatherService] No geocoding results found for: ${location}`);
    return null;
  } catch (error) {
    console.error(`[WeatherService] Geocoding error for ${location}:`, error);
    return null;
  }
}

/**
 * Process raw weather data from Open-Meteo API
 * @param {Object} weatherData - Raw weather data from API
 * @param {Date} date - Date the weather is for
 * @returns {Object} Processed weather data
 */
function processWeatherData(weatherData, date) {
  const daily = weatherData.daily;
  const index = 0; // We're only requesting one day, so index is 0
  
  const maxTemp = daily.temperature_2m_max[index];
  const minTemp = daily.temperature_2m_min[index];
  const precipitationChance = daily.precipitation_probability_max[index] / 100; // Convert from percentage
  const weatherCode = daily.weathercode[index];
  
  // Calculate average temperature
  const avgTemp = (maxTemp + minTemp) / 2;
  
  // Determine weather condition from WMO weather codes
  const condition = getWeatherCondition(weatherCode);
  
  // Determine if weather is suitable for outdoor activities
  const suitableForOutdoor = isWeatherSuitableForOutdoor(avgTemp, precipitationChance, weatherCode);
  
  return {
    temperature: Math.round(avgTemp),
    max_temperature: Math.round(maxTemp),
    min_temperature: Math.round(minTemp),
    condition: condition,
    precipitation_chance: precipitationChance,
    weather_code: weatherCode,
    suitable_for_outdoor: suitableForOutdoor,
    location: weatherData.timezone || 'Unknown',
    date: date.toISOString().split('T')[0]
  };
}

/**
 * Convert WMO weather codes to human-readable conditions
 * @param {number} weatherCode - WMO weather code
 * @returns {string} Weather condition description
 */
function getWeatherCondition(weatherCode) {
  const conditions = {
    0: 'clear',
    1: 'mostly_clear',
    2: 'partly_cloudy',
    3: 'overcast',
    45: 'foggy',
    48: 'foggy',
    51: 'light_drizzle',
    53: 'moderate_drizzle',
    55: 'heavy_drizzle',
    56: 'light_freezing_drizzle',
    57: 'heavy_freezing_drizzle',
    61: 'light_rain',
    63: 'moderate_rain',
    65: 'heavy_rain',
    66: 'light_freezing_rain',
    67: 'heavy_freezing_rain',
    71: 'light_snow',
    73: 'moderate_snow',
    75: 'heavy_snow',
    77: 'snow_grains',
    80: 'light_rain_showers',
    81: 'moderate_rain_showers',
    82: 'heavy_rain_showers',
    85: 'light_snow_showers',
    86: 'heavy_snow_showers',
    95: 'thunderstorm',
    96: 'thunderstorm_with_light_hail',
    99: 'thunderstorm_with_heavy_hail'
  };
  
  return conditions[weatherCode] || 'unknown';
}

/**
 * Determine if weather is suitable for outdoor activities
 * @param {number} temperature - Average temperature in Celsius
 * @param {number} precipitationChance - Precipitation chance (0-1)
 * @param {number} weatherCode - WMO weather code
 * @returns {boolean} Whether weather is suitable for outdoor activities
 */
function isWeatherSuitableForOutdoor(temperature, precipitationChance, weatherCode) {
  // Temperature checks (convert to Fahrenheit for easier reasoning)
  const tempF = (temperature * 9/5) + 32;
  if (tempF < 32 || tempF > 100) {
    return false; // Too cold or too hot
  }
  
  // Precipitation checks
  if (precipitationChance > 0.7) {
    return false; // High chance of rain/snow
  }
  
  // Weather condition checks
  const unsuitableConditions = [
    45, 48, // Fog
    51, 53, 55, 56, 57, // Drizzle
    61, 63, 65, 66, 67, // Rain
    71, 73, 75, 77, // Snow
    80, 81, 82, // Rain showers
    85, 86, // Snow showers
    95, 96, 99 // Thunderstorms
  ];
  
  if (unsuitableConditions.includes(weatherCode)) {
    return false;
  }
  
  return true;
}

/**
 * Check weather conditions for a specific location and date
 * This is the main function used by the auto-scheduling system
 * @param {string} location - Location string
 * @param {Date} date - Date to check weather for
 * @returns {Promise<Object>} Weather suitability data
 */
export async function checkWeatherConditions(location, date) {
  if (!location) {
    console.log('[WeatherService] No location provided, skipping weather check');
    return {
      temperature: 70,
      condition: 'unknown',
      precipitation_chance: 0.2,
      suitable_for_outdoor: true,
      error: 'No location provided'
    };
  }

  try {
    const weatherData = await getWeatherData(location, date);
    
    console.log(`[WeatherService] Weather check for ${location}:`, {
      temperature: weatherData.temperature,
      condition: weatherData.condition,
      precipitation_chance: weatherData.precipitation_chance,
      suitable_for_outdoor: weatherData.suitable_for_outdoor
    });
    
    return weatherData;
  } catch (error) {
    console.error(`[WeatherService] Error checking weather conditions for ${location}:`, error);
    
    // Return fallback data
    return {
      temperature: 70,
      condition: 'unknown',
      precipitation_chance: 0.2,
      suitable_for_outdoor: true,
      error: error.message
    };
  }
}

/**
 * Clear the weather cache (useful for testing or manual cache management)
 */
export function clearWeatherCache() {
  weatherCache.clear();
  console.log('[WeatherService] Weather cache cleared');
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getWeatherCacheStats() {
  return {
    size: weatherCache.size,
    entries: Array.from(weatherCache.keys())
  };
} 