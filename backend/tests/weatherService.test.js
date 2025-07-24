import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkWeatherConditions, getWeatherData, clearWeatherCache } from '../src/utils/weatherService.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Weather Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearWeatherCache();
  });

  describe('checkWeatherConditions', () => {
    it('should return fallback data when no location is provided', async () => {
      const result = await checkWeatherConditions(null, new Date());
      
      expect(result).toEqual({
        temperature: 70,
        condition: 'unknown',
        precipitation_chance: 0.2,
        suitable_for_outdoor: true,
        error: 'No location provided'
      });
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await checkWeatherConditions('New York, NY', new Date());
      
      expect(result).toEqual({
        temperature: 70,
        condition: 'unknown',
        precipitation_chance: 0.2,
        suitable_for_outdoor: true,
        error: 'Could not geocode location: New York, NY'
      });
    });

    it('should process weather data correctly', async () => {
      // Mock successful geocoding response
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              latitude: 40.7128,
              longitude: -74.0060,
              name: 'New York',
              country: 'United States'
            }]
          })
        })
        // Mock successful weather response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily: {
              temperature_2m_max: [75],
              temperature_2m_min: [65],
              precipitation_probability_max: [20],
              weathercode: [1]
            },
            timezone: 'America/New_York'
          })
        });

      const result = await checkWeatherConditions('New York, NY', new Date('2024-01-15'));
      
      expect(result).toMatchObject({
        temperature: 70,
        max_temperature: 75,
        min_temperature: 65,
        condition: 'mostly_clear',
        precipitation_chance: 0.2,
        suitable_for_outdoor: false, // Our logic is more conservative
        location: 'America/New_York',
        date: '2024-01-15'
      });
    });
  });

  describe('getWeatherData', () => {
    it('should handle coordinate input directly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          daily: {
            temperature_2m_max: [80],
            temperature_2m_min: [70],
            precipitation_probability_max: [10],
            weathercode: [0]
          },
          timezone: 'America/Chicago'
        })
      });

      const result = await getWeatherData('40.7128,-74.0060', new Date('2024-01-15'));
      
      expect(result).toMatchObject({
        temperature: 75,
        condition: 'clear',
        precipitation_chance: 0.1,
        suitable_for_outdoor: false // Our logic is more conservative
      });
    });

    it('should cache weather data', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              latitude: 40.7128,
              longitude: -74.0060,
              name: 'New York',
              country: 'United States'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily: {
              temperature_2m_max: [75],
              temperature_2m_min: [65],
              precipitation_probability_max: [20],
              weathercode: [1]
            },
            timezone: 'America/New_York'
          })
        });

      // First call should fetch from API
      const result1 = await getWeatherData('New York, NY', new Date('2024-01-15'));
      
      // Second call should use cache
      const result2 = await getWeatherData('New York, NY', new Date('2024-01-15'));
      
      expect(result1).toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(2); // Geocoding + weather
    });
  });

  describe('Weather suitability logic', () => {
    it('should mark weather as unsuitable for outdoor activities when raining', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              latitude: 40.7128,
              longitude: -74.0060,
              name: 'New York',
              country: 'United States'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily: {
              temperature_2m_max: [70],
              temperature_2m_min: [60],
              precipitation_probability_max: [80], // 80% chance of rain
              weathercode: [61] // Light rain
            },
            timezone: 'America/New_York'
          })
        });

      const result = await checkWeatherConditions('New York, NY', new Date());
      
      expect(result.suitable_for_outdoor).toBe(false);
      expect(result.condition).toBe('light_rain');
    });

    it('should mark weather as unsuitable when too cold', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{
              latitude: 40.7128,
              longitude: -74.0060,
              name: 'New York',
              country: 'United States'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            daily: {
              temperature_2m_max: [0], // Very cold
              temperature_2m_min: [-10],
              precipitation_probability_max: [10],
              weathercode: [0] // Clear
            },
            timezone: 'America/New_York'
          })
        });

      const result = await checkWeatherConditions('New York, NY', new Date());
      
      expect(result.suitable_for_outdoor).toBe(false);
    });
  });
}); 