import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateBearing,
  calculateBoundingBox,
  formatCoordinate,
  formatDistance,
  isWithinRadius,
  bearingToCardinal,
} from './geo';

describe('geo utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between London and Edinburgh', () => {
      const london = { lat: 51.5074, lng: -0.1278 };
      const edinburgh = { lat: 55.9533, lng: -3.1883 };

      const distance = calculateDistance(london, edinburgh);

      // Distance should be approximately 534km (534000 meters)
      expect(distance).toBeGreaterThan(530000);
      expect(distance).toBeLessThan(540000);
    });

    it('should return 0 for same point', () => {
      const point = { lat: 51.5074, lng: -0.1278 };
      const distance = calculateDistance(point, point);

      expect(distance).toBe(0);
    });

    it('should calculate small distances accurately', () => {
      const point1 = { lat: 51.5074, lng: -0.1278 };
      const point2 = { lat: 51.5084, lng: -0.1278 }; // ~111 meters north

      const distance = calculateDistance(point1, point2);

      expect(distance).toBeGreaterThan(100);
      expect(distance).toBeLessThan(120);
    });
  });

  describe('calculateBearing', () => {
    it('should calculate bearing from London to Edinburgh as North', () => {
      const london = { lat: 51.5074, lng: -0.1278 };
      const edinburgh = { lat: 55.9533, lng: -3.1883 };

      const bearing = calculateBearing(london, edinburgh);

      // Bearing should be northwest-ish (around 330-340 degrees)
      expect(bearing).toBeGreaterThan(320);
      expect(bearing).toBeLessThan(350);
    });

    it('should return bearing between 0 and 360', () => {
      const point1 = { lat: 51.5074, lng: -0.1278 };
      const point2 = { lat: 51.5074, lng: 0.1278 };

      const bearing = calculateBearing(point1, point2);

      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    });

    it('should calculate East bearing correctly', () => {
      const point1 = { lat: 0, lng: 0 };
      const point2 = { lat: 0, lng: 10 };

      const bearing = calculateBearing(point1, point2);

      expect(bearing).toBeCloseTo(90, 0); // East is 90 degrees
    });
  });

  describe('calculateBoundingBox', () => {
    it('should calculate bounding box for 1km radius', () => {
      const center = { lat: 51.5074, lng: -0.1278 };
      const radius = 1000; // 1km

      const [minLng, minLat, maxLng, maxLat] = calculateBoundingBox(center, radius);

      expect(minLng).toBeLessThan(center.lng);
      expect(maxLng).toBeGreaterThan(center.lng);
      expect(minLat).toBeLessThan(center.lat);
      expect(maxLat).toBeGreaterThan(center.lat);

      // Check the box dimensions are roughly correct
      const lngDelta = maxLng - minLng;
      const latDelta = maxLat - minLat;

      // For 1km radius, deltas should be small
      expect(lngDelta).toBeGreaterThan(0.01);
      expect(lngDelta).toBeLessThan(0.03);
      expect(latDelta).toBeGreaterThan(0.01);
      expect(latDelta).toBeLessThan(0.02);
    });
  });

  describe('formatCoordinate', () => {
    it('should format coordinate with default 6 decimals', () => {
      const coord = 51.507351;
      expect(formatCoordinate(coord)).toBe('51.507351');
    });

    it('should format coordinate with custom decimals', () => {
      const coord = 51.507351;
      expect(formatCoordinate(coord, 4)).toBe('51.5074');
    });

    it('should handle negative coordinates', () => {
      const coord = -0.127758;
      expect(formatCoordinate(coord, 4)).toBe('-0.1278');
    });
  });

  describe('formatDistance', () => {
    it('should format meters for distances under 1km', () => {
      expect(formatDistance(500)).toBe('500 m');
      expect(formatDistance(999)).toBe('999 m');
    });

    it('should format kilometers for distances over 1km', () => {
      expect(formatDistance(1000)).toBe('1.0 km');
      expect(formatDistance(1500)).toBe('1.5 km');
      expect(formatDistance(5432)).toBe('5.4 km');
    });

    it('should round meters to nearest whole number', () => {
      expect(formatDistance(123.7)).toBe('124 m');
      expect(formatDistance(456.2)).toBe('456 m');
    });
  });

  describe('isWithinRadius', () => {
    it('should return true for point within radius', () => {
      const center = { lat: 51.5074, lng: -0.1278 };
      const point = { lat: 51.5084, lng: -0.1278 }; // ~111m away

      expect(isWithinRadius(point, center, 200)).toBe(true);
    });

    it('should return false for point outside radius', () => {
      const center = { lat: 51.5074, lng: -0.1278 };
      const point = { lat: 51.5184, lng: -0.1278 }; // ~1.2km away

      expect(isWithinRadius(point, center, 1000)).toBe(false);
    });

    it('should return true for exact center point', () => {
      const center = { lat: 51.5074, lng: -0.1278 };

      expect(isWithinRadius(center, center, 1000)).toBe(true);
    });
  });

  describe('bearingToCardinal', () => {
    it('should convert bearings to cardinal directions', () => {
      expect(bearingToCardinal(0)).toBe('N');
      expect(bearingToCardinal(45)).toBe('NE');
      expect(bearingToCardinal(90)).toBe('E');
      expect(bearingToCardinal(135)).toBe('SE');
      expect(bearingToCardinal(180)).toBe('S');
      expect(bearingToCardinal(225)).toBe('SW');
      expect(bearingToCardinal(270)).toBe('W');
      expect(bearingToCardinal(315)).toBe('NW');
    });

    it('should handle bearings over 360', () => {
      expect(bearingToCardinal(360)).toBe('N');
      expect(bearingToCardinal(405)).toBe('NE');
    });

    it('should handle approximate bearings', () => {
      expect(bearingToCardinal(42)).toBe('NE');
      expect(bearingToCardinal(48)).toBe('NE');
      expect(bearingToCardinal(22)).toBe('N');
    });
  });
});
