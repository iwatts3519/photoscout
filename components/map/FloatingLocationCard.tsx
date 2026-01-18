/**
 * FloatingLocationCard - Shows selected location details near the map pin
 * Displays coordinates, nearby POIs, photos, and save button
 * Opens automatically when a location is selected on the map
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import {
  X,
  MapPin,
  Save,
  ChevronRight,
  Loader2,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/src/stores/uiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { usePOIStore } from '@/src/stores/poiStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { useAuth } from '@/src/hooks/useAuth';
import { POI_CATEGORIES } from '@/src/types/overpass.types';
import type { POI, POIType } from '@/src/types/overpass.types';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';
import { fetchNearbyPhotos } from '@/app/actions/wikimedia';
import { createLocation } from '@/app/actions/locations';
import { PhotoDialog } from '@/components/locations/PhotoDialog';
import { toast } from 'sonner';

interface FloatingLocationCardProps {
  className?: string;
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Format coordinates to display string
 */
function formatCoordinate(value: number, isLat: boolean): string {
  const direction = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  return `${Math.abs(value).toFixed(4)}°${direction}`;
}

export function FloatingLocationCard({ className }: FloatingLocationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Store subscriptions
  const { openFloatingCards, closeFloatingCard, openFloatingCard } = useUIStore();
  const { selectedLocation, radius } = useMapStore();
  const { pois, filters, loading: poisLoading } = usePOIStore();
  const addLocation = useLocationStore((state) => state.addLocation);
  const { user } = useAuth();

  const isOpen = openFloatingCards.has('location');

  // Local state
  const [photos, setPhotos] = useState<WikimediaPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<WikimediaPhoto | null>(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);

  // Quick save state
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auto-open when location is selected
  useEffect(() => {
    if (selectedLocation) {
      openFloatingCard('location');
    } else {
      closeFloatingCard('location');
    }
  }, [selectedLocation, openFloatingCard, closeFloatingCard]);

  // Fetch photos when location changes
  useEffect(() => {
    if (!isOpen || !selectedLocation) {
      setPhotos([]);
      return;
    }

    // Debounce fetch to prevent rapid API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoadingPhotos(true);

      const result = await fetchNearbyPhotos(
        selectedLocation.lat,
        selectedLocation.lng,
        Math.min(radius, 5000), // Limit to 5km for photos
        8 // Fetch up to 8 photos
      );

      if (result.data) {
        setPhotos(result.data);
      } else {
        setPhotos([]);
      }

      setLoadingPhotos(false);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, selectedLocation, radius]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeFloatingCard('location');
      }
    };

    // Delay adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeFloatingCard]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFloatingCard('location');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeFloatingCard]);

  // Reset save state when location changes
  useEffect(() => {
    setShowSaveInput(false);
    setLocationName('');
  }, [selectedLocation]);

  // Quick save handler
  const handleQuickSave = useCallback(async () => {
    if (!selectedLocation || !locationName.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    if (!user) {
      toast.error('Please sign in to save locations');
      return;
    }

    setIsSaving(true);

    try {
      const { data, error } = await createLocation({
        name: locationName.trim(),
        coordinates: selectedLocation,
        radius_meters: radius,
        is_public: false,
      });

      if (error) {
        toast.error('Failed to save location', { description: error });
        return;
      }

      if (data) {
        addLocation(data);
        toast.success('Location saved');
        setShowSaveInput(false);
        setLocationName('');
      }
    } finally {
      setIsSaving(false);
    }
  }, [selectedLocation, locationName, user, radius, addLocation]);

  if (!isOpen || !selectedLocation) return null;

  // Get filtered POIs
  const filteredPOIs = filters.showPOIs
    ? pois.filter((poi) => filters.enabledTypes.includes(poi.type))
    : [];

  // Group POIs by type
  const poiGroups = filteredPOIs.reduce((acc, poi) => {
    if (!acc[poi.type]) acc[poi.type] = [];
    acc[poi.type].push(poi);
    return acc;
  }, {} as Record<POIType, POI[]>);

  const poiSummary = Object.entries(poiGroups) as [POIType, POI[]][];

  const handlePhotoClick = (photo: WikimediaPhoto) => {
    setSelectedPhoto(photo);
    setPhotoDialogOpen(true);
  };

  return (
    <>
      <div
        ref={cardRef}
        className={cn(
          'absolute bottom-4 right-4 z-20 w-80 max-h-[calc(100%-2rem)] overflow-hidden',
          'rounded-lg border bg-background shadow-lg',
          'animate-in slide-in-from-right-2 fade-in-0 duration-200',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-sm">Selected Location</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => closeFloatingCard('location')}
            aria-label="Close location card"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Coordinates */}
          <div className="text-sm text-muted-foreground">
            {formatCoordinate(selectedLocation.lat, true)},{' '}
            {formatCoordinate(selectedLocation.lng, false)}
          </div>

          {/* POI Summary */}
          {(poiSummary.length > 0 || poisLoading) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nearby POIs {!poisLoading && `(${filteredPOIs.length})`}
                </p>
                {filteredPOIs.length > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>

              {poisLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading POIs...</span>
                </div>
              ) : poiSummary.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {poiSummary.map(([type, typePois]) => {
                    const category = POI_CATEGORIES[type];
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}
                      >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                        <span className="font-semibold">({typePois.length})</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No POIs found nearby
                </p>
              )}
            </div>
          )}

          {/* Photo Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nearby Photos {!loadingPhotos && photos.length > 0 && `(${photos.length})`}
              </p>
              {photos.length > 3 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {loadingPhotos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading photos...</span>
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 3).map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handlePhotoClick(photo)}
                    className="group relative aspect-square overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Image
                      src={photo.thumbnailUrl}
                      alt={photo.description}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                      <span className="text-[10px] text-white">
                        {formatDistance(photo.distance)}
                      </span>
                    </div>
                  </button>
                ))}
                {photos.length > 3 && (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                    +{photos.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Camera className="h-4 w-4" />
                <span>No photos found nearby</span>
              </div>
            )}
          </div>

          {/* Save Location */}
          <div className="pt-2 border-t">
            {!user ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                Sign in to save locations
              </p>
            ) : showSaveInput ? (
              <div className="space-y-2">
                <Input
                  placeholder="Location name..."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickSave();
                    if (e.key === 'Escape') setShowSaveInput(false);
                  }}
                  disabled={isSaving}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleQuickSave}
                    disabled={isSaving || !locationName.trim()}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSaveInput(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowSaveInput(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Location
              </Button>
            )}
          </div>

          {/* Wikimedia Attribution */}
          {photos.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              Photos from{' '}
              <a
                href="https://commons.wikimedia.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground inline-flex items-center gap-0.5"
              >
                Wikimedia Commons
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Photo Dialog */}
      <PhotoDialog
        photo={selectedPhoto}
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
      />
    </>
  );
}
