'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getCollectionsByUser,
  createCollection,
  updateCollection,
  deleteCollection,
} from '@/lib/queries/collections';
import type { Collection } from '@/src/stores/collectionStore';
import { z } from 'zod';

// Validation schemas
const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  description: z.string().max(200, 'Description is too long').optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
  icon: z.string().max(50).optional(),
});

const updateCollectionSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  icon: z.string().max(50).optional().nullable(),
});

/**
 * Fetch all collections for the current user
 */
export async function fetchUserCollections(): Promise<{
  data: Collection[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to view collections',
      };
    }

    const collections = await getCollectionsByUser(supabase, user.id);

    return {
      data: collections,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user collections:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch collections',
    };
  }
}

/**
 * Create a new collection
 */
export async function createCollectionAction(input: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}): Promise<{
  data: Collection | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = createCollectionSchema.safeParse(input);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to create collections',
      };
    }

    const collection = await createCollection(supabase, {
      user_id: user.id,
      name: result.data.name,
      description: result.data.description || null,
      color: result.data.color || '#10b981',
      icon: result.data.icon || null,
    });

    return {
      data: collection,
      error: null,
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to create collection',
    };
  }
}

/**
 * Update an existing collection
 */
export async function updateCollectionAction(
  id: string,
  updates: {
    name?: string;
    description?: string | null;
    color?: string;
    icon?: string | null;
  }
): Promise<{
  data: Collection | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = updateCollectionSchema.safeParse(updates);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to update collections',
      };
    }

    const collection = await updateCollection(supabase, id, result.data);

    return {
      data: collection,
      error: null,
    };
  } catch (error) {
    console.error('Error updating collection:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update collection',
    };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollectionAction(id: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to delete collections',
      };
    }

    await deleteCollection(supabase, id);

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to delete collection',
    };
  }
}
