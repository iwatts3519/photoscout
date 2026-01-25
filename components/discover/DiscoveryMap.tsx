'use client';

import { useRef, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useRouter } from 'next/navigation';
import type { PublicLocation } from '@/src/types/community.types';

interface DiscoveryMapProps {
  locations: PublicLocation[];
}

// UK-centered default view
const DEFAULT_CENTER: [number, number] = [-2.5, 54.0];
const DEFAULT_ZOOM = 5;

export function DiscoveryMap({ locations }: DiscoveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const router = useRouter();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (location: PublicLocation) => {
      router.push(`/spot/${location.id}`);
    },
    [router]
  );

  // Update markers when locations change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new markers
    locations.forEach((location) => {
      const el = document.createElement('div');
      el.className = 'discovery-marker';
      el.style.cssText = `
        width: 24px;
        height: 24px;
        background: hsl(var(--primary));
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        transition: transform 0.2s;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
        className: 'discovery-popup',
      }).setHTML(`
        <div style="padding: 8px; min-width: 150px;">
          <h3 style="font-weight: 600; margin-bottom: 4px;">${location.name}</h3>
          <p style="font-size: 12px; color: #666; margin: 0;">
            ${location.owner_name}
          </p>
          <p style="font-size: 11px; color: #888; margin-top: 4px;">
            Click to view details
          </p>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      el.addEventListener('click', () => handleMarkerClick(location));

      markers.current.push(marker);
    });

    // Fit bounds if there are locations
    if (locations.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      locations.forEach((loc) => {
        bounds.extend([loc.lng, loc.lat]);
      });

      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 12,
      });
    }
  }, [locations, handleMarkerClick]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-[500px] rounded-lg border overflow-hidden"
    />
  );
}
