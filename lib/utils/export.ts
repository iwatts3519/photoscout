/**
 * Export utilities for PhotoScout locations
 * Supports JSON and GPX export formats
 */

import type { SavedLocation } from '@/src/stores/locationStore';

// Types for export data
export interface ExportLocation {
  id: string;
  name: string;
  description: string | null;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius_meters: number | null;
  tags: string[] | null;
  notes: string | null;
  best_time_to_visit: string | null;
  last_visited: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PhotoScoutExport {
  version: '1.0';
  exported_at: string;
  app: 'PhotoScout';
  total_locations: number;
  locations: ExportLocation[];
}

// Helper to parse coordinates from various formats
function parseCoordinates(coords: unknown): { lat: number; lng: number } | null {
  if (typeof coords === 'string') {
    // Format: "POINT(lng lat)" or "(lng,lat)"
    const match = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2]),
      };
    }
  }

  if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return coords as { lat: number; lng: number };
  }

  return null;
}

// Transform SavedLocation to ExportLocation
function toExportLocation(location: SavedLocation): ExportLocation | null {
  const coords = parseCoordinates(location.coordinates);
  if (!coords) return null;

  return {
    id: location.id,
    name: location.name,
    description: location.description,
    coordinates: coords,
    radius_meters: location.radius_meters,
    tags: location.tags,
    notes: location.notes ?? null,
    best_time_to_visit: location.best_time_to_visit ?? null,
    last_visited: location.last_visited ?? null,
    created_at: location.created_at,
    updated_at: location.updated_at,
  };
}

/**
 * Export locations to JSON format
 */
export function exportToJSON(locations: SavedLocation[]): string {
  const exportLocations = locations
    .map(toExportLocation)
    .filter((loc): loc is ExportLocation => loc !== null);

  const exportData: PhotoScoutExport = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    app: 'PhotoScout',
    total_locations: exportLocations.length,
    locations: exportLocations,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export a single location to JSON format
 */
export function exportSingleToJSON(location: SavedLocation): string {
  const exportLocation = toExportLocation(location);
  if (!exportLocation) return '';

  const exportData: PhotoScoutExport = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    app: 'PhotoScout',
    total_locations: 1,
    locations: [exportLocation],
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export locations to GPX format
 * GPX is a standard GPS exchange format that can be imported into
 * most GPS devices and mapping applications
 */
export function exportToGPX(locations: SavedLocation[]): string {
  const exportLocations = locations
    .map(toExportLocation)
    .filter((loc): loc is ExportLocation => loc !== null);

  const waypoints = exportLocations.map((location) => {
    const desc = [
      location.description,
      location.best_time_to_visit ? `Best time: ${location.best_time_to_visit}` : null,
      location.notes,
      location.tags?.length ? `Tags: ${location.tags.join(', ')}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return `    <wpt lat="${location.coordinates.lat}" lon="${location.coordinates.lng}">
      <name>${escapeXml(location.name)}</name>
      <desc>${escapeXml(desc)}</desc>
      <time>${location.created_at || new Date().toISOString()}</time>
    </wpt>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="PhotoScout"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>PhotoScout Locations</name>
    <desc>Photography locations exported from PhotoScout</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
${waypoints.join('\n')}
</gpx>`;
}

/**
 * Export a single location to GPX format
 */
export function exportSingleToGPX(location: SavedLocation): string {
  return exportToGPX([location]);
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate a shareable URL for a location
 */
export function generateShareUrl(lat: number, lng: number, name?: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    lat: lat.toFixed(6),
    lng: lng.toFixed(6),
  });
  if (name) {
    params.set('name', name);
  }
  return `${baseUrl}/share?${params.toString()}`;
}

/**
 * Generate a Google Maps link for a location
 */
export function generateGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Generate an OpenStreetMap link for a location
 */
export function generateOSMUrl(lat: number, lng: number, zoom: number = 15): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;
}

/**
 * Format coordinates as a string
 */
export function formatCoordinates(lat: number, lng: number, format: 'decimal' | 'dms' = 'decimal'): string {
  if (format === 'decimal') {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }

  // DMS format (degrees, minutes, seconds)
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  const formatDMS = (decimal: number): string => {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutesDecimal = (abs - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);
    return `${degrees}° ${minutes}' ${seconds}"`;
  };

  return `${formatDMS(lat)} ${latDir}, ${formatDMS(lng)} ${lngDir}`;
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch {
      return false;
    }
  }
}

/**
 * Generate a filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const date = new Date();
  const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}-${timestamp}.${extension}`;
}
