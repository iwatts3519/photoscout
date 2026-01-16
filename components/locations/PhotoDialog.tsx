/**
 * PhotoDialog Component
 * Displays full photo details with attribution in a modal dialog
 */

'use client';

import Image from 'next/image';
import { ExternalLink, MapPin, Calendar, Camera, Scale } from 'lucide-react';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PhotoDialogProps {
  photo: WikimediaPhoto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meters`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format date string to readable format
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function PhotoDialog({ photo, open, onOpenChange }: PhotoDialogProps) {
  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{photo.description}</DialogTitle>
          <DialogDescription>
            From Wikimedia Commons - Free to use with attribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            <Image
              src={photo.imageUrl}
              alt={photo.description}
              fill
              sizes="(max-width: 1024px) 100vw, 896px"
              className="object-contain"
              unoptimized // External images from Wikimedia
            />
          </div>

          {/* Photo metadata */}
          <div className="grid gap-3 text-sm">
            {/* Photographer */}
            <div className="flex items-start gap-3">
              <Camera className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Photographer</p>
                <p className="text-muted-foreground">{photo.photographer}</p>
              </div>
            </div>

            {/* License */}
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">License</p>
                <p className="text-muted-foreground">{photo.license}</p>
              </div>
            </div>

            {/* Distance */}
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Distance from Location</p>
                <p className="text-muted-foreground">
                  {formatDistance(photo.distance)} away
                </p>
                <p className="text-xs text-muted-foreground">
                  {photo.coordinates.lat.toFixed(6)}, {photo.coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Date taken */}
            {photo.dateTaken && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Date Taken</p>
                  <p className="text-muted-foreground">{formatDate(photo.dateTaken)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Attribution notice */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="text-sm font-medium">Attribution Required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              This image is from Wikimedia Commons and requires attribution. When using
              this photo, please credit: <strong>{photo.photographer}</strong> and
              include the license: <strong>{photo.license}</strong>.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <a
                href={photo.pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                View on Wikimedia Commons
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <a
                href={photo.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Open Full Size Image
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
