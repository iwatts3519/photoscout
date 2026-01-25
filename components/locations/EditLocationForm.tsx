'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Calendar } from 'lucide-react';
import { updateLocationAction } from '@/app/actions/locations';
import { useLocationStore } from '@/src/stores/locationStore';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { CollectionSelector } from './CollectionSelector';
import { VisibilitySelector } from './VisibilitySelector';
import { toast } from 'sonner';
import type { SavedLocation } from '@/src/stores/locationStore';
import { type Visibility, isVisibility } from '@/src/types/community.types';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  tags: z.string().optional(), // Comma-separated tags
  notes: z.string().max(2000, 'Notes are too long').optional(),
  best_time_to_visit: z.string().max(500, 'Best time is too long').optional(),
  last_visited: z.string().optional(),
});

interface EditLocationFormProps {
  location: SavedLocation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper to format date for input
function formatDateForInput(dateString: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export function EditLocationForm({
  location,
  onSuccess,
  onCancel,
}: EditLocationFormProps) {
  const [name, setName] = useState(location.name);
  const [description, setDescription] = useState(location.description || '');
  const [tags, setTags] = useState(
    location.tags ? location.tags.join(', ') : ''
  );
  const [notes, setNotes] = useState(location.notes || '');
  const [bestTimeToVisit, setBestTimeToVisit] = useState(
    location.best_time_to_visit || ''
  );
  const [lastVisited, setLastVisited] = useState(
    formatDateForInput(location.last_visited)
  );
  const [collectionId, setCollectionId] = useState<string | null>(
    location.collection_id || null
  );
  // Handle visibility from database - could be string or undefined
  const initialVisibility = isVisibility((location as { visibility?: string }).visibility)
    ? ((location as { visibility?: string }).visibility as Visibility)
    : 'private';
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const updateLocationInStore = useLocationStore(
    (state) => state.updateLocation
  );
  const collections = useCollectionStore((state) => state.collections);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const result = locationSchema.safeParse({
      name,
      description,
      tags,
      notes,
      best_time_to_visit: bestTimeToVisit,
      last_visited: lastVisited,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      // Parse tags from comma-separated string
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const { data, error } = await updateLocationAction(location.id, {
        name: result.data.name,
        description: result.data.description || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
        visibility,
        collection_id: collectionId,
        notes: result.data.notes || undefined,
        best_time_to_visit: result.data.best_time_to_visit || undefined,
        last_visited: result.data.last_visited
          ? new Date(result.data.last_visited).toISOString()
          : undefined,
      });

      if (error) {
        toast.error('Failed to update location', {
          description: error,
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        // Update in store for immediate UI update
        updateLocationInStore(location.id, {
          name: data.name,
          description: data.description,
          tags: data.tags,
          collection_id: data.collection_id,
          notes: data.notes,
          best_time_to_visit: data.best_time_to_visit,
          last_visited: data.last_visited,
        });

        // Show success message
        toast.success('Location updated', {
          description: `${data.name} has been updated.`,
        });

        // Call success callback
        onSuccess?.();
      }

      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to update location', {
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-location-name">Location Name *</Label>
        <Input
          id="edit-location-name"
          type="text"
          placeholder="e.g., Durdle Door Sunrise Spot"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors({ ...errors, name: '' });
          }}
          disabled={isLoading}
          autoFocus
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location-description">Description</Label>
        <Input
          id="edit-location-description"
          type="text"
          placeholder="Notes about this location..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors({ ...errors, description: '' });
          }}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location-tags">Tags</Label>
        <Input
          id="edit-location-tags"
          type="text"
          placeholder="landscape, coast, sunrise (comma-separated)"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value);
            setErrors({ ...errors, tags: '' });
          }}
          disabled={isLoading}
        />
        {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location-notes">Notes</Label>
        <Textarea
          id="edit-location-notes"
          placeholder="Detailed notes, tips, and observations about this location..."
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setErrors({ ...errors, notes: '' });
          }}
          disabled={isLoading}
          rows={4}
          className="resize-none"
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Add detailed notes about parking, access, best angles, hazards, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location-best-time">Best Time to Visit</Label>
        <Input
          id="edit-location-best-time"
          type="text"
          placeholder="e.g., Golden hour in autumn, Low tide only"
          value={bestTimeToVisit}
          onChange={(e) => {
            setBestTimeToVisit(e.target.value);
            setErrors({ ...errors, best_time_to_visit: '' });
          }}
          disabled={isLoading}
        />
        {errors.best_time_to_visit && (
          <p className="text-sm text-destructive">{errors.best_time_to_visit}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-location-last-visited">Last Visited</Label>
        <div className="relative">
          <Input
            id="edit-location-last-visited"
            type="date"
            value={lastVisited}
            onChange={(e) => {
              setLastVisited(e.target.value);
              setErrors({ ...errors, last_visited: '' });
            }}
            disabled={isLoading}
            max={new Date().toISOString().split('T')[0]}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
        {errors.last_visited && (
          <p className="text-sm text-destructive">{errors.last_visited}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Visibility</Label>
        <VisibilitySelector
          value={visibility}
          onChange={setVisibility}
          disabled={isLoading}
        />
      </div>

      {collections.length > 0 && (
        <div className="space-y-2">
          <Label>Collection</Label>
          <CollectionSelector
            value={collectionId}
            onChange={setCollectionId}
            disabled={isLoading}
          />
        </div>
      )}

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
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
