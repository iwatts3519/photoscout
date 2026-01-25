'use client';

import { useEffect, useCallback, useState } from 'react';
import { useDiscoverStore } from '@/src/stores/discoverStore';
import { DiscoveryGrid } from './DiscoveryGrid';
import { DiscoveryMap } from './DiscoveryMap';
import { DiscoveryFilters } from './DiscoveryFilters';
import { fetchPublicLocations, fetchPopularTags } from '@/app/actions/discover';
import { Button } from '@/components/ui/button';
import { Grid3X3, Map, Loader2 } from 'lucide-react';
import type { PublicLocation, PopularTag } from '@/src/types/community.types';

interface DiscoveryViewProps {
  initialLocations: PublicLocation[];
  initialTags: PopularTag[];
}

const ITEMS_PER_PAGE = 24;

export function DiscoveryView({
  initialLocations,
  initialTags,
}: DiscoveryViewProps) {
  const {
    locations,
    setLocations,
    appendLocations,
    isLoading,
    setIsLoading,
    error,
    setError,
    hasMore,
    setHasMore,
    offset,
    sortBy,
    selectedTags,
    popularTags,
    setPopularTags,
    viewMode,
    setViewMode,
  } = useDiscoverStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize store with server data
  useEffect(() => {
    if (!isInitialized) {
      setLocations(initialLocations);
      setPopularTags(initialTags);
      setHasMore(initialLocations.length >= ITEMS_PER_PAGE);
      setIsInitialized(true);
    }
  }, [
    initialLocations,
    initialTags,
    setLocations,
    setPopularTags,
    setHasMore,
    isInitialized,
  ]);

  // Refetch when filters change
  useEffect(() => {
    if (!isInitialized) return;

    const fetchFiltered = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchPublicLocations({
        limit: ITEMS_PER_PAGE,
        offset: 0,
        sortBy,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setLocations(result.data || []);
        setHasMore((result.data?.length || 0) >= ITEMS_PER_PAGE);
      }

      setIsLoading(false);
    };

    fetchFiltered();
  }, [
    sortBy,
    selectedTags,
    setLocations,
    setIsLoading,
    setError,
    setHasMore,
    isInitialized,
  ]);

  // Load more locations
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    const result = await fetchPublicLocations({
      limit: ITEMS_PER_PAGE,
      offset,
      sortBy,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      appendLocations(result.data || []);
      setHasMore((result.data?.length || 0) >= ITEMS_PER_PAGE);
    }

    setIsLoading(false);
  }, [
    isLoading,
    hasMore,
    offset,
    sortBy,
    selectedTags,
    appendLocations,
    setIsLoading,
    setError,
    setHasMore,
  ]);

  // Refetch popular tags
  useEffect(() => {
    if (!isInitialized) return;

    const fetchTags = async () => {
      const result = await fetchPopularTags();
      if (result.data) {
        setPopularTags(result.data);
      }
    };

    fetchTags();
  }, [setPopularTags, isInitialized]);

  return (
    <div className="space-y-6">
      {/* Filters and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DiscoveryFilters />

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {/* Tag Filters */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 12).map((tag) => (
            <TagBadge key={tag.tag} tag={tag.tag} count={tag.count} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {viewMode === 'grid' ? (
        <DiscoveryGrid locations={locations} />
      ) : (
        <DiscoveryMap locations={locations} />
      )}

      {/* Load More */}
      {viewMode === 'grid' && hasMore && locations.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && locations.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Map className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            No public spots found matching your filters.
          </p>
        </div>
      )}
    </div>
  );
}

function TagBadge({ tag, count }: { tag: string; count: number }) {
  const { selectedTags, toggleTag } = useDiscoverStore();
  const isSelected = selectedTags.includes(tag);

  return (
    <button
      onClick={() => toggleTag(tag)}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs transition-colors ${
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
      }`}
    >
      <span>{tag}</span>
      <span className="opacity-60">({count})</span>
    </button>
  );
}
