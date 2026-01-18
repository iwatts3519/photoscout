'use client';

import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollectionStore } from '@/src/stores/collectionStore';

/**
 * Filter dropdown for filtering locations by collection in the list view
 */
export function CollectionFilter() {
  const collections = useCollectionStore((state) => state.collections);
  const selectedCollectionId = useCollectionStore(
    (state) => state.selectedCollectionId
  );
  const setSelectedCollectionId = useCollectionStore(
    (state) => state.setSelectedCollectionId
  );

  const handleValueChange = (value: string) => {
    setSelectedCollectionId(value === 'all' ? null : value);
  };

  if (collections.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedCollectionId || 'all'}
      onValueChange={handleValueChange}
    >
      <SelectTrigger className="w-[140px] h-7 text-xs">
        <Filter className="h-3 w-3 mr-1" />
        <SelectValue placeholder="All locations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All locations</SelectItem>
        <SelectItem value="uncategorized">Uncategorized</SelectItem>
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: collection.color || '#10b981' }}
              />
              <span className="truncate">{collection.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
