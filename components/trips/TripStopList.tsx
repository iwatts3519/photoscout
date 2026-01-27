'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Route } from 'lucide-react';
import { TripStopCard } from './TripStopCard';
import { useTripPlannerStore, useTripStops, useRouteCalculation } from '@/src/stores/tripPlannerStore';

export function TripStopList() {
  const stops = useTripStops();
  const routeCalculation = useRouteCalculation();
  const openAddStopDialog = useTripPlannerStore((state) => state.openAddStopDialog);
  const reorderStops = useTripPlannerStore((state) => state.reorderStops);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  // Get route leg info for each stop
  const getRouteInfoForStop = useCallback(
    (index: number) => {
      if (!routeCalculation || index >= routeCalculation.legs.length) {
        return { distanceToNext: undefined, durationToNext: undefined };
      }

      const leg = routeCalculation.legs[index];
      return {
        distanceToNext: leg?.distance_meters,
        durationToNext: leg?.duration_seconds,
      };
    },
    [routeCalculation]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dropTargetIndex !== null && draggedIndex !== dropTargetIndex) {
      reorderStops(draggedIndex, dropTargetIndex);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [draggedIndex, dropTargetIndex, reorderStops]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  }, []);

  if (stops.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Route className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No stops yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add stops to plan your photography route
        </p>
        <Button onClick={openAddStopDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add First Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Stop list */}
      {stops.map((stop, index) => {
        const routeInfo = getRouteInfoForStop(index);

        return (
          <div
            key={stop.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            className={
              draggedIndex === index
                ? 'opacity-50'
                : dropTargetIndex === index && draggedIndex !== null
                ? 'border-t-2 border-primary'
                : ''
            }
          >
            <TripStopCard
              stop={stop}
              index={index}
              isLast={index === stops.length - 1}
              distanceToNext={routeInfo.distanceToNext}
              durationToNext={routeInfo.durationToNext}
              onDragStart={() => handleDragStart(index)}
              onDragEnd={handleDragEnd}
            />
          </div>
        );
      })}

      {/* Add stop button */}
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={openAddStopDialog}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Stop
      </Button>
    </div>
  );
}
