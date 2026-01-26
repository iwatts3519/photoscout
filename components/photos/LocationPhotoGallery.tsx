'use client';

import { useState, useEffect } from 'react';
import { Loader2, ImageIcon, Camera } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { createClient } from '@/lib/supabase/client';
import { getSignedUrl } from '@/lib/supabase/storage';
import { fetchLocationPhotos } from '@/app/actions/photos';
import type { UserPhoto } from '@/src/types/photo.types';

interface LocationPhotoGalleryProps {
  locationId: string;
  onPhotoClick?: (photo: UserPhoto) => void;
  maxPhotos?: number;
  compact?: boolean;
}

interface PhotoWithUrl extends UserPhoto {
  url: string | null;
}

export function LocationPhotoGallery({
  locationId,
  onPhotoClick,
  maxPhotos = 6,
  compact = false,
}: LocationPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPhotos = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchLocationPhotos(
        locationId,
        maxPhotos
      );

      if (!isMounted) return;

      if (fetchError) {
        setError(fetchError);
        setIsLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setPhotos([]);
        setIsLoading(false);
        return;
      }

      // Load signed URLs for photos
      const supabase = createClient();
      const photosWithUrls = await Promise.all(
        data.map(async (photo) => {
          const url = await getSignedUrl(supabase, photo.storage_path);
          return { ...photo, url };
        })
      );

      if (isMounted) {
        setPhotos(photosWithUrls);
        setIsLoading(false);
      }
    };

    loadPhotos();

    return () => {
      isMounted = false;
    };
  }, [locationId, maxPhotos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Failed to load photos
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <ImageIcon className="h-4 w-4" />
        <span>No photos for this location</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {photos.slice(0, 4).map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => onPhotoClick?.(photo)}
            className="relative w-8 h-8 rounded overflow-hidden bg-muted hover:ring-2 hover:ring-primary transition-all"
            style={{
              zIndex: 4 - index,
              marginLeft: index > 0 ? '-4px' : 0,
            }}
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.title || photo.original_filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-full h-full p-1 text-muted-foreground" />
            )}
          </button>
        ))}
        {photos.length > 4 && (
          <span className="text-xs text-muted-foreground ml-1">
            +{photos.length - 4}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          Photos ({photos.length})
        </h4>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => onPhotoClick?.(photo)}
              className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 hover:ring-2 hover:ring-primary transition-all group"
            >
              {photo.url ? (
                <img
                  src={photo.url}
                  alt={photo.title || photo.original_filename}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
