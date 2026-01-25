'use client';

import Link from 'next/link';
import { MapPin, Heart, Eye, Clock, User } from 'lucide-react';
import type { PublicLocation } from '@/src/types/community.types';
import { formatDistanceToNow } from '@/lib/utils/date';

interface LocationPreviewCardProps {
  location: PublicLocation;
}

export function LocationPreviewCard({ location }: LocationPreviewCardProps) {
  const createdDate = new Date(location.created_at);

  return (
    <Link
      href={`/spot/${location.id}`}
      className="block p-4 border rounded-lg hover:border-primary/50 hover:shadow-md transition-all bg-card group"
    >
      {/* Header with name and owner */}
      <div className="mb-3">
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {location.name}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{location.owner_name}</span>
        </div>
      </div>

      {/* Description */}
      {location.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {location.description}
        </p>
      )}

      {/* Location coordinates */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
        <MapPin className="h-3 w-3" />
        <span>
          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
        </span>
      </div>

      {/* Tags */}
      {location.tags && location.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {location.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {location.tags.length > 3 && (
            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
              +{location.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer with stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {location.view_count}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {location.favorite_count}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(createdDate)}
        </span>
      </div>
    </Link>
  );
}
