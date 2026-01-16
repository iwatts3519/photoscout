/**
 * POIFilters Component
 * Allows users to toggle POI types on/off
 */

'use client';

import { usePOIStore } from '@/src/stores/poiStore';
import { POI_CATEGORIES } from '@/src/types/overpass.types';
import type { POIType } from '@/src/types/overpass.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function POIFilters() {
  const { filters, togglePOIType, enableAllTypes, disableAllTypes } = usePOIStore();
  const { enabledTypes } = filters;

  const allTypes: POIType[] = ['parking', 'cafe', 'viewpoint', 'toilet', 'information'];
  const allEnabled = enabledTypes.length === allTypes.length;
  const noneEnabled = enabledTypes.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">POI Filters</CardTitle>
        <CardDescription>
          Select which points of interest to show on the map
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={enableAllTypes}
            disabled={allEnabled}
            className="flex-1"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disableAllTypes}
            disabled={noneEnabled}
            className="flex-1"
          >
            None
          </Button>
        </div>

        {/* POI type checkboxes */}
        <div className="space-y-2">
          {allTypes.map((type) => {
            const category = POI_CATEGORIES[type];
            const isEnabled = enabledTypes.includes(type);

            return (
              <button
                key={type}
                onClick={() => togglePOIType(type)}
                className="flex w-full items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted"
                style={{
                  backgroundColor: isEnabled ? `${category.color}10` : 'transparent',
                  borderColor: isEnabled ? category.color : 'hsl(var(--border))',
                }}
              >
                {/* Icon */}
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.icon}
                </div>

                {/* Label */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">{category.label}</div>
                </div>

                {/* Checkbox indicator */}
                <div
                  className="h-5 w-5 flex-shrink-0 rounded border-2 transition-colors"
                  style={{
                    backgroundColor: isEnabled ? category.color : 'transparent',
                    borderColor: isEnabled ? category.color : 'hsl(var(--border))',
                  }}
                >
                  {isEnabled && (
                    <svg
                      className="h-full w-full text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
