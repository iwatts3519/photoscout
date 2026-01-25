'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchUserFavorites } from '@/app/actions/favorites';
import { useFavoritesStore } from '@/src/stores/favoritesStore';
import type { FavoritedLocation } from '@/src/types/community.types';

export function FavoritesList() {
  const { favorites, setFavorites, isLoading, setIsLoading, error, setError } =
    useFavoritesStore();
  const [isInitialized, setIsInitialized] = useState(false);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchUserFavorites();

    if (result.error) {
      setError(result.error);
    } else {
      setFavorites(result.data || []);
    }

    setIsLoading(false);
  }, [setFavorites, setIsLoading, setError]);

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      loadFavorites();
    }
  }, [isInitialized, loadFavorites]);

  if (isLoading && favorites.length === 0) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-2">
          Failed to load favorites
        </p>
        <Button variant="ghost" size="sm" onClick={loadFavorites}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-4">
        <Heart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No favorites yet</p>
        <Link
          href="/discover"
          className="text-xs text-primary hover:underline mt-1 inline-block"
        >
          Discover photo spots
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {favorites.slice(0, 5).map((location) => (
        <FavoriteItem key={location.id} location={location} />
      ))}
      {favorites.length > 5 && (
        <Link
          href="/discover"
          className="block text-xs text-center text-muted-foreground hover:text-foreground py-2"
        >
          View all {favorites.length} favorites
        </Link>
      )}
    </div>
  );
}

function FavoriteItem({ location }: { location: FavoritedLocation }) {
  return (
    <Link
      href={`/spot/${location.id}`}
      className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent transition-colors group"
    >
      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
          {location.name}
        </p>
        <p className="text-xs text-muted-foreground">by {location.owner_name}</p>
      </div>
    </Link>
  );
}
