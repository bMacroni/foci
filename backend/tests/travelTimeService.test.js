import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateTravelTime, getTravelTime, clearTravelCache } from '../src/utils/travelTimeService.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Travel Time Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearTravelCache();
  });

  describe('getTravelTime', () => {
    it('should return fallback data for current_location', async () => {
      const result = await getTravelTime('current_location', 'New York, NY');
      
      expect(result).toEqual({
        duration_minutes: 15,
        distance_miles: 5,
        mode: 'driving',
        note: 'Using estimated travel time for current location'
      });
    });

    it('should return fallback data for home location', async () => {
      const result = await getTravelTime('home', 'New York, NY');
      
      expect(result).toEqual({
        duration_minutes: 20,
        distance_miles: 8,
        mode: 'driving',
        note: 'Using estimated travel time for home location'
      });
    });

    it('should return fallback data for work location', async () => {
      const result = await getTravelTime('New York, NY', 'work');
      
      expect(result).toEqual({
        duration_minutes: 25,
        distance_miles: 12,
        mode: 'driving',
        note: 'Using estimated travel time for work location'
      });
    });
  });

  describe('calculateTravelTime', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await calculateTravelTime('New York, NY', 'Chicago, IL');
      
      expect(result).toEqual({
        duration_minutes: 30,
        distance_miles: 10,
        mode: 'driving',
        error: 'Could not parse locations: New York, NY or Chicago, IL'
      });
    });

    it('should process travel data correctly', async () => {
      // Mock successful geocoding responses
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
            results: [{
              latitude: 41.8781,
              longitude: -87.6298,
              name: 'Chicago',
              country: 'United States'
            }]
          })
        })
        // Mock successful OpenRouteService response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            durations: [[0, 3600]], // 1 hour in seconds
            distances: [[0, 800000]] // 800km in meters
          })
        });

      const result = await calculateTravelTime('New York, NY', 'Chicago, IL', 'driving');
      
      expect(result).toMatchObject({
        duration_minutes: 60,
        distance_miles: 497.1,
        mode: 'driving',
        duration_seconds: 3600,
        distance_meters: 800000
      });
    });

    it('should handle coordinate input directly', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          durations: [[0, 1800]], // 30 minutes in seconds
          distances: [[0, 50000]] // 50km in meters
        })
      });

      const result = await calculateTravelTime('40.7128,-74.0060', '41.8781,-87.6298', 'walking');
      
      expect(result).toMatchObject({
        duration_minutes: 30,
        distance_miles: 31.1,
        mode: 'walking'
      });
    });

    it('should cache travel data', async () => {
      // Mock geocoding responses
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
            results: [{
              latitude: 41.8781,
              longitude: -87.6298,
              name: 'Chicago',
              country: 'United States'
            }]
          })
        })
        // Mock OpenRouteService response
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            durations: [[0, 3600]],
            distances: [[0, 800000]]
          })
        });

      // First call should fetch from API
      const result1 = await calculateTravelTime('New York, NY', 'Chicago, IL');
      
      // Second call should use cache
      const result2 = await calculateTravelTime('New York, NY', 'Chicago, IL');
      
      expect(result1).toEqual(result2);
      expect(global.fetch).toHaveBeenCalledTimes(3); // 2 geocoding + 1 travel
    });
  });

  describe('Transport mode mapping', () => {
    it('should map driving mode correctly', async () => {
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
            results: [{
              latitude: 41.8781,
              longitude: -87.6298,
              name: 'Chicago',
              country: 'United States'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            durations: [[0, 1800]],
            distances: [[0, 50000]]
          })
        });

      const result = await calculateTravelTime('New York, NY', 'Chicago, IL', 'driving');
      
      expect(result.mode).toBe('driving');
    });

    it('should map walking mode correctly', async () => {
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
            results: [{
              latitude: 41.8781,
              longitude: -87.6298,
              name: 'Chicago',
              country: 'United States'
            }]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            durations: [[0, 1800]],
            distances: [[0, 50000]]
          })
        });

      const result = await calculateTravelTime('New York, NY', 'Chicago, IL', 'walking');
      
      expect(result.mode).toBe('walking');
    });
  });
}); 