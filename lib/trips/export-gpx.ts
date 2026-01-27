/**
 * Export trip as GPX 1.1 XML format
 * GPX is a standard GPS exchange format supported by most GPS devices and mapping apps
 */

import type { TripWithStops } from '@/src/types/trips.types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportTripToGPX(trip: TripWithStops): string {
  const sortedStops = [...trip.stops].sort((a, b) => a.stop_order - b.stop_order);

  // Build waypoints for each stop
  const waypoints = sortedStops.map((stop) => {
    const desc = [
      stop.notes,
      `Duration: ${stop.planned_duration_minutes} min`,
      stop.planned_arrival ? `Arrival: ${stop.planned_arrival}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return `  <wpt lat="${stop.coordinates.lat}" lon="${stop.coordinates.lng}">
    <name>${escapeXml(stop.display_name)}</name>
    <desc>${escapeXml(desc)}</desc>
    <type>Photography Stop</type>
  </wpt>`;
  });

  // Build route track from route_geometry of each stop
  const trackPoints: string[] = [];
  for (const stop of sortedStops) {
    if (stop.route_geometry?.coordinates) {
      for (const coord of stop.route_geometry.coordinates) {
        // route_geometry coordinates are [lng, lat]
        trackPoints.push(`      <trkpt lat="${coord[1]}" lon="${coord[0]}"></trkpt>`);
      }
    }
  }

  const trackSection = trackPoints.length > 0
    ? `  <trk>
    <name>${escapeXml(trip.name)} Route</name>
    <trkseg>
${trackPoints.join('\n')}
    </trkseg>
  </trk>`
    : '';

  const tripDate = trip.trip_date || new Date().toISOString().slice(0, 10);
  const metaDesc = [
    trip.description,
    `Date: ${tripDate}`,
    `Transport: ${trip.transport_mode}`,
    `Stops: ${sortedStops.length}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PhotoScout"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(trip.name)}</name>
    <desc>${escapeXml(metaDesc)}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
${waypoints.join('\n')}
${trackSection}
</gpx>`;
}
