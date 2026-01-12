import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import { getProfile, updateProfile } from '@/lib/queries/profiles';
import type { Database } from '@/src/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

interface UseUserReturn {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: ProfileUpdate) => Promise<{ error: string | null }>;
  refetch: () => Promise<void>;
}

/**
 * Hook to access and manage user profile data
 *
 * @returns {UseUserReturn} Profile state and methods
 * @property {Profile | null} profile - User profile data
 * @property {boolean} loading - Whether profile is loading
 * @property {string | null} error - Error message if profile fetch failed
 * @property {function} updateProfile - Update user profile
 * @property {function} refetch - Manually refetch profile
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { profile, loading, updateProfile } = useUser();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!profile) return <div>No profile found</div>;
 *
 *   return (
 *     <div>
 *       <p>{profile.name}</p>
 *       <button onClick={() => updateProfile({ name: 'New Name' })}>
 *         Update Name
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useUser(): UseUserReturn {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const profileData = await getProfile(supabase, user.id);
      setProfile(profileData);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Fetch profile when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [authLoading, fetchProfile]);

  // Update profile
  const handleUpdateProfile = useCallback(
    async (updates: ProfileUpdate): Promise<{ error: string | null }> => {
      if (!user) {
        return { error: 'No user logged in' };
      }

      try {
        setError(null);

        const updatedProfile = await updateProfile(supabase, user.id, updates);
        setProfile(updatedProfile);

        return { error: null };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMessage);
        return { error: errorMessage };
      }
    },
    [user, supabase]
  );

  return {
    profile,
    loading: authLoading || loading,
    error,
    updateProfile: handleUpdateProfile,
    refetch: fetchProfile,
  };
}
