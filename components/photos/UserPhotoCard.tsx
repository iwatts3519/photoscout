'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSignedUrl } from '@/lib/supabase/storage';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import type { UserPhotoWithLocation } from '@/src/types/photo.types';
import { getCameraDisplayName, formatDateTaken } from '@/src/types/photo.types';

interface UserPhotoCardProps {
  photo: UserPhotoWithLocation;
  onClick: () => void;
}

export function UserPhotoCard({ photo, onClick }: UserPhotoCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getSignedUrl: getCachedUrl, setSignedUrl } = usePhotoLibraryStore();

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      // Check cache first
      const cachedUrl = getCachedUrl(photo.storage_path);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        return;
      }

      // Fetch signed URL
      const supabase = createClient();
      const url = await getSignedUrl(supabase, photo.storage_path);

      if (isMounted && url) {
        setImageUrl(url);
        setSignedUrl(photo.storage_path, url);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [photo.storage_path, getCachedUrl, setSignedUrl]);

  const cameraName = getCameraDisplayName(photo);
  const dateTaken = formatDateTaken(photo);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden bg-muted border hover:ring-2 hover:ring-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
    >
      {/* Photo */}
      <div className="aspect-square relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={photo.title || photo.original_filename}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Camera className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Gradient overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Title or filename */}
          <p className="font-medium text-white text-sm truncate">
            {photo.title || photo.original_filename}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
            {cameraName && (
              <span className="flex items-center gap-1 truncate">
                <Camera className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{cameraName}</span>
              </span>
            )}
            {photo.location_name && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{photo.location_name}</span>
              </span>
            )}
          </div>

          {/* Date taken */}
          {dateTaken && (
            <div className="flex items-center gap-1 mt-1 text-xs text-white/50">
              <Calendar className="h-3 w-3" />
              <span>{dateTaken}</span>
            </div>
          )}
        </div>
      </div>

      {/* Location indicator (visible always) */}
      {photo.location_name && (
        <div className="absolute top-2 right-2 p-1 rounded-full bg-black/50 group-hover:bg-primary transition-colors">
          <MapPin className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}
