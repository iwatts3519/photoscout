'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SpotDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map Skeleton */}
            <Skeleton className="w-full h-[300px] lg:h-[400px] rounded-lg" />

            {/* Location Info Skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-8 w-64" />
                <div className="flex items-center gap-4 mt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>

              <Skeleton className="h-20 w-full" />

              {/* Stats Skeleton */}
              <div className="flex items-center gap-6 py-3 border-y">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-3 w-8 mt-1" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-3 w-12 mt-1" />
                  </div>
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-14 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-full mt-3" />
            </div>

            <div className="p-4 rounded-lg border">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-4 w-full" />
            </div>

            <div className="p-4 rounded-lg border">
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
