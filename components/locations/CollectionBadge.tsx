'use client';

import { Folder } from 'lucide-react';
import { useCollectionStore } from '@/src/stores/collectionStore';

interface CollectionBadgeProps {
  collectionId: string | null;
  className?: string;
}

/**
 * Displays a colored badge showing the collection name
 */
export function CollectionBadge({ collectionId, className = '' }: CollectionBadgeProps) {
  const getCollectionById = useCollectionStore((state) => state.getCollectionById);

  if (!collectionId) {
    return null;
  }

  const collection = getCollectionById(collectionId);

  if (!collection) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${className}`}
      style={{
        backgroundColor: `${collection.color}20`,
        color: collection.color || '#10b981',
        borderColor: collection.color || '#10b981',
        borderWidth: '1px',
      }}
    >
      <Folder className="h-3 w-3" />
      <span className="truncate max-w-[100px]">{collection.name}</span>
    </span>
  );
}
