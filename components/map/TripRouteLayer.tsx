'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { useRouteCalculation, useIsTripPlannerOpen } from '@/src/stores/tripPlannerStore';
import { routeToGeoJSON } from '@/src/types/routing.types';
import { routeBboxToLngLatBounds } from '@/lib/utils/route-geometry';

interface TripRouteLayerProps {
  map: MapLibreMap | null;
}

const SOURCE_ID = 'trip-route';
const LAYER_ID = 'trip-route-line';

export function TripRouteLayer({ map }: TripRouteLayerProps) {
  const routeCalculation = useRouteCalculation();
  const isOpen = useIsTripPlannerOpen();
  const prevRouteRef = useRef<typeof routeCalculation>(null);

  // Manage GeoJSON source and line layer
  useEffect(() => {
    if (!map) return;

    const showRoute = isOpen && routeCalculation;

    if (!showRoute) {
      // Remove layer and source when route is cleared or planner closed
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
      return;
    }

    const geojson = routeToGeoJSON(routeCalculation);

    if (!map.getSource(SOURCE_ID)) {
      // Add source and layer
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojson,
      });

      map.addLayer({
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#7c3aed',
          'line-width': 4,
          'line-opacity': 0.85,
        },
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
      });
    } else {
      // Update existing source data
      const source = map.getSource(SOURCE_ID);
      if (source && source.type === 'geojson') {
        (source as maplibregl.GeoJSONSource).setData(geojson);
      }
    }
  }, [map, routeCalculation, isOpen]);

  // Fit map to route bounds when a new route appears
  useEffect(() => {
    if (!map || !routeCalculation || !isOpen) return;

    // Only fit bounds when the route actually changes (not on every render)
    if (prevRouteRef.current === routeCalculation) return;
    prevRouteRef.current = routeCalculation;

    const bounds = routeBboxToLngLatBounds(routeCalculation.bbox);
    map.fitBounds(bounds, {
      padding: 60,
      duration: 1000,
    });
  }, [map, routeCalculation, isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID);
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID);
      }
    };
  }, [map]);

  return null;
}
