'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

/**
 * DEV ONLY: Password sign-in for testing
 * Remove this component before production deployment
 */
export function DevPasswordSignIn() {
  const [email, setEmail] = useState('test@photoscout.com');
  const [password, setPassword] = useState('Test123!@#');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Sign in failed', {
          description: error.message,
        });
      } else {
        toast.success('Signed in successfully!');
        // Refresh the page to update auth state
        window.location.reload();
      }
    } catch (err) {
      toast.error('Sign in failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Always show for local testing
  return (
    <Card className="border-orange-500">
      <CardHeader>
        <CardTitle className="text-orange-600">🚧 Dev Only: Password Sign In</CardTitle>
        <CardDescription>
          Use this for local testing when magic links aren&apos;t working
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dev-email">Email</Label>
            <Input
              id="dev-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dev-password">Password</Label>
            <Input
              id="dev-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In with Password'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
