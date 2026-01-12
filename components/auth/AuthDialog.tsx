'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/src/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

const emailSchema = z.string().email('Please enter a valid email address');

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
      return;
    }

    setEmailError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email);

      if (error) {
        setEmailError(error);
        setIsLoading(false);
      } else {
        // Success - show confirmation
        setEmailSent(true);
        setIsLoading(false);
      }
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : 'Failed to send magic link'
      );
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    if (!isLoading) {
      setEmail('');
      setEmailError(null);
      setEmailSent(false);
      onOpenChange(false);
    }
  };

  const handleResend = () => {
    setEmailSent(false);
    setEmail('');
    setEmailError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!emailSent ? (
          <>
            <DialogHeader>
              <DialogTitle>Sign in to PhotoScout</DialogTitle>
              <DialogDescription>
                Enter your email address and we&apos;ll send you a magic link to sign
                in.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="photographer@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send magic link
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Check your email
              </DialogTitle>
              <DialogDescription>
                We&apos;ve sent a magic link to <strong>{email}</strong>. Click the
                link in the email to sign in to PhotoScout.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium mb-1">Didn&apos;t receive the email?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a minute and try resending</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleResend} variant="outline" className="flex-1">
                  Try another email
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
