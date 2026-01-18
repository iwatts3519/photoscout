'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { SavedLocation } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { useCollectionStore } from '@/src/stores/collectionStore';

interface SavedLocationMarkersProps {
  map: maplibregl.Map | null;
  locations: SavedLocation[];
}

interface MarkerData {
  marker: maplibregl.Marker;
  color: string;
}

/**
 * Component to render markers for saved locations on the map
 * Uses collection colors when assigned, default green otherwise
 */
export function SavedLocationMarkers({
  map,
  locations,
}: SavedLocationMarkersProps) {
  const markersRef = useRef<Map<string, MarkerData>>(new Map());
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setCenter = useMapStore((state) => state.setCenter);
  const setZoom = useMapStore((state) => state.setZoom);
  const getCollectionColor = useCollectionStore((state) => state.getCollectionColor);

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
        const markerData = markers.get(id);
        if (markerData) {
          markerData.marker.remove();
          markers.delete(id);
        }
      }
    });

    // Add or update markers for current locations
    locations.forEach((location) => {
      const coords = parseCoordinates(location.coordinates);
      if (!coords) return;

      const existingData = markers.get(location.id);
      const markerColor = getCollectionColor(location.collection_id || null);

      // If marker exists but color changed, recreate it
      if (existingData && existingData.color !== markerColor) {
        existingData.marker.remove();
        markers.delete(location.id);
      }

      if (!markers.has(location.id)) {
        // Create new marker with collection color
        const marker = new maplibregl.Marker({
          color: markerColor,
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

        markers.set(location.id, { marker, color: markerColor });
      } else {
        // Update existing marker position if coordinates changed
        const markerData = markers.get(location.id);
        if (markerData) {
          markerData.marker.setLngLat([coords.lng, coords.lat]);
        }
      }
    });

    // Cleanup on unmount - remove all markers
    return () => {
      markers.forEach((data) => data.marker.remove());
      markers.clear();
    };
  }, [map, locations, setCenter, setSelectedLocation, setZoom, getCollectionColor]);

  return null; // This component doesn't render anything directly
}
