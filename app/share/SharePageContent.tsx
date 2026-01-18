'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Copy, Check } from 'lucide-react';
import { formatCoordinates, copyToClipboard, generateGoogleMapsUrl, generateOSMUrl } from '@/lib/utils/export';
import { useMapStore } from '@/src/stores/mapStore';
import { toast } from 'sonner';

export function SharePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setCenter = useMapStore((state) => state.setCenter);
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setZoom = useMapStore((state) => state.setZoom);

  const [copied, setCopied] = useState(false);

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const nameParam = searchParams.get('name');

  const lat = latParam ? parseFloat(latParam) : null;
  const lng = lngParam ? parseFloat(lngParam) : null;

  const isValidLocation = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  useEffect(() => {
    // If coming from a share link, show a toast
    if (isValidLocation) {
      toast.info('Shared location loaded');
    }
  }, [isValidLocation]);

  const handleViewInApp = () => {
    if (lat !== null && lng !== null) {
      setCenter({ lat, lng });
      setSelectedLocation({ lat, lng });
      setZoom(14);
      router.push('/');
    }
  };

  const handleCopyCoordinates = async () => {
    if (lat !== null && lng !== null) {
      const coordString = formatCoordinates(lat, lng, 'decimal');
      const success = await copyToClipboard(coordString);
      if (success) {
        setCopied(true);
        toast.success('Coordinates copied');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  if (!isValidLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <MapPin className="h-5 w-5" />
              Invalid Location
            </CardTitle>
            <CardDescription>
              The shared link is invalid or missing location data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Go to PhotoScout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const coordsDecimal = formatCoordinates(lat, lng, 'decimal');
  const coordsDMS = formatCoordinates(lat, lng, 'dms');
  const googleMapsUrl = generateGoogleMapsUrl(lat, lng);
  const osmUrl = generateOSMUrl(lat, lng);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {nameParam || 'Shared Location'}
          </CardTitle>
          <CardDescription>
            A photography location shared via PhotoScout
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coordinates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Coordinates</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={handleCopyCoordinates}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                Copy
              </Button>
            </div>
            <div className="bg-muted rounded-md p-3 space-y-1">
              <p className="text-sm font-mono">{coordsDecimal}</p>
              <p className="text-xs text-muted-foreground font-mono">{coordsDMS}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button onClick={handleViewInApp} className="w-full">
              <Navigation className="h-4 w-4 mr-2" />
              View in PhotoScout
            </Button>

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

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            PhotoScout helps UK landscape photographers discover locations and plan shoots.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
