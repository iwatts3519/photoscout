'use client';

/**
 * Error page for Next.js App Router
 * Automatically wraps routes in an error boundary
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Error occurred:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-10 w-10 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Oops! Something went wrong
            </h1>
            <p className="text-slate-600">
              We encountered an unexpected error. Please try again or return home.
            </p>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="w-full mt-4 p-4 bg-slate-100 rounded-md text-left">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Error Details (dev only):
              </p>
              <p className="text-sm font-mono text-slate-800 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-slate-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
            <Button onClick={reset} variant="default" className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
