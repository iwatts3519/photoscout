'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { X, BarChart3 } from 'lucide-react';
import { useComparisonStore } from '@/src/stores/comparisonStore';
import { useLocationStore } from '@/src/stores/locationStore';

export function ComparisonSelectionBar() {
  const router = useRouter();
  const selectedLocationIds = useComparisonStore(
    (state) => state.selectedLocationIds
  );
  const removeLocationFromCompare = useComparisonStore(
    (state) => state.removeLocationFromCompare
  );
  const clearSelection = useComparisonStore((state) => state.clearSelection);
  const savedLocations = useLocationStore((state) => state.savedLocations);

  if (selectedLocationIds.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-2">
        Select 2-4 locations to compare
      </p>
    );
  }

  const selectedLocations = selectedLocationIds
    .map((id) => savedLocations.find((loc) => loc.id === id))
    .filter(Boolean);

  const canCompare = selectedLocationIds.length >= 2;

  const handleCompare = () => {
    const ids = selectedLocationIds.join(',');
    router.push(`/compare?ids=${ids}`);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {selectedLocationIds.length} selected (max 4)
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-6 text-xs px-2"
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleCompare}
            disabled={!canCompare}
            className="h-6 text-xs px-2"
          >
            <BarChart3 className="h-3 w-3 mr-1" />
            Compare
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {selectedLocations.map((location) =>
          location ? (
            <span
              key={location.id}
              className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5"
            >
              <span className="truncate max-w-[120px]">{location.name}</span>
              <button
                onClick={() => removeLocationFromCompare(location.id)}
                className="hover:bg-primary/20 rounded-full p-0.5"
                aria-label={`Remove ${location.name} from comparison`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
