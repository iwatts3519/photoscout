'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createPhoto,
  getUserPhotos,
  countUserPhotos,
  updatePhoto,
  deletePhotoRecord,
  getPhotoById,
  getLocationPhotos,
  getLocationPhotoCounts,
  getStorageUsage,
  getUserPhotoTags,
  linkPhotoToLocation,
} from '@/lib/queries/photos';
import { deletePhoto } from '@/lib/supabase/storage';
import type {
  UserPhoto,
  UserPhotoWithLocation,
  LocationPhotoCount,
  PhotoFilters,
} from '@/src/types/photo.types';
import {
  createPhotoSchema,
  updatePhotoSchema,
  photoFiltersSchema,
} from '@/src/types/photo.types';
import { USER_STORAGE_LIMIT } from '@/lib/supabase/storage';

// =============================================================================
// Fetch User's Photos
// =============================================================================

export async function fetchUserPhotos(
  filters: Partial<PhotoFilters> & { limit?: number; offset?: number } = {}
): Promise<{
  data: { photos: UserPhotoWithLocation[]; total: number } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to view your photos',
      };
    }

    // Parse and validate filters
    const parsedFilters = photoFiltersSchema.safeParse(filters);
    if (!parsedFilters.success) {
      return {
        data: null,
        error: parsedFilters.error.issues[0].message,
      };
    }

    const { sortBy, sortOrder, locationId, tags, limit, offset } = parsedFilters.data;

    // Fetch photos and count in parallel
    const [photos, total] = await Promise.all([
      getUserPhotos(supabase, {
        sortBy,
        sortOrder,
        locationId,
        tags: tags.length > 0 ? tags : undefined,
        limit,
        offset,
      }),
      countUserPhotos(supabase, {
        locationId,
        tags: tags.length > 0 ? tags : undefined,
      }),
    ]);

    return {
      data: { photos, total },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user photos:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch photos',
    };
  }
}

// =============================================================================
// Create Photo Record (after successful storage upload)
// =============================================================================

export async function createPhotoAction(input: {
  storage_path: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
  width?: number | null;
  height?: number | null;
  exif_data?: Record<string, unknown> | null;
  taken_at?: string | null;
  camera_make?: string | null;
  camera_model?: string | null;
  focal_length?: string | null;
  aperture?: string | null;
  shutter_speed?: string | null;
  iso?: number | null;
  exif_latitude?: number | null;
  exif_longitude?: number | null;
  title?: string | null;
  description?: string | null;
  tags?: string[] | null;
  is_public?: boolean;
  location_id?: string | null;
}): Promise<{
  data: UserPhoto | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = createPhotoSchema.safeParse(input);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to upload photos',
      };
    }

    const photo = await createPhoto(supabase, {
      user_id: user.id,
      storage_path: result.data.storage_path,
      filename: result.data.filename,
      original_filename: result.data.original_filename,
      file_size: result.data.file_size,
      mime_type: result.data.mime_type,
      width: result.data.width ?? null,
      height: result.data.height ?? null,
      exif_data: result.data.exif_data ?? null,
      taken_at: result.data.taken_at ?? null,
      camera_make: result.data.camera_make ?? null,
      camera_model: result.data.camera_model ?? null,
      focal_length: result.data.focal_length ?? null,
      aperture: result.data.aperture ?? null,
      shutter_speed: result.data.shutter_speed ?? null,
      iso: result.data.iso ?? null,
      exif_latitude: result.data.exif_latitude ?? null,
      exif_longitude: result.data.exif_longitude ?? null,
      title: result.data.title ?? null,
      description: result.data.description ?? null,
      tags: result.data.tags ?? null,
      is_public: result.data.is_public ?? false,
      location_id: result.data.location_id ?? null,
    });

    return {
      data: photo,
      error: null,
    };
  } catch (error) {
    console.error('Error creating photo record:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to save photo',
    };
  }
}

// =============================================================================
// Update Photo Metadata
// =============================================================================

export async function updatePhotoAction(
  photoId: string,
  updates: {
    title?: string | null;
    description?: string | null;
    tags?: string[] | null;
    is_public?: boolean;
    location_id?: string | null;
  }
): Promise<{
  data: UserPhoto | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = updatePhotoSchema.safeParse(updates);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to update photos',
      };
    }

    // Verify ownership
    const existingPhoto = await getPhotoById(supabase, photoId);
    if (!existingPhoto) {
      return {
        data: null,
        error: 'Photo not found',
      };
    }
    if (existingPhoto.user_id !== user.id) {
      return {
        data: null,
        error: 'You do not have permission to update this photo',
      };
    }

    const photo = await updatePhoto(supabase, photoId, result.data);

    return {
      data: photo,
      error: null,
    };
  } catch (error) {
    console.error('Error updating photo:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update photo',
    };
  }
}

// =============================================================================
// Delete Photo (storage + record)
// =============================================================================

export async function deletePhotoAction(photoId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to delete photos',
      };
    }

    // Get photo to verify ownership and get storage path
    const photo = await getPhotoById(supabase, photoId);
    if (!photo) {
      return {
        data: null,
        error: 'Photo not found',
      };
    }
    if (photo.user_id !== user.id) {
      return {
        data: null,
        error: 'You do not have permission to delete this photo',
      };
    }

    // Delete from storage first
    const { error: storageError } = await deletePhoto(supabase, photo.storage_path);
    if (storageError) {
      console.error('Storage deletion failed, continuing with record deletion:', storageError);
      // Continue with record deletion even if storage fails
      // This prevents orphaned records
    }

    // Delete database record
    await deletePhotoRecord(supabase, photoId);

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Error deleting photo:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete photo',
    };
  }
}

// =============================================================================
// Link Photo to Location
// =============================================================================

export async function linkPhotoToLocationAction(
  photoId: string,
  locationId: string | null
): Promise<{
  data: UserPhoto | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to link photos',
      };
    }

    // Verify photo ownership
    const photo = await getPhotoById(supabase, photoId);
    if (!photo) {
      return {
        data: null,
        error: 'Photo not found',
      };
    }
    if (photo.user_id !== user.id) {
      return {
        data: null,
        error: 'You do not have permission to modify this photo',
      };
    }

    const updatedPhoto = await linkPhotoToLocation(supabase, photoId, locationId);

    return {
      data: updatedPhoto,
      error: null,
    };
  } catch (error) {
    console.error('Error linking photo to location:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to link photo',
    };
  }
}

// =============================================================================
// Get Location Photos
// =============================================================================

export async function fetchLocationPhotos(
  locationId: string,
  limit = 50,
  offset = 0
): Promise<{
  data: UserPhoto[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const photos = await getLocationPhotos(supabase, locationId, limit, offset);

    return {
      data: photos,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching location photos:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch photos',
    };
  }
}

// =============================================================================
// Get Photo Counts per Location
// =============================================================================

export async function fetchLocationPhotoCounts(): Promise<{
  data: LocationPhotoCount[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in',
      };
    }

    const counts = await getLocationPhotoCounts(supabase);

    return {
      data: counts,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching location photo counts:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch counts',
    };
  }
}

// =============================================================================
// Get Storage Usage
// =============================================================================

export async function fetchStorageUsage(): Promise<{
  data: { used: number; limit: number; percentage: number } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in',
      };
    }

    const used = await getStorageUsage(supabase);
    const limit = USER_STORAGE_LIMIT;
    const percentage = Math.round((used / limit) * 100);

    return {
      data: { used, limit, percentage },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching storage usage:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch storage usage',
    };
  }
}

// =============================================================================
// Get User's Photo Tags
// =============================================================================

export async function fetchUserPhotoTags(): Promise<{
  data: string[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in',
      };
    }

    const tags = await getUserPhotoTags(supabase);

    return {
      data: tags,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching photo tags:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch tags',
    };
  }
}
