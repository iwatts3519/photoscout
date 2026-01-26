import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchUserPhotos, fetchStorageUsage, fetchUserPhotoTags } from '@/app/actions/photos';
import { PhotoLibrary } from '@/components/photos/PhotoLibrary';
import { Loader2, ImageIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Photos | PhotoScout',
  description: 'Manage your uploaded photos and link them to saved locations.',
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <LogIn className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h2 className="text-lg font-medium mb-2">Sign in required</h2>
      <p className="text-muted-foreground mb-4">
        You need to sign in to view and manage your photos.
      </p>
      <Button asChild>
        <Link href="/">Sign In</Link>
      </Button>
    </div>
  );
}

async function PhotoLibraryContent() {
  // Fetch initial data
  const [photosResult, storageResult, tagsResult] = await Promise.all([
    fetchUserPhotos({ limit: 50 }),
    fetchStorageUsage(),
    fetchUserPhotoTags(),
  ]);

  if (photosResult.error === 'You must be signed in to view your photos') {
    return <SignInPrompt />;
  }

  if (photosResult.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          Failed to load photos. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <PhotoLibrary
      initialPhotos={photosResult.data?.photos || []}
      initialTotal={photosResult.data?.total || 0}
      initialStorageUsage={storageResult.data || null}
      initialTags={tagsResult.data || []}
    />
  );
}

export default async function PhotosPage() {
  // Check auth first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        {!user ? (
          <SignInPrompt />
        ) : (
          <Suspense fallback={<LoadingFallback />}>
            <PhotoLibraryContent />
          </Suspense>
        )}
      </main>
    </div>
  );
}
