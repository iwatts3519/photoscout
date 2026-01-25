import { Suspense } from 'react';
import { fetchPublicLocations, fetchPopularTags } from '@/app/actions/discover';
import { DiscoveryView } from '@/components/discover/DiscoveryView';
import { Loader2, Compass } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover Photo Spots | PhotoScout',
  description:
    'Explore community-shared photography locations. Find the perfect spot for your next landscape photo.',
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

async function DiscoveryContent() {
  const [locationsResult, tagsResult] = await Promise.all([
    fetchPublicLocations({ limit: 24, sortBy: 'recent' }),
    fetchPopularTags(),
  ]);

  if (locationsResult.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <Compass className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Failed to load locations. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <DiscoveryView
      initialLocations={locationsResult.data || []}
      initialTags={tagsResult.data || []}
    />
  );
}

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Compass className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Discover Photo Spots</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Explore community-shared photography locations
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<LoadingFallback />}>
          <DiscoveryContent />
        </Suspense>
      </main>
    </div>
  );
}
