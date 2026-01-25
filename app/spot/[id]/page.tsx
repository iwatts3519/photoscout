import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchSpotDetails } from '@/app/actions/discover';
import { SpotDetail } from '@/components/discover/SpotDetail';
import { SpotDetailSkeleton } from '@/components/discover/SpotDetailSkeleton';
import type { Metadata } from 'next';

interface SpotPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SpotPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await fetchSpotDetails(id);

  if (result.error || !result.data) {
    return {
      title: 'Spot Not Found | PhotoScout',
    };
  }

  const spot = result.data;

  return {
    title: `${spot.name} | PhotoScout`,
    description:
      spot.description || `Photography location shared by ${spot.owner_name}`,
    openGraph: {
      title: spot.name,
      description:
        spot.description || `Photography location shared by ${spot.owner_name}`,
      type: 'website',
    },
  };
}

async function SpotContent({ id }: { id: string }) {
  const result = await fetchSpotDetails(id);

  if (result.error || !result.data) {
    notFound();
  }

  return <SpotDetail spot={result.data} />;
}

export default async function SpotPage({ params }: SpotPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SpotDetailSkeleton />}>
      <SpotContent id={id} />
    </Suspense>
  );
}
