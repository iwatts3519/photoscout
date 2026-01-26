import { z } from 'zod';

// =============================================================================
// Photo Sort Options
// =============================================================================

export const PHOTO_SORT_OPTIONS = ['created_at', 'taken_at', 'filename'] as const;
export type PhotoSortOption = (typeof PHOTO_SORT_OPTIONS)[number];

export const photoSortLabels: Record<PhotoSortOption, string> = {
  created_at: 'Date Uploaded',
  taken_at: 'Date Taken',
  filename: 'Filename',
};

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

// =============================================================================
// Upload Status
// =============================================================================

export const UPLOAD_STATUSES = ['pending', 'uploading', 'processing', 'completed', 'error'] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

// =============================================================================
// EXIF Data Types
// =============================================================================

export interface ExifGpsData {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface ExifCameraData {
  make: string | null;
  model: string | null;
  lens?: string | null;
}

export interface ExifSettingsData {
  focalLength: string | null;
  aperture: string | null;
  shutterSpeed: string | null;
  iso: number | null;
}

export interface ExifData {
  // GPS data
  gps: ExifGpsData | null;

  // Camera info
  camera: ExifCameraData | null;

  // Settings
  settings: ExifSettingsData | null;

  // Date/Time
  dateTimeOriginal: Date | null;

  // Image dimensions
  width: number | null;
  height: number | null;
  orientation: number | null;

  // Raw EXIF data (for storage)
  raw: Record<string, unknown>;
}

// =============================================================================
// User Photo Types
// =============================================================================

export interface UserPhoto {
  id: string;
  user_id: string;
  location_id: string | null;
  storage_path: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  exif_data: Record<string, unknown> | null;
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  focal_length: string | null;
  aperture: string | null;
  shutter_speed: string | null;
  iso: number | null;
  exif_latitude: number | null;
  exif_longitude: number | null;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPhotoWithUrl extends UserPhoto {
  signedUrl: string;
}

export interface UserPhotoWithLocation extends UserPhoto {
  location_name: string | null;
}

export interface UserPhotoWithUrlAndLocation extends UserPhotoWithUrl {
  location_name: string | null;
}

// =============================================================================
// Upload Queue Item
// =============================================================================

export interface UploadQueueItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error: string | null;
  exif: ExifData | null;
  preview: string | null;
  result: UserPhoto | null;
}

// =============================================================================
// Photo Filters
// =============================================================================

export interface PhotoFilters {
  sortBy: PhotoSortOption;
  sortOrder: SortOrder;
  locationId: string | null;
  tags: string[];
}

export const defaultPhotoFilters: PhotoFilters = {
  sortBy: 'created_at',
  sortOrder: 'desc',
  locationId: null,
  tags: [],
};

// =============================================================================
// Location Photo Count
// =============================================================================

export interface LocationPhotoCount {
  location_id: string;
  photo_count: number;
}

// =============================================================================
// Storage Usage
// =============================================================================

export interface StorageUsage {
  used: number;
  limit: number;
  percentage: number;
}

// =============================================================================
// Zod Schemas
// =============================================================================

export const photoSortOptionSchema = z.enum(PHOTO_SORT_OPTIONS);
export const sortOrderSchema = z.enum(SORT_ORDERS);

export const createPhotoSchema = z.object({
  storage_path: z.string().min(1),
  filename: z.string().min(1),
  original_filename: z.string().min(1),
  file_size: z.number().positive(),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  width: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  exif_data: z.record(z.string(), z.unknown()).nullable().optional(),
  taken_at: z.string().datetime().nullable().optional(),
  camera_make: z.string().nullable().optional(),
  camera_model: z.string().nullable().optional(),
  focal_length: z.string().nullable().optional(),
  aperture: z.string().nullable().optional(),
  shutter_speed: z.string().nullable().optional(),
  iso: z.number().positive().nullable().optional(),
  exif_latitude: z.number().min(-90).max(90).nullable().optional(),
  exif_longitude: z.number().min(-180).max(180).nullable().optional(),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
  is_public: z.boolean().optional().default(false),
  location_id: z.string().uuid().nullable().optional(),
});

export const updatePhotoSchema = z.object({
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).nullable().optional(),
  is_public: z.boolean().optional(),
  location_id: z.string().uuid().nullable().optional(),
});

export const photoFiltersSchema = z.object({
  sortBy: photoSortOptionSchema.default('created_at'),
  sortOrder: sortOrderSchema.default('desc'),
  locationId: z.string().uuid().nullable().default(null),
  tags: z.array(z.string()).default([]),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// =============================================================================
// Type Guards
// =============================================================================

export function isPhotoSortOption(value: unknown): value is PhotoSortOption {
  return typeof value === 'string' && PHOTO_SORT_OPTIONS.includes(value as PhotoSortOption);
}

export function isSortOrder(value: unknown): value is SortOrder {
  return typeof value === 'string' && SORT_ORDERS.includes(value as SortOrder);
}

export function isUploadStatus(value: unknown): value is UploadStatus {
  return typeof value === 'string' && UPLOAD_STATUSES.includes(value as UploadStatus);
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get display name for camera (make + model)
 */
export function getCameraDisplayName(photo: UserPhoto): string | null {
  if (!photo.camera_make && !photo.camera_model) {
    return null;
  }

  const make = photo.camera_make?.trim() || '';
  const model = photo.camera_model?.trim() || '';

  // If model already includes make, just return model
  if (model && make && model.toLowerCase().startsWith(make.toLowerCase())) {
    return model;
  }

  return [make, model].filter(Boolean).join(' ') || null;
}

/**
 * Get formatted camera settings string
 */
export function getSettingsString(photo: UserPhoto): string | null {
  const parts: string[] = [];

  if (photo.focal_length) {
    parts.push(photo.focal_length);
  }
  if (photo.aperture) {
    parts.push(photo.aperture);
  }
  if (photo.shutter_speed) {
    parts.push(photo.shutter_speed);
  }
  if (photo.iso) {
    parts.push(`ISO ${photo.iso}`);
  }

  return parts.length > 0 ? parts.join(' | ') : null;
}

/**
 * Format date taken for display
 */
export function formatDateTaken(photo: UserPhoto): string | null {
  if (!photo.taken_at) return null;

  const date = new Date(photo.taken_at);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Check if photo has GPS coordinates
 */
export function hasGpsCoordinates(photo: UserPhoto): boolean {
  return photo.exif_latitude !== null && photo.exif_longitude !== null;
}
