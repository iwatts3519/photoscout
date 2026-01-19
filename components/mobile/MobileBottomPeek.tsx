/**
 * MobileBottomPeek - Bottom peek bar for mobile view
 * Shows location summary, POI count, and photo count
 * Tappable to open location details or bottom sheet
 */

'use client';

import { MapPin, Car, Camera, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/src/stores/uiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { usePOIStore } from '@/src/stores/poiStore';

interface MobileBottomPeekProps {
  /** Number of nearby photos */
  photoCount: number;
  /** Whether photos are loading */
  photosLoading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Format coordinates to compact display string
 */
function formatCoordinate(value: number, isLat: boolean): string {
  const direction = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(4)}°${direction}`;
}

export function MobileBottomPeek({
  photoCount,
  photosLoading = false,
  className,
}: MobileBottomPeekProps) {
  const { selectedLocation } = useMapStore();
  const { pois, filters, loading: poisLoading } = usePOIStore();
  const { openFloatingCard, openBottomSheet, openFloatingCards } = useUIStore();

  const isLocationCardOpen = openFloatingCards.has('location');

  // Get filtered POI count
  const filteredPOICount = filters.showPOIs
    ? pois.filter((poi) => filters.enabledTypes.includes(poi.type)).length
    : 0;

  // If no location selected, show a prompt
  if (!selectedLocation) {
    return (
      <div
        className={cn(
          'flex items-center justify-center px-4 py-3',
          'bg-background/95 backdrop-blur-sm border-t',
          className
        )}
      >
        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
        <span className="text-sm text-muted-foreground">
          Tap the map to select a location
        </span>
      </div>
    );
  }

  const handleLocationClick = () => {
    openFloatingCard('location');
  };

  const handlePOIClick = () => {
    openBottomSheet('poi');
  };

  const handlePhotoClick = () => {
    openBottomSheet('photos');
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2.5',
        'bg-background/95 backdrop-blur-sm border-t',
        className
      )}
    >
      {/* Location - Main tap target */}
      <button
        onClick={handleLocationClick}
        className={cn(
          'flex items-center gap-2 px-2 py-1 -ml-2 rounded-lg',
          'hover:bg-accent transition-colors active:bg-accent/80',
          isLocationCardOpen && 'bg-accent'
        )}
        aria-label="View location details"
      >
        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <span className="text-sm font-medium truncate max-w-[120px]">
          {formatCoordinate(selectedLocation.lat, true)}, {formatCoordinate(selectedLocation.lng, false)}
        </span>
        <ChevronUp
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isLocationCardOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Quick stats */}
      <div className="flex items-center gap-3">
        {/* POI Count */}
        <button
          onClick={handlePOIClick}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg',
            'hover:bg-accent transition-colors active:bg-accent/80',
            filteredPOICount === 0 && 'opacity-50'
          )}
          disabled={filteredPOICount === 0 && !poisLoading}
          aria-label={`View ${filteredPOICount} nearby points of interest`}
        >
          <Car className="h-4 w-4 text-blue-500" />
          {poisLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-sm font-medium">{filteredPOICount}</span>
          )}
        </button>

        {/* Photo Count */}
        <button
          onClick={handlePhotoClick}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg',
            'hover:bg-accent transition-colors active:bg-accent/80',
            photoCount === 0 && 'opacity-50'
          )}
          disabled={photoCount === 0 && !photosLoading}
          aria-label={`View ${photoCount} nearby photos`}
        >
          <Camera className="h-4 w-4 text-purple-500" />
          {photosLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-sm font-medium">{photoCount}</span>
          )}
        </button>
      </div>
    </div>
  );
}
