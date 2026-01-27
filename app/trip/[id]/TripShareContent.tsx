'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MapPin,
  Clock,
  Calendar,
  Car,
  Footprints,
  Bike,
  Route,
  FileText,
  Globe,
  FileJson,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { downloadFile, generateFilename } from '@/lib/utils/export';
import { exportTripToGPX } from '@/lib/trips/export-gpx';
import { exportTripToKML } from '@/lib/trips/export-kml';
import {
  type TripWithStops,
  formatDistance,
  formatDuration,
  calculateTripSummary,
} from '@/src/types/trips.types';

interface TripShareContentProps {
  trip: TripWithStops;
}

const transportIcons = {
  driving: Car,
  walking: Footprints,
  cycling: Bike,
};

const transportLabels = {
  driving: 'Driving',
  walking: 'Walking',
  cycling: 'Cycling',
};

function exportTripToJSON(trip: TripWithStops): string {
  return JSON.stringify({
    version: '1.0',
    exported_at: new Date().toISOString(),
    app: 'PhotoScout',
    type: 'trip',
    trip: {
      id: trip.id,
      name: trip.name,
      description: trip.description,
      trip_date: trip.trip_date,
      start_time: trip.start_time,
      transport_mode: trip.transport_mode,
      total_distance_meters: trip.total_distance_meters,
      total_duration_seconds: trip.total_duration_seconds,
      is_optimized: trip.is_optimized,
      stops: trip.stops.map((stop) => ({
        display_name: stop.display_name,
        coordinates: stop.coordinates,
        stop_order: stop.stop_order,
        planned_arrival: stop.planned_arrival,
        planned_duration_minutes: stop.planned_duration_minutes,
        notes: stop.notes,
        distance_to_next_meters: stop.distance_to_next_meters,
        duration_to_next_seconds: stop.duration_to_next_seconds,
      })),
    },
  }, null, 2);
}

export function TripShareContent({ trip }: TripShareContentProps) {
  const summary = calculateTripSummary(trip);
  const TransportIcon = transportIcons[trip.transport_mode] || Car;
  const sortedStops = [...trip.stops].sort((a, b) => a.stop_order - b.stop_order);
  const slug = trip.name.replace(/\s+/g, '-').toLowerCase();

  const handleExportGPX = () => {
    const gpx = exportTripToGPX(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'gpx');
    downloadFile(gpx, filename, 'application/gpx+xml');
    toast.success('Downloaded GPX file');
  };

  const handleExportKML = () => {
    const kml = exportTripToKML(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'kml');
    downloadFile(kml, filename, 'application/vnd.google-earth.kml+xml');
    toast.success('Downloaded KML file');
  };

  const handleExportJSON = () => {
    const json = exportTripToJSON(trip);
    const filename = generateFilename(`photoscout-trip-${slug}`, 'json');
    downloadFile(json, filename, 'application/json');
    toast.success('Downloaded JSON file');
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to PhotoScout
      </Link>

      {/* Trip Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Route className="h-5 w-5 text-primary" />
                {trip.name}
              </CardTitle>
              {trip.description && (
                <p className="text-sm text-muted-foreground">{trip.description}</p>
              )}
            </div>
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium shrink-0">
              <TransportIcon className="h-3 w-3 mr-1" />
              {transportLabels[trip.transport_mode]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {trip.trip_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {trip.trip_date}
              </span>
            )}
            {trip.start_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {trip.start_time.slice(0, 5)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {summary.total_stops} stops
            </span>
            {summary.total_distance_km > 0 && (
              <span>{summary.total_distance_km} km total</span>
            )}
            {summary.total_travel_time_minutes > 0 && (
              <span>{formatDuration(summary.total_travel_time_minutes * 60)} travel</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stops List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stops</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedStops.map((stop, index) => (
            <div key={stop.id} className="flex gap-3">
              {/* Number indicator */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                  {index + 1}
                </div>
                {index < sortedStops.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Stop details */}
              <div className="flex-1 pb-4">
                <p className="font-medium">{stop.display_name}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{stop.coordinates.lat.toFixed(5)}, {stop.coordinates.lng.toFixed(5)}</span>
                  <span>{stop.planned_duration_minutes} min</span>
                  {stop.planned_arrival && (
                    <span>Arrive: {stop.planned_arrival.slice(0, 5)}</span>
                  )}
                </div>
                {stop.notes && (
                  <p className="text-sm text-muted-foreground mt-1">{stop.notes}</p>
                )}
                {stop.distance_to_next_meters != null && stop.distance_to_next_meters > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Next: {formatDistance(stop.distance_to_next_meters)}
                    {stop.duration_to_next_seconds != null && (
                      <> ({formatDuration(stop.duration_to_next_seconds)})</>
                    )}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Trip</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={handleExportGPX}>
              <FileText className="h-4 w-4 mr-2" />
              GPX
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportKML}>
              <Globe className="h-4 w-4 mr-2" />
              KML
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <FileJson className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            GPX &amp; KML files can be imported into GPS devices, Google Earth, and mapping apps.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
