import exifr from 'exifr';
import type { ExifData, ExifGpsData, ExifCameraData, ExifSettingsData } from '@/src/types/photo.types';

/**
 * Parse EXIF data from a File object
 */
export async function parseExifData(file: File): Promise<ExifData> {
  try {
    // Parse with basic options - exifr will extract GPS, EXIF, and TIFF data
    const rawExif = await exifr.parse(file, true);

    if (!rawExif) {
      return createEmptyExifData();
    }

    // Extract GPS data
    const gps = extractGpsData(rawExif);

    // Extract camera data
    const camera = extractCameraData(rawExif);

    // Extract settings data
    const settings = extractSettingsData(rawExif);

    // Extract date
    const dateTimeOriginal = extractDateTime(rawExif);

    // Extract dimensions
    const { width, height } = extractDimensions(rawExif);
    const orientation = rawExif.Orientation || null;

    return {
      gps,
      camera,
      settings,
      dateTimeOriginal,
      width,
      height,
      orientation,
      raw: sanitizeRawExif(rawExif),
    };
  } catch (error) {
    console.error('Error parsing EXIF data:', error);
    return createEmptyExifData();
  }
}

/**
 * Create empty EXIF data structure
 */
function createEmptyExifData(): ExifData {
  return {
    gps: null,
    camera: null,
    settings: null,
    dateTimeOriginal: null,
    width: null,
    height: null,
    orientation: null,
    raw: {},
  };
}

/**
 * Extract GPS data from raw EXIF
 */
function extractGpsData(rawExif: Record<string, unknown>): ExifGpsData | null {
  const lat = rawExif.latitude;
  const lng = rawExif.longitude;

  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      latitude: lat,
      longitude: lng,
      altitude: typeof rawExif.GPSAltitude === 'number' ? rawExif.GPSAltitude : undefined,
    };
  }

  return null;
}

/**
 * Extract camera data from raw EXIF
 */
function extractCameraData(rawExif: Record<string, unknown>): ExifCameraData | null {
  const make = typeof rawExif.Make === 'string' ? rawExif.Make.trim() : null;
  const model = typeof rawExif.Model === 'string' ? rawExif.Model.trim() : null;
  const lens = typeof rawExif.LensModel === 'string' ? rawExif.LensModel.trim() : null;

  if (!make && !model) {
    return null;
  }

  return { make, model, lens };
}

/**
 * Extract camera settings from raw EXIF
 */
function extractSettingsData(rawExif: Record<string, unknown>): ExifSettingsData | null {
  const focalLength = formatFocalLength(rawExif.FocalLength);
  const aperture = formatAperture(rawExif.FNumber);
  const shutterSpeed = formatShutterSpeed(rawExif.ExposureTime);
  const iso = extractISO(rawExif);

  if (!focalLength && !aperture && !shutterSpeed && iso === null) {
    return null;
  }

  return { focalLength, aperture, shutterSpeed, iso };
}

/**
 * Extract date/time from raw EXIF
 */
function extractDateTime(rawExif: Record<string, unknown>): Date | null {
  // Try DateTimeOriginal first, then CreateDate
  const dateValue = rawExif.DateTimeOriginal || rawExif.CreateDate;

  if (!dateValue) {
    return null;
  }

  // exifr usually returns a Date object already
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }

  // If it's a string, try to parse it
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Extract image dimensions from raw EXIF
 */
function extractDimensions(rawExif: Record<string, unknown>): { width: number | null; height: number | null } {
  // Try ExifImageWidth/Height first (more reliable)
  let width = rawExif.ExifImageWidth;
  let height = rawExif.ExifImageHeight;

  // Fallback to ImageWidth/Height
  if (!width || !height) {
    width = rawExif.ImageWidth;
    height = rawExif.ImageHeight;
  }

  return {
    width: typeof width === 'number' && width > 0 ? width : null,
    height: typeof height === 'number' && height > 0 ? height : null,
  };
}

/**
 * Format focal length for display (e.g., "50mm")
 */
export function formatFocalLength(value: unknown): string | null {
  if (typeof value !== 'number' || value <= 0) {
    return null;
  }

  // Round to sensible precision
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}mm`;
}

/**
 * Format aperture for display (e.g., "f/2.8")
 */
export function formatAperture(value: unknown): string | null {
  if (typeof value !== 'number' || value <= 0) {
    return null;
  }

  // Format with appropriate precision
  if (value % 1 === 0) {
    return `f/${value}`;
  }
  return `f/${value.toFixed(1)}`;
}

/**
 * Format shutter speed for display (e.g., "1/250s" or "2s")
 */
export function formatShutterSpeed(value: unknown): string | null {
  if (typeof value !== 'number' || value <= 0) {
    return null;
  }

  // For exposures >= 1 second, show as decimal/integer
  if (value >= 1) {
    if (value % 1 === 0) {
      return `${value}s`;
    }
    return `${value.toFixed(1)}s`;
  }

  // For exposures < 1 second, show as fraction
  const denominator = Math.round(1 / value);

  // Use common shutter speeds
  const commonSpeeds = [2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000, 8000];
  const closest = commonSpeeds.reduce((prev, curr) =>
    Math.abs(curr - denominator) < Math.abs(prev - denominator) ? curr : prev
  );

  // Use closest common speed if within 20%
  const useClosest = Math.abs(closest - denominator) / denominator < 0.2;
  const finalDenom = useClosest ? closest : denominator;

  return `1/${finalDenom}s`;
}

/**
 * Format ISO for display (e.g., "ISO 800")
 */
export function formatISO(value: unknown): string | null {
  const iso = extractISO({ ISOSpeedRatings: value, ISO: value });
  if (iso === null) {
    return null;
  }
  return `ISO ${iso}`;
}

/**
 * Extract ISO value from EXIF data
 */
function extractISO(rawExif: Record<string, unknown>): number | null {
  // Try ISOSpeedRatings first (can be number or array)
  const isoRatings = rawExif.ISOSpeedRatings;
  if (Array.isArray(isoRatings) && isoRatings.length > 0 && typeof isoRatings[0] === 'number') {
    return isoRatings[0];
  }
  if (typeof isoRatings === 'number' && isoRatings > 0) {
    return isoRatings;
  }

  // Fallback to ISO field
  const iso = rawExif.ISO;
  if (typeof iso === 'number' && iso > 0) {
    return iso;
  }

  return null;
}

/**
 * Get camera name combining make and model
 */
export function getCameraName(camera: ExifCameraData | null): string | null {
  if (!camera) {
    return null;
  }

  const { make, model } = camera;

  if (!make && !model) {
    return null;
  }

  if (!make) {
    return model;
  }

  if (!model) {
    return make;
  }

  // If model already includes make, just return model
  if (model.toLowerCase().startsWith(make.toLowerCase())) {
    return model;
  }

  return `${make} ${model}`;
}

/**
 * Get image dimensions from a File (client-side only)
 * Uses Image object to read actual dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Create object URL preview for a file
 */
export function createPreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Sanitize raw EXIF data for JSON storage
 * Removes undefined values and converts non-serializable types
 */
function sanitizeRawExif(rawExif: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawExif)) {
    // Skip undefined, functions, and problematic fields
    if (value === undefined || typeof value === 'function') {
      continue;
    }

    // Convert Date to ISO string
    if (value instanceof Date) {
      result[key] = value.toISOString();
      continue;
    }

    // Convert ArrayBuffer/TypedArray to null (not useful for display)
    if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item instanceof Date ? item.toISOString() : item
      );
      continue;
    }

    // Handle objects recursively
    if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeRawExif(value as Record<string, unknown>);
      continue;
    }

    result[key] = value;
  }

  return result;
}
