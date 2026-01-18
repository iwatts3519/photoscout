'use client';

import { Folder, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCollectionStore } from '@/src/stores/collectionStore';

interface CollectionSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

/**
 * Dropdown selector for choosing a collection when saving/editing locations
 */
export function CollectionSelector({
  value,
  onChange,
  disabled = false,
}: CollectionSelectorProps) {
  const collections = useCollectionStore((state) => state.collections);

  const handleValueChange = (newValue: string) => {
    // Use empty string to represent "no collection"
    onChange(newValue === 'none' ? null : newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  if (collections.length === 0) {
    return null;
  }

  const selectedCollection = value
    ? collections.find((c) => c.id === value)
    : null;

  return (
    <div className="flex gap-2 items-center">
      <Select
        value={value || 'none'}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="No collection">
            {selectedCollection ? (
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedCollection.color || '#10b981' }}
                />
                <span className="truncate">{selectedCollection.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground">
                <Folder className="h-4 w-4" />
                <span>No collection</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span>No collection</span>
            </span>
          </SelectItem>
          {collections.map((collection) => (
            <SelectItem key={collection.id} value={collection.id}>
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: collection.color || '#10b981' }}
                />
                <span className="truncate">{collection.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Clear collection</span>
        </Button>
      )}
    </div>
  );
}
