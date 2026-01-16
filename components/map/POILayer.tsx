/**
 * POILayer Component
 * Renders POI markers on the MapLibre map
 */

'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map, Marker } from 'maplibre-gl';
import { usePOIStore } from '@/src/stores/poiStore';
import { POI_CATEGORIES } from '@/src/types/overpass.types';
import type { POI } from '@/src/types/overpass.types';

interface POILayerProps {
  map: Map | null;
}

/**
 * Create a custom POI marker element
 */
function createPOIMarkerElement(poi: POI): HTMLDivElement {
  const category = POI_CATEGORIES[poi.type];
  const el = document.createElement('div');

  el.className = 'poi-marker';
  el.style.cssText = `
    width: 32px;
    height: 32px;
    background-color: ${category.color};
    border: 2px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    color: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  `;

  el.textContent = category.icon;
  el.title = poi.name;

  // Hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  return el;
}

export function POILayer({ map }: POILayerProps) {
  const getFilteredPOIs = usePOIStore((state) => state.getFilteredPOIs);
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clean up existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Get filtered POIs
    const pois = getFilteredPOIs();

    // Add new markers for each POI
    pois.forEach((poi) => {
      const el = createPOIMarkerElement(poi);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.coordinates.lng, poi.coordinates.lat])
        .setPopup(
          new maplibregl.Popup({
            offset: 25,
            closeButton: false,
          }).setHTML(`
            <div style="padding: 8px; min-width: 150px;">
              <div style="font-weight: 600; margin-bottom: 4px; color: ${POI_CATEGORIES[poi.type].color};">
                ${POI_CATEGORIES[poi.type].label}
              </div>
              <div style="font-size: 14px; margin-bottom: 4px;">
                ${poi.name}
              </div>
              ${
                poi.distance
                  ? `<div style="font-size: 12px; color: #666;">
                      ${poi.distance < 1000 ? `${poi.distance}m` : `${(poi.distance / 1000).toFixed(1)}km`} away
                    </div>`
                  : ''
              }
              ${
                poi.metadata?.openingHours
                  ? `<div style="font-size: 11px; color: #888; margin-top: 4px;">
                      ${poi.metadata.openingHours}
                    </div>`
                  : ''
              }
            </div>
          `)
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, getFilteredPOIs]);

  return null;
}
