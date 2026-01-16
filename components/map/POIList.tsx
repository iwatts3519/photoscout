/**
 * POIList Component
 * Displays a list of nearby POIs grouped by type
 */

'use client';

import { useEffect } from 'react';
import { MapPin, AlertCircle, ExternalLink } from 'lucide-react';
import { usePOIStore } from '@/src/stores/poiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { fetchPOIs } from '@/app/actions/overpass';
import { POI_CATEGORIES } from '@/src/types/overpass.types';
import type { POI } from '@/src/types/overpass.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * POI item component
 */
function POIItem({ poi, onPanTo }: { poi: POI; onPanTo?: (poi: POI) => void }) {
  const category = POI_CATEGORIES[poi.type];

  return (
    <div
      className="flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted cursor-pointer"
      onClick={() => onPanTo?.(poi)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onPanTo?.(poi);
        }
      }}
    >
      {/* Icon */}
      <div
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: category.color }}
      >
        {category.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{poi.name}</div>
        {poi.distance && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{formatDistance(poi.distance)} away</span>
          </div>
        )}
        {poi.metadata?.openingHours && (
          <div className="text-xs text-muted-foreground mt-1">
            {poi.metadata.openingHours}
          </div>
        )}
        {poi.metadata?.website && (
          <a
            href={poi.metadata.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
          >
            Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function POIList() {
  const { selectedLocation, radius, mapInstance } = useMapStore();
  const { loading, error, setPOIs, setLoading, setError, getFilteredPOIs, filters } =
    usePOIStore();

  // Handler to pan map to POI location
  const handlePanToPOI = (poi: POI) => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: [poi.coordinates.lng, poi.coordinates.lat],
        zoom: 16,
        duration: 1500,
      });
    }
  };

  // Fetch POIs when location or radius changes
  useEffect(() => {
    if (!selectedLocation) {
      setPOIs([]);
      return;
    }

    let cancelled = false;

    async function loadPOIs() {
      if (!selectedLocation) return;

      setLoading(true);
      setError(null);

      try {
        const result = await fetchPOIs(
          selectedLocation.lat,
          selectedLocation.lng,
          radius,
          filters.enabledTypes
        );

        if (cancelled) return;

        if (result.error) {
          setError(result.error);
          setPOIs([]);
        } else {
          setPOIs(result.data || []);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load POIs');
        setPOIs([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPOIs();

    return () => {
      cancelled = true;
    };
  }, [selectedLocation, radius, filters.enabledTypes, setPOIs, setLoading, setError]);

  // Get filtered POIs
  const filteredPOIs = getFilteredPOIs();

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nearby POIs</CardTitle>
          <CardDescription>Points of interest near your location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nearby POIs</CardTitle>
          <CardDescription>Points of interest near your location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load POIs</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!selectedLocation) {
    return null;
  }

  if (filteredPOIs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nearby POIs</CardTitle>
          <CardDescription>Points of interest near your location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-muted-foreground">No POIs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No points of interest found within {(radius / 1000).toFixed(1)}km.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group POIs by type
  const groupedPOIs = filteredPOIs.reduce((acc, poi) => {
    if (!acc[poi.type]) {
      acc[poi.type] = [];
    }
    acc[poi.type].push(poi);
    return acc;
  }, {} as Record<string, POI[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nearby POIs</CardTitle>
        <CardDescription>
          Found {filteredPOIs.length} {filteredPOIs.length === 1 ? 'location' : 'locations'}{' '}
          within {(radius / 1000).toFixed(1)}km
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedPOIs).map(([type, typePOIs]) => {
          const category = POI_CATEGORIES[type as keyof typeof POI_CATEGORIES];

          return (
            <div key={type} className="space-y-2">
              {/* Category header */}
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>
                <h3 className="text-sm font-medium">
                  {category.label} ({typePOIs.length})
                </h3>
              </div>

              {/* POI list */}
              <div className="space-y-2">
                {typePOIs.slice(0, 5).map((poi) => (
                  <POIItem key={poi.id} poi={poi} onPanTo={handlePanToPOI} />
                ))}
                {typePOIs.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    + {typePOIs.length - 5} more
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Attribution */}
        <div className="rounded-lg border bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            POI data from{' '}
            <a
              href="https://www.openstreetmap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-foreground"
            >
              OpenStreetMap
            </a>{' '}
            via Overpass API.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
