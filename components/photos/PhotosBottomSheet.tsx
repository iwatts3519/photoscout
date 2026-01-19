/**
 * PhotosBottomSheet Component
 * Displays nearby geotagged photos from Wikimedia Commons in an expandable bottom sheet
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Camera, ExternalLink, Loader2, MapPin, Scale } from 'lucide-react';
import { BottomSheet, type BottomSheetState } from '@/components/layout/BottomSheet';
import { useUIStore } from '@/src/stores/uiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { fetchNearbyPhotos } from '@/app/actions/wikimedia';
import { PhotoDialog } from '@/components/locations/PhotoDialog';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';

interface PhotosBottomSheetProps {
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
 * Photo Card Component
 */
function PhotoCard({
  photo,
  onClick,
}: {
  photo: WikimediaPhoto;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden bg-muted border hover:ring-2 hover:ring-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* Photo thumbnail */}
      <div className="aspect-[4/3] relative">
        <Image
          src={photo.thumbnailUrl}
          alt={photo.description || 'Photo from Wikimedia Commons'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
      </div>

      {/* Gradient overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2 space-y-1">
          {/* Distance badge */}
          <div className="flex items-center justify-between text-xs text-white/90">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formatDistance(photo.distance)}
            </span>
            {photo.license && (
              <span className="flex items-center gap-1 truncate max-w-[80px]">
                <Scale className="h-3 w-3" />
                {photo.license}
              </span>
            )}
          </div>

          {/* Description */}
          {photo.description && (
            <p className="text-xs text-white line-clamp-2">{photo.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

export function PhotosBottomSheet({ className }: PhotosBottomSheetProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const {
    bottomSheetContent,
    bottomSheetExpanded,
    closeBottomSheet,
    setBottomSheetExpanded,
  } = useUIStore();

  const { selectedLocation, radius } = useMapStore();

  const isOpen = bottomSheetContent === 'photos';

  // Photo state
  const [photos, setPhotos] = useState<WikimediaPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Photo dialog state
  const [selectedPhoto, setSelectedPhoto] = useState<WikimediaPhoto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch photos when sheet opens
  useEffect(() => {
    if (!isOpen || !selectedLocation) {
      return;
    }

    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Only fetch if we haven't fetched yet for this location
    if (hasFetched) return;

    setLoading(true);
    setError(null);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await fetchNearbyPhotos(
          selectedLocation.lat,
          selectedLocation.lng,
          Math.min(radius, 10000), // Limit to 10km
          50 // Fetch more photos for the gallery
        );

        if (result.error) {
          setError(result.error);
          setPhotos([]);
        } else {
          // Deduplicate photos by ID (API sometimes returns duplicates)
          const data = result.data || [];
          const uniquePhotos = data.filter(
            (photo, index, self) =>
              index === self.findIndex((p) => p.id === photo.id)
          );
          setPhotos(uniquePhotos);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load photos');
        setPhotos([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [isOpen, selectedLocation, radius, hasFetched]);

  // Reset fetch state when location changes
  useEffect(() => {
    setHasFetched(false);
    setPhotos([]);
  }, [selectedLocation]);

  const handleStateChange = (state: BottomSheetState) => {
    setBottomSheetExpanded(state === 'expanded');
  };

  const handlePhotoClick = (photo: WikimediaPhoto) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setTimeout(() => setSelectedPhoto(null), 200);
  };

  return (
    <>
      <BottomSheet
        open={isOpen}
        onClose={closeBottomSheet}
        state={bottomSheetExpanded ? 'expanded' : 'peek'}
        onStateChange={handleStateChange}
        title="Nearby Photos"
        subtitle={
          loading
            ? 'Searching...'
            : error
            ? 'Failed to load photos'
            : `${photos.length} ${photos.length === 1 ? 'photo' : 'photos'} within ${(Math.min(radius, 10000) / 1000).toFixed(1)}km`
        }
        peekHeight={320}
        className={className}
      >
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-12 w-12 text-destructive/50 mb-4" />
              <p className="font-medium text-destructive">Failed to load photos</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium text-muted-foreground">No photos found</p>
              <p className="text-sm text-muted-foreground mt-1">
                No geotagged photos found within {(Math.min(radius, 10000) / 1000).toFixed(1)}km of this location
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onClick={() => handlePhotoClick(photo)}
                  />
                ))}
              </div>

              {/* Wikimedia attribution */}
              <div className="rounded-lg border bg-muted/50 p-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Photos from{' '}
                  <a
                    href="https://commons.wikimedia.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground inline-flex items-center gap-1"
                  >
                    Wikimedia Commons
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
                <span>Attribution required</span>
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Photo detail dialog */}
      <PhotoDialog
        photo={selectedPhoto}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
