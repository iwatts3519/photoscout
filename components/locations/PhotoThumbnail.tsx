/**
 * PhotoThumbnail Component
 * Displays a thumbnail of a Wikimedia Commons photo
 */

'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';
import { cn } from '@/lib/utils';

interface PhotoThumbnailProps {
  photo: WikimediaPhoto;
  onClick: () => void;
  className?: string;
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function PhotoThumbnail({ photo, onClick, className }: PhotoThumbnailProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-lg bg-muted transition-all hover:ring-2 hover:ring-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className
      )}
      aria-label={`View photo: ${photo.description}`}
    >
      {/* Photo thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={photo.thumbnailUrl}
          alt={photo.description}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized // External images from Wikimedia
        />

        {/* Distance badge */}
        <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
          <MapPin className="h-3 w-3" />
          <span>{formatDistance(photo.distance)}</span>
        </div>
      </div>

      {/* Photo info overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
        <p className="line-clamp-2 text-sm font-medium text-white">
          {photo.description}
        </p>
        {photo.photographer && (
          <p className="mt-1 truncate text-xs text-white/80">
            by {photo.photographer}
          </p>
        )}
      </div>
    </button>
  );
}
