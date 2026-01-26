'use client';

import { UserPhotoCard } from './UserPhotoCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserPhotoWithLocation } from '@/src/types/photo.types';

interface UserPhotoGridProps {
  photos: UserPhotoWithLocation[];
  onPhotoClick: (photo: UserPhotoWithLocation) => void;
  isLoading?: boolean;
}

export function UserPhotoGrid({
  photos,
  onPhotoClick,
  isLoading = false,
}: UserPhotoGridProps) {
  if (isLoading && photos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-square">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <UserPhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(photo)}
        />
      ))}
    </div>
  );
}
