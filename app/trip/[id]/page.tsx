import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchTripForShare } from '@/app/actions/trips';
import { TripShareContent } from './TripShareContent';
import type { Metadata } from 'next';

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TripPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchTripForShare(id);

  if (result.error || !result.data) {
    return {
      title: 'Trip Not Found | PhotoScout',
    };
  }

  const trip = result.data;
  const description = trip.description
    || `Photography trip with ${trip.stops.length} stops`;

  return {
    title: `${trip.name} | PhotoScout`,
    description,
    openGraph: {
      title: trip.name,
      description,
      type: 'website',
    },
  };
}

function TripSkeleton() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="rounded-lg border p-6 space-y-4">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

async function TripContent({ id }: { id: string }) {
  const result = await fetchTripForShare(id);

  if (result.error || !result.data) {
    notFound();
  }

  return <TripShareContent trip={result.data} />;
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<TripSkeleton />}>
      <TripContent id={id} />
    </Suspense>
  );
}
