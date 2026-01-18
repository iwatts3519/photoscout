'use client';

import { useState } from 'react';
import { FolderPlus, Edit, Trash2, Loader2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useCollectionStore,
  COLLECTION_COLORS,
  type Collection,
} from '@/src/stores/collectionStore';
import {
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
} from '@/app/actions/collections';
import { toast } from 'sonner';

/**
 * Full CRUD dialog for managing collections
 */
export function CollectionManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );

  const collections = useCollectionStore((state) => state.collections);
  const addCollection = useCollectionStore((state) => state.addCollection);
  const updateCollection = useCollectionStore((state) => state.updateCollection);
  const removeCollection = useCollectionStore((state) => state.removeCollection);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Collections
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
          <DialogDescription>
            Organize your saved locations into collections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Collection List */}
          {collections.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  onEdit={() => setEditingCollection(collection)}
                  onDelete={async () => {
                    if (
                      !confirm(
                        `Delete "${collection.name}"? Locations in this collection will become uncategorized.`
                      )
                    ) {
                      return;
                    }

                    const { error } = await deleteCollectionAction(collection.id);
                    if (error) {
                      toast.error('Failed to delete collection', {
                        description: error,
                      });
                    } else {
                      removeCollection(collection.id);
                      toast.success('Collection deleted');
                    }
                  }}
                />
              ))}
            </div>
          )}

          {collections.length === 0 && !isCreating && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No collections yet. Create one to organize your locations.
            </p>
          )}

          {/* Create/Edit Form */}
          {(isCreating || editingCollection) && (
            <CollectionForm
              collection={editingCollection}
              onSave={async (data) => {
                if (editingCollection) {
                  const { data: updated, error } = await updateCollectionAction(
                    editingCollection.id,
                    data
                  );
                  if (error) {
                    toast.error('Failed to update collection', {
                      description: error,
                    });
                    return false;
                  }
                  if (updated) {
                    updateCollection(editingCollection.id, updated);
                    toast.success('Collection updated');
                  }
                } else {
                  const { data: created, error } = await createCollectionAction(
                    data
                  );
                  if (error) {
                    toast.error('Failed to create collection', {
                      description: error,
                    });
                    return false;
                  }
                  if (created) {
                    addCollection(created);
                    toast.success('Collection created');
                  }
                }
                setIsCreating(false);
                setEditingCollection(null);
                return true;
              }}
              onCancel={() => {
                setIsCreating(false);
                setEditingCollection(null);
              }}
            />
          )}

          {/* Add Button */}
          {!isCreating && !editingCollection && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CollectionItemProps {
  collection: Collection;
  onEdit: () => void;
  onDelete: () => void;
}

function CollectionItem({ collection, onEdit, onDelete }: CollectionItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-md border bg-card">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="h-4 w-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: collection.color || '#10b981' }}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{collection.name}</p>
          {collection.description && (
            <p className="text-xs text-muted-foreground truncate">
              {collection.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onEdit}
        >
          <Edit className="h-3 w-3" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
}

interface CollectionFormProps {
  collection: Collection | null;
  onSave: (data: {
    name: string;
    description?: string;
    color: string;
  }) => Promise<boolean>;
  onCancel: () => void;
}

function CollectionForm({ collection, onSave, onCancel }: CollectionFormProps) {
  const [name, setName] = useState(collection?.name || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [color, setColor] = useState(collection?.color || '#10b981');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setError('');
    setIsLoading(true);

    const success = await onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      color,
    });

    if (!success) {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
      <div className="space-y-2">
        <Label htmlFor="collection-name">Name *</Label>
        <Input
          id="collection-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="e.g., Coastal Spots"
          disabled={isLoading}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="collection-description">Description</Label>
        <Input
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description..."
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {COLLECTION_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`h-8 w-8 rounded-full transition-all ${
                color === c.value
                  ? 'ring-2 ring-offset-2 ring-primary scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
              disabled={isLoading}
            >
              <span className="sr-only">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {collection ? 'Updating...' : 'Creating...'}
            </>
          ) : collection ? (
            'Update'
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </form>
  );
}
