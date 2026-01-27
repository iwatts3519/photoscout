'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';
import {
  useTripStops,
  useRouteCalculation,
  useIsTripPlannerOpen,
  useTripPlannerStore,
} from '@/src/stores/tripPlannerStore';
import type { DraftStop } from '@/src/stores/tripPlannerStore';
import type { RouteCalculation } from '@/src/types/routing.types';

interface TripStopMarkersProps {
  map: MapLibreMap | null;
}

function createStopMarkerElement(index: number): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'trip-stop-marker';
  el.style.cssText = `
    width: 36px;
    height: 36px;
    background-color: #ea580c;
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
  el.textContent = String(index + 1);

  // Hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.15)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)';
  });

  return el;
}

function buildPopupHTML(
  stop: DraftStop,
  index: number,
  route: RouteCalculation | null
): string {
  const durationDisplay = stop.planned_duration_minutes > 0
    ? `${stop.planned_duration_minutes} min`
    : 'Not set';

  let legInfo = '';
  if (route && index < route.legs.length) {
    const leg = route.legs[index];
    const distKm = (leg.distance_meters / 1000).toFixed(1);
    const durationMins = Math.round(leg.duration_seconds / 60);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    legInfo = `
      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        Next leg: ${distKm} km &middot; ${timeStr}
      </div>
    `;
  }

  const notesHtml = stop.notes
    ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px; font-style: italic;">${escapeHtml(stop.notes)}</div>`
    : '';

  return `
    <div style="padding: 8px; min-width: 160px;">
      <div style="font-weight: 600; margin-bottom: 2px; color: #ea580c;">
        Stop ${index + 1}
      </div>
      <div style="font-size: 14px; margin-bottom: 4px;">
        ${escapeHtml(stop.display_name)}
      </div>
      <div style="font-size: 12px; color: #6b7280;">
        Duration: ${durationDisplay}
      </div>
      ${notesHtml}
      ${legInfo}
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function TripStopMarkers({ map }: TripStopMarkersProps) {
  const stops = useTripStops();
  const routeCalculation = useRouteCalculation();
  const isOpen = useIsTripPlannerOpen();
  const markersRef = useRef<Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clean up existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Only show markers when planner is open and stops exist
    if (!isOpen || stops.length === 0) return;

    stops.forEach((stop, index) => {
      const el = createStopMarkerElement(index);

      // Click handler to highlight stop in planner list
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        useTripPlannerStore.getState().setEditingStopId(stop.id);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .setPopup(
          new maplibregl.Popup({
            offset: 25,
            closeButton: false,
          }).setHTML(buildPopupHTML(stop, index, routeCalculation))
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, stops, routeCalculation, isOpen]);

  return null;
}
