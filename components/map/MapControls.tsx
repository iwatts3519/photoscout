'use client';

import { Plus, Minus, Locate, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapLocation } from '@/src/stores/mapStore';

interface MapControlsProps {
  map: MapLibreMap | null;
  onLocateClick: () => void;
  isLocating?: boolean;
  selectedLocation?: MapLocation | null;
}

export function MapControls({ map, onLocateClick, isLocating = false, selectedLocation }: MapControlsProps) {
  const handleZoomIn = () => {
    if (map) {
      map.zoomIn({ duration: 300 });
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.zoomOut({ duration: 300 });
    }
  };

  const handleReturnToLocation = () => {
    if (map && selectedLocation) {
      map.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: Math.max(map.getZoom(), 12),
        duration: 1000,
      });
    }
  };

  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomIn}
        aria-label="Zoom in"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        size="icon"
        variant="secondary"
        onClick={handleZoomOut}
        aria-label="Zoom out"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {selectedLocation && (
        <Button
          size="icon"
          variant="secondary"
          onClick={handleReturnToLocation}
          aria-label="Return to selected location"
          className="bg-white hover:bg-gray-100 shadow-md"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      )}

      <Button
        size="icon"
        variant="secondary"
        onClick={onLocateClick}
        disabled={isLocating}
        aria-label="Locate me"
        className="bg-white hover:bg-gray-100 shadow-md"
      >
        <Locate className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
      </Button>
    </div>
  );
}
