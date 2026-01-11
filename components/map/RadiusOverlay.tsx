'use client';

import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as turf from '@turf/turf';
import type { MapLocation } from '@/src/stores/mapStore';

interface RadiusOverlayProps {
  map: MapLibreMap | null;
  location: MapLocation | null;
  radiusMeters: number;
}

const SOURCE_ID = 'radius-circle';
const LAYER_ID = 'radius-circle-fill';
const LAYER_OUTLINE_ID = 'radius-circle-outline';

export function RadiusOverlay({ map, location, radiusMeters }: RadiusOverlayProps) {
  useEffect(() => {
    if (!map || !location) {
      // Remove layers and source if they exist
      if (map) {
        if (map.getLayer(LAYER_ID)) {
          map.removeLayer(LAYER_ID);
        }
        if (map.getLayer(LAYER_OUTLINE_ID)) {
          map.removeLayer(LAYER_OUTLINE_ID);
        }
        if (map.getSource(SOURCE_ID)) {
          map.removeSource(SOURCE_ID);
        }
      }
      return;
    }

    // Create circle GeoJSON using turf
    const radiusKm = radiusMeters / 1000;
    const circle = turf.circle([location.lng, location.lat], radiusKm, {
      units: 'kilometers',
      steps: 64,
    });

    // Add source if it doesn't exist
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: circle,
      });

      // Add fill layer
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.15,
        },
      });

      // Add outline layer
      map.addLayer({
        id: LAYER_OUTLINE_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#3b82f6',
          'line-width': 2,
          'line-opacity': 0.8,
        },
      });
    } else {
      // Update existing source
      const source = map.getSource(SOURCE_ID);
      if (source && source.type === 'geojson') {
        (source as maplibregl.GeoJSONSource).setData(circle);
      }
    }
  }, [map, location, radiusMeters]);

  return null;
}
