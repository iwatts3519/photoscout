'use client';

import { useMapStore } from '@/src/stores/mapStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin } from 'lucide-react';

export function Sidebar() {
  const { selectedLocation, radius, setRadius } = useMapStore();

  const formatCoordinate = (value: number, decimals: number = 6): string => {
    return value.toFixed(decimals);
  };

  const formatRadius = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  // Radius range: 500m to 10km
  const minRadius = 500;
  const maxRadius = 10000;

  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <Card className="border-0 rounded-none h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
          <CardDescription>
            {selectedLocation
              ? 'Adjust your search parameters'
              : 'Click on the map to select a location'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {selectedLocation ? (
            <>
              {/* Coordinates Display */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    value={formatCoordinate(selectedLocation.lat)}
                    readOnly
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    value={formatCoordinate(selectedLocation.lng)}
                    readOnly
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Radius Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius">Search Radius</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatRadius(radius)}
                  </span>
                </div>
                <Slider
                  id="radius"
                  min={minRadius}
                  max={maxRadius}
                  step={100}
                  value={[radius]}
                  onValueChange={handleRadiusChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatRadius(minRadius)}</span>
                  <span>{formatRadius(maxRadius)}</span>
                </div>
              </div>

              {/* Location Name (for future saving) */}
              <div className="space-y-2">
                <Label htmlFor="location-name">Location Name</Label>
                <Input
                  id="location-name"
                  placeholder="e.g., Lake District viewpoint"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Saving locations will be available in a future update
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Click anywhere on the map to select a location and start planning your shoot
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
