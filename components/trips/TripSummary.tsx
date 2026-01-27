'use client';

import { useMemo } from 'react';
import { MapPin, Clock, Route, Camera } from 'lucide-react';
import { useTripStops, useRouteCalculation, useCurrentTrip } from '@/src/stores/tripPlannerStore';
import { formatDuration, formatDistance } from '@/src/types/trips.types';

export function TripSummary() {
  const currentTrip = useCurrentTrip();
  const stops = useTripStops();
  const routeCalculation = useRouteCalculation();

  const summary = useMemo(() => {
    const stopCount = stops.length;

    // Calculate shooting time (sum of planned durations)
    const shootingTimeMinutes = stops.reduce(
      (sum, stop) => sum + (stop.planned_duration_minutes || 0),
      0
    );

    // Use route calculation if available, otherwise show placeholders
    const totalDistanceMeters = routeCalculation?.total_distance_meters ?? 0;
    const totalTravelSeconds = routeCalculation?.total_duration_seconds ?? 0;

    // Calculate estimated end time if we have start time
    let estimatedEndTime: string | null = null;
    if (currentTrip?.start_time && (totalTravelSeconds > 0 || shootingTimeMinutes > 0)) {
      const [hours, minutes] = currentTrip.start_time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const totalMinutes = startMinutes + Math.round(totalTravelSeconds / 60) + shootingTimeMinutes;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMins = totalMinutes % 60;
      estimatedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    return {
      stopCount,
      shootingTimeMinutes,
      totalDistanceMeters,
      totalTravelSeconds,
      estimatedEndTime,
      hasRoute: routeCalculation !== null,
    };
  }, [stops, routeCalculation, currentTrip?.start_time]);

  if (stops.length === 0) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <h3 className="font-medium mb-3 text-sm">Trip Summary</h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Stop count */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{summary.stopCount}</div>
            <div className="text-xs text-muted-foreground">
              {summary.stopCount === 1 ? 'Stop' : 'Stops'}
            </div>
          </div>
        </div>

        {/* Total distance */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Route className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <div className="font-medium">
              {summary.hasRoute
                ? formatDistance(summary.totalDistanceMeters)
                : '-- km'}
            </div>
            <div className="text-xs text-muted-foreground">Distance</div>
          </div>
        </div>

        {/* Travel time */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
          <div>
            <div className="font-medium">
              {summary.hasRoute
                ? formatDuration(summary.totalTravelSeconds)
                : '-- min'}
            </div>
            <div className="text-xs text-muted-foreground">Travel Time</div>
          </div>
        </div>

        {/* Shooting time */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <Camera className="h-4 w-4 text-green-500" />
          </div>
          <div>
            <div className="font-medium">
              {formatDuration(summary.shootingTimeMinutes * 60)}
            </div>
            <div className="text-xs text-muted-foreground">Shooting Time</div>
          </div>
        </div>
      </div>

      {/* Estimated end time */}
      {summary.estimatedEndTime && (
        <div className="mt-3 pt-3 border-t text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>
              Start: {currentTrip?.start_time?.slice(0, 5) || '--:--'}
            </span>
            <span>
              Est. End: {summary.estimatedEndTime}
            </span>
          </div>
        </div>
      )}

      {/* No route warning */}
      {!summary.hasRoute && stops.length >= 2 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Calculate route to see distance and travel time
          </p>
        </div>
      )}
    </div>
  );
}
