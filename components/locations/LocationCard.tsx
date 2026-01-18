'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Trash2,
  Edit,
  MoreVertical,
  Navigation,
  Clock,
  Calendar,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteLocationAction } from '@/app/actions/locations';
import { useLocationStore } from '@/src/stores/locationStore';
import { useMapStore } from '@/src/stores/mapStore';
import { CollectionBadge } from './CollectionBadge';
import { toast } from 'sonner';
import type { SavedLocation } from '@/src/stores/locationStore';

// Helper to format last visited date
function formatLastVisited(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

interface LocationCardProps {
  location: SavedLocation;
  onEdit?: (location: SavedLocation) => void;
}

export function LocationCard({ location, onEdit }: LocationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const removeLocation = useLocationStore((state) => state.removeLocation);
  const setCenter = useMapStore((state) => state.setCenter);
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setZoom = useMapStore((state) => state.setZoom);

  // Parse coordinates from PostGIS geography (stored as POINT(lng lat))
  const parseCoordinates = (coords: unknown): { lat: number; lng: number } | null => {
    if (typeof coords === 'string') {
      // Format: "POINT(lng lat)" or "(lng,lat)"
      const match = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2]),
        };
      }
    }

    // If it's an object with lat/lng properties
    if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
      return coords as { lat: number; lng: number };
    }

    return null;
  };

  const coords = parseCoordinates(location.coordinates);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const { error } = await deleteLocationAction(location.id);

      if (error) {
        toast.error('Failed to delete location', {
          description: error,
        });
        setIsDeleting(false);
        return;
      }

      // Remove from store
      removeLocation(location.id);

      toast.success('Location deleted', {
        description: `${location.name} has been removed.`,
      });
    } catch (err) {
      toast.error('Failed to delete location', {
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsDeleting(false);
    }
  };

  const handleViewOnMap = () => {
    if (coords) {
      setCenter({ lat: coords.lat, lng: coords.lng });
      setSelectedLocation({ lat: coords.lat, lng: coords.lng });
      setZoom(14); // Zoom in to see the location
      toast.success('Location centered on map');
    }
  };

  if (!coords) {
    return null; // Skip rendering if coordinates can't be parsed
  }

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium leading-tight truncate">
                {location.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            </div>
          </div>

          {location.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
              {location.description}
            </p>
          )}

          {location.collection_id && (
            <div className="pl-6">
              <CollectionBadge collectionId={location.collection_id} />
            </div>
          )}

          {/* Best time to visit */}
          {location.best_time_to_visit && (
            <div className="flex items-start gap-2 pl-6">
              <Clock className="h-3.5 w-3.5 mt-0.5 text-amber-500 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                {location.best_time_to_visit}
              </span>
            </div>
          )}

          {/* Last visited */}
          {location.last_visited && (
            <div className="flex items-center gap-2 pl-6">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Last visited: {formatLastVisited(location.last_visited)}
              </span>
            </div>
          )}

          {/* Notes (truncated) */}
          {location.notes && (
            <div className="flex items-start gap-2 pl-6">
              <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                {location.notes}
              </p>
            </div>
          )}

          {location.tags && location.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pl-6">
              {location.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pl-6">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewOnMap}
              className="h-7 text-xs"
            >
              <Navigation className="h-3 w-3 mr-1" />
              View on Map
            </Button>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isDeleting}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(location)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
