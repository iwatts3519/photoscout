import { useAuthContext } from '@/src/contexts/AuthContext';

/**
 * Hook to access authentication state and methods
 *
 * @returns {object} Authentication state and methods
 * @property {User | null} user - Current authenticated user
 * @property {Session | null} session - Current session
 * @property {boolean} loading - Whether auth is loading
 * @property {string | null} error - Authentication error message
 * @property {function} signIn - Sign in with magic link
 * @property {function} signOut - Sign out current user
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut, loading } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   if (!user) {
 *     return <button onClick={() => signIn('user@example.com')}>Sign In</button>;
 *   }
 *
 *   return <button onClick={signOut}>Sign Out</button>;
 * }
 * ```
 */
export function useAuth() {
  return useAuthContext();
}
