'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';

interface MiniMapProps {
  lat: number;
  lng: number;
  className?: string;
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster' as const,
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export const MiniMap = React.memo(function MiniMap({
  lat,
  lng,
  className,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const initializedRef = useRef(false);

  const initMap = useCallback(async () => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;

    const maplibregl = (await import('maplibre-gl')).default;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE as maplibregl.StyleSpecification,
      center: [lng, lat],
      zoom: 13,
      interactive: false,
      attributionControl: false,
    });

    new maplibregl.Marker({ color: '#3b82f6' })
      .setLngLat([lng, lat])
      .addTo(map);

    mapRef.current = map;
  }, [lat, lng]);

  // Lazy initialization via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          initMap();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, [initMap]);

  return (
    <div
      ref={containerRef}
      className={cn('h-32 lg:h-40 rounded-md overflow-hidden', className)}
    />
  );
});
