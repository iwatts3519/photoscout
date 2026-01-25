'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getPublicLocations,
  getLocationWithCoords,
  getPopularTags,
  incrementViewCount,
  checkIsFavorited,
} from '@/lib/queries/community';
import type {
  PublicLocation,
  LocationWithCoords,
  PopularTag,
  SortOption,
} from '@/src/types/community.types';
import { z } from 'zod';
import { discoverFiltersSchema } from '@/src/types/community.types';

/**
 * Fetch public locations for the discovery page
 */
export async function fetchPublicLocations(options?: {
  limit?: number;
  offset?: number;
  sortBy?: SortOption;
  tags?: string[];
}): Promise<{
  data: PublicLocation[] | null;
  error: string | null;
}> {
  try {
    // Validate options
    const result = discoverFiltersSchema.safeParse(options || {});
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();
    const locations = await getPublicLocations(supabase, result.data);

    return {
      data: locations,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching public locations:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch public locations',
    };
  }
}

/**
 * Fetch a single location with full details for the spot detail page
 */
export async function fetchSpotDetails(locationId: string): Promise<{
  data: (LocationWithCoords & { is_favorited: boolean }) | null;
  error: string | null;
}> {
  try {
    // Validate UUID
    const uuidSchema = z.string().uuid();
    const parseResult = uuidSchema.safeParse(locationId);
    if (!parseResult.success) {
      return {
        data: null,
        error: 'Invalid location ID',
      };
    }

    const supabase = await createClient();
    const location = await getLocationWithCoords(supabase, locationId);

    if (!location) {
      return {
        data: null,
        error: 'Location not found',
      };
    }

    // Check if the location is accessible (public or unlisted, or owned by user)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (
      location.visibility === 'private' &&
      location.user_id !== user?.id
    ) {
      return {
        data: null,
        error: 'This location is private',
      };
    }

    // Check if favorited
    const isFavorited = user ? await checkIsFavorited(supabase, locationId) : false;

    // Increment view count (only for non-owners)
    if (location.user_id !== user?.id) {
      await incrementViewCount(supabase, locationId).catch(() => {
        // Silently ignore view count errors
      });
    }

    return {
      data: { ...location, is_favorited: isFavorited },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching spot details:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch spot details',
    };
  }
}

/**
 * Fetch popular tags for filtering
 */
export async function fetchPopularTags(): Promise<{
  data: PopularTag[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const tags = await getPopularTags(supabase);

    return {
      data: tags,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch popular tags',
    };
  }
}
