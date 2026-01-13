'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { SavedLocation } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';

interface SavedLocationMarkersProps {
  map: maplibregl.Map | null;
  locations: SavedLocation[];
}

/**
 * Component to render markers for saved locations on the map
 * Uses green markers to distinguish from the blue selected location marker
 */
export function SavedLocationMarkers({
  map,
  locations,
}: SavedLocationMarkersProps) {
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setCenter = useMapStore((state) => state.setCenter);
  const setZoom = useMapStore((state) => state.setZoom);

  useEffect(() => {
    if (!map) return;

    // Capture markers map for cleanup
    const markers = markersRef.current;

    // Parse coordinates from PostGIS geography
    const parseCoordinates = (
      coords: unknown
    ): { lat: number; lng: number } | null => {
      if (typeof coords === 'string') {
        // Format: "POINT(lng lat)" or "(lng,lat)"
        const match = coords.match(/\(([^,]+),\s*([^)]+)\)/);
        if (match) {
          return {
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2]),
          };
        }
      }
      return null;
    };

    // Get current marker IDs
    const currentIds = new Set(locations.map((loc) => loc.id));
    const existingIds = new Set(markers.keys());

    // Remove markers for locations that no longer exist
    existingIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const marker = markers.get(id);
        if (marker) {
          marker.remove();
          markers.delete(id);
        }
      }
    });

    // Add or update markers for current locations
    locations.forEach((location) => {
      const coords = parseCoordinates(location.coordinates);
      if (!coords) return;

      let marker = markers.get(location.id);

      if (!marker) {
        // Create new marker for saved location (green to distinguish from selected location)
        marker = new maplibregl.Marker({
          color: '#10b981', // green-500
          draggable: false,
        })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);

        // Create popup with location name
        const popup = new maplibregl.Popup({
          offset: 25,
          closeButton: false,
        }).setHTML(
          `<div class="p-2">
            <p class="font-medium text-sm">${location.name}</p>
            ${
              location.description
                ? `<p class="text-xs text-gray-600 mt-1">${location.description}</p>`
                : ''
            }
          </div>`
        );

        marker.setPopup(popup);

        // Click handler to center map on saved location
        marker.getElement().addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent map click event
          setCenter({ lat: coords.lat, lng: coords.lng });
          setSelectedLocation({ lat: coords.lat, lng: coords.lng });
          setZoom(14);
        });

        markers.set(location.id, marker);
      } else {
        // Update existing marker position if coordinates changed
        marker.setLngLat([coords.lng, coords.lat]);
      }
    });

    // Cleanup on unmount - remove all markers
    return () => {
      markers.forEach((marker) => marker.remove());
      markers.clear();
    };
  }, [map, locations, setCenter, setSelectedLocation, setZoom]);

  return null; // This component doesn't render anything directly
}
