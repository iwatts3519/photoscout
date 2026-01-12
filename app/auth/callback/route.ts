import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Handle magic link callback
 * Exchange the code from the email link for a session
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to home with error
        return NextResponse.redirect(
          `${requestUrl.origin}/?auth_error=${encodeURIComponent(error.message)}`
        );
      }

      // Success - redirect to requested page or home
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      return NextResponse.redirect(
        `${requestUrl.origin}/?auth_error=unexpected_error`
      );
    }
  }

  // No code provided - redirect to home
  return NextResponse.redirect(requestUrl.origin);
}
