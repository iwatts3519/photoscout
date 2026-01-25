'use client';

import { LocationPreviewCard } from './LocationPreviewCard';
import type { PublicLocation } from '@/src/types/community.types';

interface DiscoveryGridProps {
  locations: PublicLocation[];
}

export function DiscoveryGrid({ locations }: DiscoveryGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {locations.map((location) => (
        <LocationPreviewCard key={location.id} location={location} />
      ))}
    </div>
  );
}
