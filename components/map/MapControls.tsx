'use client';

import { Plus, Minus, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Map as MapLibreMap } from 'maplibre-gl';

interface MapControlsProps {
  map: MapLibreMap | null;
  onLocateClick: () => void;
  isLocating?: boolean;
}

export function MapControls({ map, onLocateClick, isLocating = false }: MapControlsProps) {
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
