/**
 * 404 Not Found page
 */

import Link from 'next/link';
import { MapPin, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="rounded-full bg-blue-100 p-4">
            <MapPin className="h-10 w-10 text-blue-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">
              Location Not Found
            </h1>
            <p className="text-slate-600">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
          </div>

          <div className="w-full border-t border-slate-200 my-4"></div>

          <div className="space-y-3 w-full">
            <p className="text-sm text-slate-500">
              Here&apos;s what you can do:
            </p>
            <ul className="text-sm text-slate-600 space-y-2 text-left">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Check the URL for typos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Return to the home page and start exploring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Use the map to discover new photography locations</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full sm:w-auto">
            <Button asChild variant="default" className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go home
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/">
                <Search className="mr-2 h-4 w-4" />
                Explore map
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
