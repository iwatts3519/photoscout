'use client';

import { ImageIcon } from 'lucide-react';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';

interface PhotoCountBadgeProps {
  locationId: string;
  className?: string;
  showZero?: boolean;
}

export function PhotoCountBadge({
  locationId,
  className = '',
  showZero = false,
}: PhotoCountBadgeProps) {
  const count = usePhotoLibraryStore((state) =>
    state.getPhotoCountForLocation(locationId)
  );

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded ${className}`}
    >
      <ImageIcon className="h-3 w-3" />
      <span>{count}</span>
    </span>
  );
}
