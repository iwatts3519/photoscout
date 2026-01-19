/**
 * PhotoGallery Component
 * Fetches and displays nearby geotagged photos from Wikimedia Commons
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { fetchNearbyPhotos } from '@/app/actions/wikimedia';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';
import { PhotoThumbnail } from './PhotoThumbnail';
import { PhotoDialog } from './PhotoDialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Debounce delay to prevent rapid API calls when dragging marker
const FETCH_DEBOUNCE_MS = 500;

interface PhotoGalleryProps {
  /** Location latitude */
  lat: number;
  /** Location longitude */
  lng: number;
  /** Search radius in meters (default 5000, max 10000) */
  radiusMeters?: number;
  /** Maximum number of photos to fetch (default 20, max 50) */
  limit?: number;
}

export function PhotoGallery({
  lat,
  lng,
  radiusMeters = 5000,
  limit = 20,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<WikimediaPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<WikimediaPhoto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set loading state immediately for better UX
    setLoading(true);

    // Debounce the actual fetch to prevent rapid API calls
    debounceTimerRef.current = setTimeout(async () => {
      setError(null);

      try {
        const result = await fetchNearbyPhotos(lat, lng, radiusMeters, limit);

        if (cancelled) return;

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
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load photos');
        setPhotos([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [lat, lng, radiusMeters, limit]);

  const handleThumbnailClick = (photo: WikimediaPhoto) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // Small delay before clearing selected photo to avoid flash during close animation
    setTimeout(() => setSelectedPhoto(null), 200);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div>
          <p className="font-medium text-destructive">Failed to load photos</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="font-medium text-muted-foreground">No photos found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No geotagged photos found within {(radiusMeters / 1000).toFixed(1)}km of
            this location.
          </p>
        </div>
      </div>
    );
  }

  // Photo grid
  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found {photos.length} {photos.length === 1 ? 'photo' : 'photos'} within{' '}
            {(radiusMeters / 1000).toFixed(1)}km
          </p>
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {photos.map((photo) => (
            <PhotoThumbnail
              key={photo.id}
              photo={photo}
              onClick={() => handleThumbnailClick(photo)}
            />
          ))}
        </div>

        {/* Attribution notice */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Photos from{' '}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-foreground"
            >
              Wikimedia Commons
            </a>
            . Attribution required when using.
          </p>
        </div>
      </div>

      {/* Photo detail dialog */}
      <PhotoDialog
        photo={selectedPhoto}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      />
    </>
  );
}
