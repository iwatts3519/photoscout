import { Suspense } from 'react';
import { ComparePageContent } from './ComparePageContent';
import { Loader2, BarChart3 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Locations | PhotoScout',
  description:
    'Compare photography conditions across multiple locations side-by-side.',
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Compare Locations</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Side-by-side photography conditions comparison
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Suspense fallback={<LoadingFallback />}>
          <ComparePageContent />
        </Suspense>
      </main>
    </div>
  );
}
