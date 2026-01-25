'use server';

import { createClient } from '@/lib/supabase/server';
import {
  toggleFavorite,
  getUserFavorites,
  checkIsFavorited,
} from '@/lib/queries/community';
import type {
  FavoritedLocation,
  ToggleFavoriteResult,
} from '@/src/types/community.types';
import { z } from 'zod';

/**
 * Toggle favorite status for a location
 */
export async function toggleFavoriteAction(locationId: string): Promise<{
  data: ToggleFavoriteResult | null;
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

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to favorite locations',
      };
    }

    const result = await toggleFavorite(supabase, locationId);

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to toggle favorite',
    };
  }
}

/**
 * Fetch user's favorited locations
 */
export async function fetchUserFavorites(): Promise<{
  data: FavoritedLocation[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to view favorites',
      };
    }

    const favorites = await getUserFavorites(supabase);

    return {
      data: favorites,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to fetch favorites',
    };
  }
}

/**
 * Check if a location is favorited
 */
export async function checkIsFavoritedAction(locationId: string): Promise<{
  data: boolean;
  error: string | null;
}> {
  try {
    // Validate UUID
    const uuidSchema = z.string().uuid();
    const parseResult = uuidSchema.safeParse(locationId);
    if (!parseResult.success) {
      return {
        data: false,
        error: 'Invalid location ID',
      };
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: false,
        error: null,
      };
    }

    const isFavorited = await checkIsFavorited(supabase, locationId);

    return {
      data: isFavorited,
      error: null,
    };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return {
      data: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check favorite status',
    };
  }
}
