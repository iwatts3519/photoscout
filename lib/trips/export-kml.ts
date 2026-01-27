/**
 * Export trip as KML format (Google Earth / Google Maps)
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

export function exportTripToKML(trip: TripWithStops): string {
  const sortedStops = [...trip.stops].sort((a, b) => a.stop_order - b.stop_order);

  // Build placemarks for each stop
  const placemarks = sortedStops.map((stop, index) => {
    const desc = [
      stop.notes,
      `Duration: ${stop.planned_duration_minutes} min`,
      stop.planned_arrival ? `Arrival: ${stop.planned_arrival}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return `      <Placemark>
        <name>${escapeXml(`${index + 1}. ${stop.display_name}`)}</name>
        <description>${escapeXml(desc)}</description>
        <styleUrl>#stop-style</styleUrl>
        <Point>
          <coordinates>${stop.coordinates.lng},${stop.coordinates.lat},0</coordinates>
        </Point>
      </Placemark>`;
  });

  // Build route line from route_geometry
  const routeCoords: string[] = [];
  for (const stop of sortedStops) {
    if (stop.route_geometry?.coordinates) {
      for (const coord of stop.route_geometry.coordinates) {
        // route_geometry coordinates are [lng, lat]
        routeCoords.push(`${coord[0]},${coord[1]},0`);
      }
    }
  }

  const routePlacemark = routeCoords.length > 0
    ? `      <Placemark>
        <name>${escapeXml(trip.name)} Route</name>
        <styleUrl>#route-style</styleUrl>
        <LineString>
          <tessellate>1</tessellate>
          <coordinates>
            ${routeCoords.join('\n            ')}
          </coordinates>
        </LineString>
      </Placemark>`
    : '';

  const tripDate = trip.trip_date || new Date().toISOString().slice(0, 10);
  const description = [
    trip.description,
    `Date: ${tripDate}`,
    `Transport: ${trip.transport_mode}`,
    `Stops: ${sortedStops.length}`,
  ]
    .filter(Boolean)
    .join(' | ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(trip.name)}</name>
    <description>${escapeXml(description)}</description>
    <Style id="stop-style">
      <IconStyle>
        <color>ff4488ff</color>
        <scale>1.2</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="route-style">
      <LineStyle>
        <color>ff4488ff</color>
        <width>3</width>
      </LineStyle>
    </Style>
    <Folder>
      <name>Stops</name>
${placemarks.join('\n')}
    </Folder>
${routePlacemark ? `    <Folder>\n      <name>Route</name>\n${routePlacemark}\n    </Folder>` : ''}
  </Document>
</kml>`;
}
