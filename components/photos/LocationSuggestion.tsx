'use client';

import { useMemo } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/src/stores/locationStore';
import type { SavedLocation } from '@/src/stores/locationStore';

interface LocationSuggestionProps {
  latitude: number;
  longitude: number;
  onSelect: (location: SavedLocation) => void;
  maxDistance?: number; // meters
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format distance for display
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function LocationSuggestion({
  latitude,
  longitude,
  onSelect,
  maxDistance = 5000, // 5km default
}: LocationSuggestionProps) {
  const { savedLocations } = useLocationStore();

  // Find nearby locations
  const nearbyLocations = useMemo(() => {
    const withDistance = savedLocations
      .map((location) => {
        // Extract coordinates from location
        const coords = location.coordinates as { lat: number; lng: number };
        if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
          return null;
        }

        const distance = calculateDistance(
          latitude,
          longitude,
          coords.lat,
          coords.lng
        );

        return { location, distance };
      })
      .filter((item): item is { location: SavedLocation; distance: number } =>
        item !== null && item.distance <= maxDistance
      )
      .sort((a, b) => a.distance - b.distance);

    return withDistance;
  }, [savedLocations, latitude, longitude, maxDistance]);

  if (nearbyLocations.length === 0) {
    return null;
  }

  const closest = nearbyLocations[0];

  return (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nearby saved location</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on photo GPS coordinates
          </p>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-between w-full"
              onClick={() => onSelect(closest.location)}
            >
              <span className="flex items-center gap-2 truncate">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{closest.location.name}</span>
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <span className="text-xs">{formatDistance(closest.distance)}</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </Button>
          </div>
          {nearbyLocations.length > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              +{nearbyLocations.length - 1} more nearby
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
