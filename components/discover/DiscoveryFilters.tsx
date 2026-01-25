'use client';

import { useDiscoverStore } from '@/src/stores/discoverStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  SORT_OPTIONS,
  sortOptionLabels,
  type SortOption,
} from '@/src/types/community.types';

export function DiscoveryFilters() {
  const { sortBy, setSortBy, selectedTags, setSelectedTags } = useDiscoverStore();

  const hasActiveFilters = selectedTags.length > 0;

  const clearFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div className="flex items-center gap-3">
      <Select
        value={sortBy}
        onValueChange={(value) => setSortBy(value as SortOption)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {sortOptionLabels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
