'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin,
  User,
  Eye,
  Heart,
  Clock,
  Tag,
  ArrowLeft,
  Share2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FavoriteButton } from './FavoriteButton';
import { ReportDialog } from './ReportDialog';
import { formatDistanceToNow, formatShortDate } from '@/lib/utils/date';
import type { LocationWithCoords } from '@/src/types/community.types';

interface SpotDetailProps {
  spot: LocationWithCoords & { is_favorited: boolean };
}

export function SpotDetail({ spot }: SpotDetailProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [spot.lng, spot.lat],
      zoom: 14,
      interactive: true,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add marker
    new maplibregl.Marker({ color: 'hsl(var(--primary))' })
      .setLngLat([spot.lng, spot.lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [spot.lat, spot.lng]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: spot.name,
          text: spot.description || `Check out this photo spot: ${spot.name}`,
          url,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const createdDate = new Date(spot.created_at);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/discover"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Discover</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <FavoriteButton
              locationId={spot.id}
              initialFavorited={spot.is_favorited}
              initialCount={spot.favorite_count}
            />
            <ReportDialog locationId={spot.id} locationName={spot.name} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div
              ref={mapContainer}
              className="w-full h-[300px] lg:h-[400px] rounded-lg border overflow-hidden"
            />

            {/* Location Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold">{spot.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {spot.owner_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(createdDate)}
                  </span>
                </div>
              </div>

              {spot.description && (
                <p className="text-muted-foreground">{spot.description}</p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 py-3 border-y">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{spot.view_count}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{spot.favorite_count}</p>
                    <p className="text-xs text-muted-foreground">Favorites</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {spot.tags && spot.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spot.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/discover?tag=${encodeURIComponent(tag)}`}
                        className="inline-block px-3 py-1 text-sm rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {spot.notes && (
                <div className="space-y-2 p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium">Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {spot.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Coordinates */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="font-medium">Location</h3>
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                asChild
              >
                <a
                  href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </Button>
            </div>

            {/* Best Time to Visit */}
            {spot.best_time_to_visit && (
              <div className="p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Best Time to Visit</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {spot.best_time_to_visit}
                </p>
              </div>
            )}

            {/* Created Date */}
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground">
                Added {formatShortDate(createdDate)}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
