/**
 * POIFiltersCompact - Icon-only POI type toggles
 * Compact version for the minimal sidebar layout
 */

'use client';

import { usePOIStore } from '@/src/stores/poiStore';
import { POI_CATEGORIES } from '@/src/types/overpass.types';
import type { POIType } from '@/src/types/overpass.types';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface POIFiltersCompactProps {
  className?: string;
}

const POI_ICONS: Record<POIType, string> = {
  parking: 'P',
  cafe: 'C',
  viewpoint: 'V',
  toilet: 'T',
  information: 'i',
};

export function POIFiltersCompact({ className }: POIFiltersCompactProps) {
  const { filters, togglePOIType, enableAllTypes, disableAllTypes } = usePOIStore();
  const { enabledTypes } = filters;

  const allTypes: POIType[] = ['parking', 'cafe', 'viewpoint', 'toilet', 'information'];
  const allEnabled = enabledTypes.length === allTypes.length;
  const noneEnabled = enabledTypes.length === 0;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">POI Filters</span>
          <div className="flex gap-1">
            <button
              onClick={enableAllTypes}
              disabled={allEnabled}
              className={cn(
                'px-2 py-0.5 text-xs rounded transition-colors',
                allEnabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              All
            </button>
            <button
              onClick={disableAllTypes}
              disabled={noneEnabled}
              className={cn(
                'px-2 py-0.5 text-xs rounded transition-colors',
                noneEnabled
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              None
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {allTypes.map((type) => {
            const category = POI_CATEGORIES[type];
            const isEnabled = enabledTypes.includes(type);

            return (
              <Tooltip key={type}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => togglePOIType(type)}
                    className={cn(
                      'flex items-center justify-center w-9 h-9 rounded-lg',
                      'text-sm font-bold transition-all',
                      'border-2',
                      isEnabled
                        ? 'text-white shadow-sm'
                        : 'bg-background text-muted-foreground hover:bg-accent'
                    )}
                    style={{
                      backgroundColor: isEnabled ? category.color : undefined,
                      borderColor: isEnabled ? category.color : 'hsl(var(--border))',
                    }}
                    aria-label={`Toggle ${category.label}`}
                    aria-pressed={isEnabled}
                  >
                    {POI_ICONS[type]}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{category.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
