'use client';

import { useEffect, useState, useCallback } from 'react';
import { Filter, SortAsc, SortDesc, ImageIcon, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PhotoUploader } from './PhotoUploader';
import { UserPhotoGrid } from './UserPhotoGrid';
import { PhotoDetailDialog } from './PhotoDetailDialog';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import { fetchUserPhotos } from '@/app/actions/photos';
import { formatFileSize } from '@/lib/supabase/storage';
import type {
  UserPhotoWithLocation,
  StorageUsage,
  PhotoSortOption,
} from '@/src/types/photo.types';
import { photoSortLabels } from '@/src/types/photo.types';

interface PhotoLibraryProps {
  initialPhotos: UserPhotoWithLocation[];
  initialTotal: number;
  initialStorageUsage: StorageUsage | null;
  initialTags: string[];
}

export function PhotoLibrary({
  initialPhotos,
  initialTotal,
  initialStorageUsage,
  initialTags,
}: PhotoLibraryProps) {
  const {
    photos,
    totalPhotos,
    selectedPhoto,
    isLoading,
    filters,
    storageUsage,
    availableTags,
    setPhotos,
    setSelectedPhoto,
    setIsLoading,
    setFilters,
    setStorageUsage,
    setAvailableTags,
  } = usePhotoLibraryStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize store with server data
  useEffect(() => {
    setPhotos(initialPhotos, initialTotal);
    if (initialStorageUsage) {
      setStorageUsage(initialStorageUsage);
    }
    setAvailableTags(initialTags);
  }, [initialPhotos, initialTotal, initialStorageUsage, initialTags, setPhotos, setStorageUsage, setAvailableTags]);

  // Fetch photos when filters change
  const fetchPhotosWithFilters = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await fetchUserPhotos({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      locationId: filters.locationId,
      tags: filters.tags,
      limit: 50,
    });

    if (!error && data) {
      setPhotos(data.photos, data.total);
    }
    setIsLoading(false);
  }, [filters, setIsLoading, setPhotos]);

  const handleSortChange = (value: string) => {
    setFilters({ sortBy: value as PhotoSortOption });
    fetchPhotosWithFilters();
  };

  const handleSortOrderToggle = () => {
    setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' });
    fetchPhotosWithFilters();
  };

  const handlePhotoClick = (photo: UserPhotoWithLocation) => {
    setSelectedPhoto(photo);
  };

  const handleCloseDialog = () => {
    setSelectedPhoto(null);
  };

  const handlePhotoUpdate = () => {
    // Refresh photos after update
    fetchPhotosWithFilters();
  };

  const usage = storageUsage || initialStorageUsage;
  const displayPhotos = photos.length > 0 ? photos : initialPhotos;
  const displayTotal = photos.length > 0 ? totalPhotos : initialTotal;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <PhotoUploader />

      {/* Storage Usage */}
      {usage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HardDrive className="h-4 w-4" />
          <span>
            Storage: {formatFileSize(usage.used)} / {formatFileSize(usage.limit)} ({usage.percentage}%)
          </span>
          <div className="flex-1 max-w-32 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usage.percentage > 90 ? 'bg-destructive' :
                usage.percentage > 70 ? 'bg-amber-500' : 'bg-primary'
              }`}
              style={{ width: `${usage.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {displayTotal} photo{displayTotal === 1 ? '' : 's'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(photoSortLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={handleSortOrderToggle}
            title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {/* Filter */}
          {availableTags.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={filters.tags.length > 0 ? 'border-primary' : ''}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  {filters.tags.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                      {filters.tags.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                  <p className="font-medium text-sm">Filter by tags</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => (
                      <Button
                        key={tag}
                        variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          const newTags = filters.tags.includes(tag)
                            ? filters.tags.filter((t) => t !== tag)
                            : [...filters.tags, tag];
                          setFilters({ tags: newTags });
                          fetchPhotosWithFilters();
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                  {filters.tags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFilters({ tags: [] });
                        fetchPhotosWithFilters();
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      {displayPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No photos yet
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload your first photo using the uploader above to start building your collection.
          </p>
        </div>
      ) : (
        <UserPhotoGrid
          photos={displayPhotos}
          onPhotoClick={handlePhotoClick}
          isLoading={isLoading}
        />
      )}

      {/* Photo Detail Dialog */}
      <PhotoDetailDialog
        photo={selectedPhoto}
        isOpen={!!selectedPhoto}
        onClose={handleCloseDialog}
        onUpdate={handlePhotoUpdate}
      />
    </div>
  );
}
