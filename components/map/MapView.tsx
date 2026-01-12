'use client';

import { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toast } from 'sonner';
import { useMapStore } from '@/src/stores/mapStore';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { MapControls } from './MapControls';
import { RadiusOverlay } from './RadiusOverlay';

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const zoomRef = useRef<number>(12);

  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  const {
    selectedLocation,
    center,
    zoom,
    radius,
    setSelectedLocation,
    setCenter,
    setZoom
  } = useMapStore();

  const { location: userLocation, loading: isLocating, getLocation, error: geoError } = useGeolocation();

  // Keep zoomRef in sync with zoom state
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE as maplibregl.StyleSpecification,
      center: [center.lng, center.lat],
      zoom: zoom,
      minZoom: 4,
      maxZoom: 18,
    });

    setMapInstance(map.current);

    // Handle map click to select location
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setSelectedLocation({ lat, lng });
    });

    // Update store when map moves
    map.current.on('moveend', () => {
      if (map.current) {
        const center = map.current.getCenter();
        setCenter({ lat: center.lat, lng: center.lng });
      }
    });

    // Update store when zoom changes
    map.current.on('zoomend', () => {
      if (map.current) {
        setZoom(map.current.getZoom());
      }
    });

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle marker placement when location is selected
  useEffect(() => {
    if (!map.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker if location is selected
    if (selectedLocation) {
      markerRef.current = new maplibregl.Marker({
        color: '#3b82f6',
        draggable: true,
      })
        .setLngLat([selectedLocation.lng, selectedLocation.lat])
        .addTo(map.current);

      // Handle marker drag
      markerRef.current.on('dragend', () => {
        if (markerRef.current) {
          const lngLat = markerRef.current.getLngLat();
          setSelectedLocation({ lat: lngLat.lat, lng: lngLat.lng });
        }
      });

      // Fly to selected location
      // Use zoomRef to access current zoom without triggering re-renders
      map.current.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: Math.max(zoomRef.current, 12),
        duration: 1000,
      });
    }
  }, [selectedLocation, setSelectedLocation]);

  // Handle user location
  useEffect(() => {
    if (userLocation && map.current) {
      setSelectedLocation(userLocation);
    }
  }, [userLocation, setSelectedLocation]);

  // Show geolocation error
  useEffect(() => {
    if (geoError) {
      toast.error('Location access denied', {
        description: 'Please enable location access in your browser to use this feature.',
      });
    }
  }, [geoError]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <MapControls
        map={mapInstance}
        onLocateClick={getLocation}
        isLocating={isLocating}
        selectedLocation={selectedLocation}
      />

      <RadiusOverlay
        map={mapInstance}
        location={selectedLocation}
        radiusMeters={radius}
      />
    </div>
  );
}
