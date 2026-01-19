'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const emailSchema = z.string().email();

// Validate app URL environment variable
const appEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL format'),
});

function getAppUrl(): string {
  const result = appEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!result.success) {
    console.error('Invalid NEXT_PUBLIC_APP_URL:', result.error.message);
    // Fallback to localhost for development
    return 'http://localhost:3000';
  }

  return result.data.NEXT_PUBLIC_APP_URL;
}

/**
 * Send magic link to user's email for authentication
 */
export async function signInWithMagicLink(
  email: string
): Promise<{ data: { success: boolean } | null; error: string | null }> {
  try {
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      return {
        data: null,
        error: 'Invalid email address',
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email: result.data,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error sending magic link:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error in signInWithMagicLink:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to send magic link',
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error in signOut:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to sign out',
    };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{
  data: { userId: string; email: string } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    if (!session) {
      return {
        data: null,
        error: null,
      };
    }

    return {
      data: {
        userId: session.user.id,
        email: session.user.email ?? '',
      },
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error in getSession:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get session',
    };
  }
}
