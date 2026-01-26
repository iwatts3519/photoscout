'use client';

import { useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { uploadPhoto, validateFile, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/lib/supabase/storage';
import { parseExifData, getImageDimensions, createPreview, revokePreview } from '@/lib/photos/exif-parser';
import { createPhotoAction } from '@/app/actions/photos';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import type { UploadQueueItem, UserPhotoWithLocation } from '@/src/types/photo.types';

export interface UsePhotoUploadReturn {
  addFiles: (files: File[]) => Promise<void>;
  uploadAll: () => Promise<void>;
  retryUpload: (itemId: string) => Promise<void>;
  removeFromQueue: (itemId: string) => void;
  clearCompleted: () => void;
  isUploading: boolean;
  queue: UploadQueueItem[];
  pendingCount: number;
  completedCount: number;
  errorCount: number;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const supabaseRef = useRef(createClient());
  const uploadingRef = useRef(false);

  const {
    uploadQueue,
    isUploading,
    addToUploadQueue,
    updateUploadItem,
    removeFromUploadQueue,
    clearUploadQueue,
    setIsUploading,
    addPhoto,
    updateStorageUsage,
  } = usePhotoLibraryStore();

  /**
   * Add files to the upload queue
   */
  const addFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          const queueItem: UploadQueueItem = {
            id: crypto.randomUUID(),
            file,
            status: 'error',
            progress: 0,
            error: validationError.message,
            exif: null,
            preview: null,
            result: null,
          };
          addToUploadQueue(queueItem);
          continue;
        }

        // Create preview
        const preview = createPreview(file);

        // Create initial queue item
        const queueItem: UploadQueueItem = {
          id: crypto.randomUUID(),
          file,
          status: 'pending',
          progress: 0,
          error: null,
          exif: null,
          preview,
          result: null,
        };
        addToUploadQueue(queueItem);

        // Parse EXIF data in background
        parseExifData(file).then((exif) => {
          updateUploadItem(queueItem.id, { exif });
        });
      }
    },
    [addToUploadQueue, updateUploadItem]
  );

  /**
   * Upload a single file
   */
  const uploadSingleFile = useCallback(
    async (item: UploadQueueItem): Promise<void> => {
      const supabase = supabaseRef.current;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        updateUploadItem(item.id, {
          status: 'error',
          error: 'You must be signed in to upload photos',
        });
        return;
      }

      // Update status to uploading
      updateUploadItem(item.id, { status: 'uploading', progress: 10 });

      // Get EXIF data if not already parsed
      let exif = item.exif;
      if (!exif) {
        exif = await parseExifData(item.file);
        updateUploadItem(item.id, { exif, progress: 20 });
      } else {
        updateUploadItem(item.id, { progress: 20 });
      }

      // Get image dimensions if not in EXIF
      let width = exif.width;
      let height = exif.height;
      if (!width || !height) {
        const dimensions = await getImageDimensions(item.file);
        if (dimensions) {
          width = dimensions.width;
          height = dimensions.height;
        }
      }
      updateUploadItem(item.id, { progress: 30 });

      // Upload to storage
      const { data: uploadResult, error: uploadError } = await uploadPhoto(
        supabase,
        user.id,
        item.file
      );

      if (uploadError || !uploadResult) {
        updateUploadItem(item.id, {
          status: 'error',
          error: uploadError?.message || 'Upload failed',
        });
        return;
      }

      updateUploadItem(item.id, { status: 'processing', progress: 70 });

      // Create database record
      const { data: photo, error: recordError } = await createPhotoAction({
        storage_path: uploadResult.storagePath,
        filename: uploadResult.filename,
        original_filename: item.file.name,
        file_size: item.file.size,
        mime_type: item.file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        width,
        height,
        exif_data: exif.raw,
        taken_at: exif.dateTimeOriginal?.toISOString() || null,
        camera_make: exif.camera?.make || null,
        camera_model: exif.camera?.model || null,
        focal_length: exif.settings?.focalLength || null,
        aperture: exif.settings?.aperture || null,
        shutter_speed: exif.settings?.shutterSpeed || null,
        iso: exif.settings?.iso || null,
        exif_latitude: exif.gps?.latitude || null,
        exif_longitude: exif.gps?.longitude || null,
      });

      if (recordError || !photo) {
        updateUploadItem(item.id, {
          status: 'error',
          error: recordError || 'Failed to save photo record',
        });
        return;
      }

      // Success!
      updateUploadItem(item.id, {
        status: 'completed',
        progress: 100,
        result: photo,
      });

      // Add to photo library
      const photoWithLocation: UserPhotoWithLocation = {
        ...photo,
        location_name: null,
      };
      addPhoto(photoWithLocation);

      // Update storage usage
      updateStorageUsage(item.file.size);

      // Revoke preview URL to free memory
      if (item.preview) {
        revokePreview(item.preview);
      }
    },
    [updateUploadItem, addPhoto, updateStorageUsage]
  );

  /**
   * Upload all pending files
   */
  const uploadAll = useCallback(async () => {
    if (uploadingRef.current) return;

    const pendingItems = uploadQueue.filter((item) => item.status === 'pending');
    if (pendingItems.length === 0) return;

    uploadingRef.current = true;
    setIsUploading(true);

    // Upload sequentially to avoid overwhelming the server
    for (const item of pendingItems) {
      // Re-check if still pending (could have been removed)
      const currentQueue = usePhotoLibraryStore.getState().uploadQueue;
      const currentItem = currentQueue.find((q) => q.id === item.id);
      if (!currentItem || currentItem.status !== 'pending') continue;

      await uploadSingleFile(currentItem);
    }

    uploadingRef.current = false;
    setIsUploading(false);
  }, [uploadQueue, uploadSingleFile, setIsUploading]);

  /**
   * Retry a failed upload
   */
  const retryUpload = useCallback(
    async (itemId: string) => {
      const item = uploadQueue.find((q) => q.id === itemId);
      if (!item || item.status !== 'error') return;

      updateUploadItem(itemId, {
        status: 'pending',
        progress: 0,
        error: null,
      });

      await uploadSingleFile(item);
    },
    [uploadQueue, updateUploadItem, uploadSingleFile]
  );

  /**
   * Remove an item from the queue
   */
  const removeFromQueue = useCallback(
    (itemId: string) => {
      const item = uploadQueue.find((q) => q.id === itemId);
      if (item?.preview) {
        revokePreview(item.preview);
      }
      removeFromUploadQueue(itemId);
    },
    [uploadQueue, removeFromUploadQueue]
  );

  /**
   * Clear completed uploads from the queue
   */
  const clearCompleted = useCallback(() => {
    const completed = uploadQueue.filter((item) => item.status === 'completed');
    for (const item of completed) {
      if (item.preview) {
        revokePreview(item.preview);
      }
    }
    // Remove only completed items
    const remaining = uploadQueue.filter((item) => item.status !== 'completed');
    if (remaining.length === 0) {
      clearUploadQueue();
    } else {
      // Remove each completed item individually
      for (const item of completed) {
        removeFromUploadQueue(item.id);
      }
    }
  }, [uploadQueue, clearUploadQueue, removeFromUploadQueue]);

  // Calculate counts
  const pendingCount = uploadQueue.filter((item) => item.status === 'pending').length;
  const completedCount = uploadQueue.filter((item) => item.status === 'completed').length;
  const errorCount = uploadQueue.filter((item) => item.status === 'error').length;

  return {
    addFiles,
    uploadAll,
    retryUpload,
    removeFromQueue,
    clearCompleted,
    isUploading,
    queue: uploadQueue,
    pendingCount,
    completedCount,
    errorCount,
  };
}

// Export constants for use in components
export { MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
