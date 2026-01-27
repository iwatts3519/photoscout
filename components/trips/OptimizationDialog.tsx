'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, TrendingDown } from 'lucide-react';
import { useTripStops } from '@/src/stores/tripPlannerStore';
import { optimizeStopOrder } from '@/lib/trips/route-optimizer';
import { formatDistance } from '@/lib/utils/geo';

interface OptimizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (newOrder: number[]) => void;
}

export function OptimizationDialog({ open, onOpenChange, onApply }: OptimizationDialogProps) {
  const stops = useTripStops();

  const result = useMemo(() => {
    if (!open || stops.length < 3) return null;

    const optimizable = stops.map((stop, index) => ({
      id: stop.id,
      coordinates: stop.coordinates,
      originalIndex: index,
    }));

    return optimizeStopOrder(optimizable, { fixFirstStop: true });
  }, [open, stops]);

  if (!result) return null;

  const hasImprovement = result.improvementPercent > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>Optimize Route</DialogTitle>
          </div>
          <DialogDescription>
            Reorder stops to minimize travel distance (straight-line estimate).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Distance comparison */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current</p>
              <p className="text-lg font-semibold">{formatDistance(result.originalDistance)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="rounded-lg border p-3 text-center border-primary/30 bg-primary/5">
              <p className="text-xs text-muted-foreground mb-1">Optimized</p>
              <p className="text-lg font-semibold">{formatDistance(result.optimizedDistance)}</p>
            </div>
          </div>

          {hasImprovement && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 justify-center">
              <TrendingDown className="h-4 w-4" />
              <span>Saves {result.improvementPercent}% travel distance</span>
            </div>
          )}

          {!hasImprovement && (
            <p className="text-sm text-muted-foreground text-center">
              Your current stop order is already optimal.
            </p>
          )}

          {/* Stop order comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Current Order</p>
              <ol className="space-y-1">
                {stops.map((stop, i) => (
                  <li key={stop.id} className="text-sm flex items-start gap-1.5">
                    <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="truncate">{stop.display_name}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Optimized Order</p>
              <ol className="space-y-1">
                {result.newOrder.map((originalIdx, i) => {
                  const stop = stops[originalIdx];
                  return (
                    <li key={stop.id} className="text-sm flex items-start gap-1.5">
                      <span className="text-muted-foreground font-mono text-xs mt-0.5 shrink-0">
                        {i + 1}.
                      </span>
                      <span className="truncate">{stop.display_name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => onApply(result.newOrder)}
            disabled={!hasImprovement}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Apply Optimization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
