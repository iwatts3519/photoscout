'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Copy,
  Check,
  Share2,
  FileJson,
  FileText,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  copyToClipboard,
  downloadFile,
  generateFilename,
} from '@/lib/utils/export';
import { exportTripToGPX } from '@/lib/trips/export-gpx';
import { exportTripToKML } from '@/lib/trips/export-kml';
import type { TripWithStops } from '@/src/types/trips.types';

interface TripExportDialogProps {
  trip: TripWithStops | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function exportTripToJSON(trip: TripWithStops): string {
  const exportData = {
    version: '1.0' as const,
    exported_at: new Date().toISOString(),
    app: 'PhotoScout' as const,
    type: 'trip' as const,
    trip: {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      trip_date: trip.trip_date,
      start_time: trip.start_time,
      transport_mode: trip.transport_mode,
      total_distance_meters: trip.total_distance_meters,
      total_duration_seconds: trip.total_duration_seconds,
      is_optimized: trip.is_optimized,
      stops: trip.stops.map((stop) => ({
        display_name: stop.display_name,
        coordinates: stop.coordinates,
        stop_order: stop.stop_order,
        planned_arrival: stop.planned_arrival,
        planned_duration_minutes: stop.planned_duration_minutes,
        notes: stop.notes,
        distance_to_next_meters: stop.distance_to_next_meters,
        duration_to_next_seconds: stop.duration_to_next_seconds,
      })),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export function TripExportDialog({
  trip,
  open,
  onOpenChange,
}: TripExportDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!trip) return null;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/trip/${trip.id}`
    : `/trip/${trip.id}`;

  const slug = trip.name.replace(/\s+/g, '-').toLowerCase();

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } else {
      toast.error('Failed to copy');
    }
  };

  const handleExportGPX = () => {
    const gpx = exportTripToGPX(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'gpx');
    downloadFile(gpx, filename, 'application/gpx+xml');
    toast.success('Downloaded GPX file');
  };

  const handleExportKML = () => {
    const kml = exportTripToKML(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'kml');
    downloadFile(kml, filename, 'application/vnd.google-earth.kml+xml');
    toast.success('Downloaded KML file');
  };

  const handleExportJSON = () => {
    const json = exportTripToJSON(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'json');
    downloadFile(json, filename, 'application/json');
    toast.success('Downloaded JSON file');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share &amp; Export Trip
          </DialogTitle>
          <DialogDescription>
            Share &quot;{trip.name}&quot; via link or export to GPS formats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="trip-share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="trip-share-url"
                value={shareUrl}
                readOnly
                className="text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => handleCopy(shareUrl, 'url')}
              >
                {copiedField === 'url' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link with other PhotoScout users to view your trip.
            </p>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <Label>Export Trip</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGPX}
              >
                <FileText className="h-4 w-4 mr-2" />
                GPX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportKML}
              >
                <Globe className="h-4 w-4 mr-2" />
                KML
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportJSON}
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              GPX &amp; KML files can be imported into GPS devices, Google Earth, and mapping apps.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
