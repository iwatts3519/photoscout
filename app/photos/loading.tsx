import { Loader2, ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PhotosLoading() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">My Photos</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Upload and manage your photography collection
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square">
              <Skeleton className="w-full h-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Center loading indicator */}
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
