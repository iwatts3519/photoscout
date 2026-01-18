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
  MapPin,
  ExternalLink,
  FileJson,
  FileText,
} from 'lucide-react';
import {
  copyToClipboard,
  formatCoordinates,
  generateGoogleMapsUrl,
  generateOSMUrl,
  generateShareUrl,
  exportSingleToJSON,
  exportSingleToGPX,
  downloadFile,
  generateFilename,
} from '@/lib/utils/export';
import { toast } from 'sonner';
import type { SavedLocation } from '@/src/stores/locationStore';

interface ShareLocationDialogProps {
  location: SavedLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper to parse coordinates
function parseCoords(coords: unknown): { lat: number; lng: number } | null {
  if (typeof coords === 'string') {
    const match = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2]),
      };
    }
  }
  if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return coords as { lat: number; lng: number };
  }
  return null;
}

export function ShareLocationDialog({
  location,
  open,
  onOpenChange,
}: ShareLocationDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!location) return null;

  const coords = parseCoords(location.coordinates);
  if (!coords) return null;

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

  const shareUrl = generateShareUrl(coords.lat, coords.lng, location.name);
  const googleMapsUrl = generateGoogleMapsUrl(coords.lat, coords.lng);
  const osmUrl = generateOSMUrl(coords.lat, coords.lng);
  const coordsDecimal = formatCoordinates(coords.lat, coords.lng, 'decimal');
  const coordsDMS = formatCoordinates(coords.lat, coords.lng, 'dms');

  const handleExportJSON = () => {
    const json = exportSingleToJSON(location);
    const filename = generateFilename(`photoscout-${location.name.replace(/\s+/g, '-').toLowerCase()}`, 'json');
    downloadFile(json, filename, 'application/json');
    toast.success('Downloaded JSON file');
  };

  const handleExportGPX = () => {
    const gpx = exportSingleToGPX(location);
    const filename = generateFilename(`photoscout-${location.name.replace(/\s+/g, '-').toLowerCase()}`, 'gpx');
    downloadFile(gpx, filename, 'application/gpx+xml');
    toast.success('Downloaded GPX file');
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 shrink-0"
      onClick={() => handleCopy(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Share Location
          </DialogTitle>
          <DialogDescription>
            Share &quot;{location.name}&quot; via link, coordinates, or export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share URL */}
          <div className="space-y-2">
            <Label htmlFor="share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input
                id="share-url"
                value={shareUrl}
                readOnly
                className="text-sm"
              />
              <CopyButton text={shareUrl} field="url" />
            </div>
          </div>

          {/* Coordinates - Decimal */}
          <div className="space-y-2">
            <Label htmlFor="coords-decimal">Coordinates (Decimal)</Label>
            <div className="flex gap-2">
              <Input
                id="coords-decimal"
                value={coordsDecimal}
                readOnly
                className="text-sm font-mono"
              />
              <CopyButton text={coordsDecimal} field="decimal" />
            </div>
          </div>

          {/* Coordinates - DMS */}
          <div className="space-y-2">
            <Label htmlFor="coords-dms">Coordinates (DMS)</Label>
            <div className="flex gap-2">
              <Input
                id="coords-dms"
                value={coordsDMS}
                readOnly
                className="text-sm font-mono"
              />
              <CopyButton text={coordsDMS} field="dms" />
            </div>
          </div>

          {/* External Map Links */}
          <div className="space-y-2">
            <Label>Open in Maps</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(googleMapsUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(osmUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                OpenStreetMap
              </Button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2">
            <Label>Export Location</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExportJSON}
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleExportGPX}
              >
                <FileText className="h-4 w-4 mr-2" />
                GPX
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              GPX files can be imported into GPS devices and mapping apps.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
