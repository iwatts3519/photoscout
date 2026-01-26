import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';

// Storage bucket name
export const PHOTO_BUCKET = 'user-photos';

// Storage limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const USER_STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB per user
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

// Signed URL expiry (1 year in seconds)
const SIGNED_URL_EXPIRY = 365 * 24 * 60 * 60;

export interface UploadResult {
  storagePath: string;
  filename: string;
  signedUrl: string;
}

export interface StorageError {
  code: 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'QUOTA_EXCEEDED' | 'UPLOAD_FAILED' | 'DELETE_FAILED';
  message: string;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): StorageError | null {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(MAX_FILE_SIZE)})`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      code: 'INVALID_TYPE',
      message: `File type "${file.type}" is not supported. Allowed types: JPEG, PNG, WebP`,
    };
  }

  return null;
}

/**
 * Generate unique storage path for a file
 */
export function generateStoragePath(userId: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
  const uniqueId = crypto.randomUUID();
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50);

  // Structure: user_id/year/month/unique_id_filename.ext
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${userId}/${year}/${month}/${uniqueId}_${sanitizedFilename}.${ext}`;
}

/**
 * Check if user has enough storage quota
 */
export async function checkStorageQuota(
  supabase: SupabaseClient<Database>,
  userId: string,
  additionalBytes: number
): Promise<{ hasQuota: boolean; currentUsage: number; limit: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_user_storage_usage', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error checking storage quota:', error);
    // On error, assume user has quota to avoid blocking uploads
    return { hasQuota: true, currentUsage: 0, limit: USER_STORAGE_LIMIT };
  }

  const currentUsage = Number(data) || 0;
  const hasQuota = currentUsage + additionalBytes <= USER_STORAGE_LIMIT;

  return { hasQuota, currentUsage, limit: USER_STORAGE_LIMIT };
}

/**
 * Upload a file to storage
 */
export async function uploadPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  file: File
): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  // Validate file
  const validationError = validateFile(file);
  if (validationError) {
    return { data: null, error: validationError };
  }

  // Check quota
  const quotaCheck = await checkStorageQuota(supabase, userId, file.size);
  if (!quotaCheck.hasQuota) {
    return {
      data: null,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: `Storage quota exceeded. Using ${formatFileSize(quotaCheck.currentUsage)} of ${formatFileSize(quotaCheck.limit)}. Free up space to upload more photos.`,
      },
    };
  }

  // Generate storage path
  const storagePath = generateStoragePath(userId, file.name);
  const filename = storagePath.split('/').pop() || file.name;

  // Upload file
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return {
      data: null,
      error: {
        code: 'UPLOAD_FAILED',
        message: uploadError.message || 'Failed to upload photo',
      },
    };
  }

  // Get signed URL
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

  if (signedUrlError || !signedUrlData) {
    console.error('Signed URL error:', signedUrlError);
    // Upload succeeded but couldn't get URL - still return success
    return {
      data: {
        storagePath,
        filename,
        signedUrl: '',
      },
      error: null,
    };
  }

  return {
    data: {
      storagePath,
      filename,
      signedUrl: signedUrlData.signedUrl,
    },
    error: null,
  };
}

/**
 * Delete a photo from storage
 */
export async function deletePhoto(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<{ success: boolean; error: StorageError | null }> {
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('Storage delete error:', error);
    return {
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message || 'Failed to delete photo',
      },
    };
  }

  return { success: true, error: null };
}

/**
 * Get a signed URL for a photo
 */
export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);

  if (error || !data) {
    console.error('Error getting signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Get signed URLs for multiple photos
 */
export async function getSignedUrls(
  supabase: SupabaseClient<Database>,
  storagePaths: string[]
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();

  if (storagePaths.length === 0) {
    return urlMap;
  }

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_EXPIRY);

  if (error || !data) {
    console.error('Error getting signed URLs:', error);
    return urlMap;
  }

  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl);
    }
  }

  return urlMap;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
