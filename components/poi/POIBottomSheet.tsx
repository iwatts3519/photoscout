/**
 * POIBottomSheet Component
 * Displays grouped POIs (Points of Interest) in an expandable bottom sheet
 */

'use client';

import { useMemo } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Globe,
  Navigation,
  Loader2,
} from 'lucide-react';
import { BottomSheet, type BottomSheetState } from '@/components/layout/BottomSheet';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/src/stores/uiStore';
import { usePOIStore } from '@/src/stores/poiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { POI_CATEGORIES, type POI, type POIType } from '@/src/types/overpass.types';

interface POIBottomSheetProps {
  className?: string;
}

/**
 * Format distance in meters to human-readable string
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get Google Maps directions URL
 */
function getDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * POI Group Section
 */
function POIGroup({
  type,
  pois,
  onNavigate,
}: {
  type: POIType;
  pois: POI[];
  onNavigate: (poi: POI) => void;
}) {
  const category = POI_CATEGORIES[type];

  return (
    <div className="space-y-2">
      {/* Group header */}
      <div className="flex items-center gap-2 sticky top-0 bg-background py-2 border-b">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ backgroundColor: category.color }}
        >
          {category.icon}
        </div>
        <h3 className="font-semibold text-sm uppercase tracking-wider">
          {category.label}
        </h3>
        <span className="text-xs text-muted-foreground">({pois.length})</span>
      </div>

      {/* POI list */}
      <div className="space-y-2">
        {pois.map((poi) => (
          <div
            key={poi.id}
            className="rounded-lg border bg-card p-3 space-y-2"
          >
            {/* POI name and distance */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{poi.name}</p>
                {poi.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {poi.description}
                  </p>
                )}
              </div>
              {poi.distance !== undefined && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistance(poi.distance)}
                </span>
              )}
            </div>

            {/* POI metadata */}
            {poi.metadata && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {poi.metadata.openingHours && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">
                      {poi.metadata.openingHours}
                    </span>
                  </div>
                )}
                {poi.metadata.phone && (
                  <a
                    href={`tel:${poi.metadata.phone}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    <span>{poi.metadata.phone}</span>
                  </a>
                )}
                {poi.metadata.website && (
                  <a
                    href={poi.metadata.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8"
                onClick={() => onNavigate(poi)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Show on Map
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                asChild
              >
                <a
                  href={getDirectionsUrl(poi.coordinates.lat, poi.coordinates.lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Directions
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function POIBottomSheet({ className }: POIBottomSheetProps) {
  const {
    bottomSheetContent,
    bottomSheetExpanded,
    closeBottomSheet,
    setBottomSheetExpanded,
  } = useUIStore();

  const { pois, filters, loading } = usePOIStore();
  const { setSelectedLocation } = useMapStore();

  const isOpen = bottomSheetContent === 'poi';

  // Filter and group POIs
  const filteredPOIs = useMemo(() => {
    if (!filters.showPOIs) return [];
    return pois.filter((poi) => filters.enabledTypes.includes(poi.type));
  }, [pois, filters]);

  const groupedPOIs = useMemo(() => {
    const groups: Record<POIType, POI[]> = {
      parking: [],
      cafe: [],
      viewpoint: [],
      toilet: [],
      information: [],
    };

    filteredPOIs.forEach((poi) => {
      groups[poi.type].push(poi);
    });

    // Sort each group by distance
    Object.keys(groups).forEach((type) => {
      groups[type as POIType].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    });

    return groups;
  }, [filteredPOIs]);

  // Get non-empty groups in display order
  const nonEmptyGroups = useMemo(() => {
    const order: POIType[] = ['parking', 'cafe', 'viewpoint', 'toilet', 'information'];
    return order.filter((type) => groupedPOIs[type].length > 0);
  }, [groupedPOIs]);

  const handleStateChange = (state: BottomSheetState) => {
    setBottomSheetExpanded(state === 'expanded');
  };

  const handleNavigate = (poi: POI) => {
    setSelectedLocation(poi.coordinates);
    closeBottomSheet();
  };

  return (
    <BottomSheet
      open={isOpen}
      onClose={closeBottomSheet}
      state={bottomSheetExpanded ? 'expanded' : 'peek'}
      onStateChange={handleStateChange}
      title="Nearby Points of Interest"
      subtitle={
        loading
          ? 'Loading...'
          : `${filteredPOIs.length} ${filteredPOIs.length === 1 ? 'location' : 'locations'} found`
      }
      peekHeight={280}
      className={className}
    >
      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : nonEmptyGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-muted-foreground">No POIs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters or searching a different area
            </p>
          </div>
        ) : (
          nonEmptyGroups.map((type) => (
            <POIGroup
              key={type}
              type={type}
              pois={groupedPOIs[type]}
              onNavigate={handleNavigate}
            />
          ))
        )}

        {/* OpenStreetMap attribution */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          POI data from{' '}
          <a
            href="https://www.openstreetmap.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            OpenStreetMap
          </a>
          {' '}via Overpass API
        </div>
      </div>
    </BottomSheet>
  );
}
