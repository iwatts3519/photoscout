'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { createLocation } from '@/app/actions/locations';
import { useLocationStore } from '@/src/stores/locationStore';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { CollectionSelector } from './CollectionSelector';
import { VisibilitySelector } from './VisibilitySelector';
import { toast } from 'sonner';
import type { Visibility } from '@/src/types/community.types';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  tags: z.string().optional(), // Comma-separated tags
  notes: z.string().max(2000, 'Notes are too long').optional(),
  best_time_to_visit: z.string().max(500, 'Best time is too long').optional(),
});

interface SaveLocationFormProps {
  coordinates: { lat: number; lng: number };
  radius: number;
  onSuccess?: () => void;
}

export function SaveLocationForm({
  coordinates,
  radius,
  onSuccess,
}: SaveLocationFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const addLocation = useLocationStore((state) => state.addLocation);
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

      const { data, error } = await createLocation({
        name: result.data.name,
        description: result.data.description,
        coordinates,
        radius_meters: radius,
        tags: tagArray.length > 0 ? tagArray : undefined,
        visibility,
        collection_id: collectionId,
        notes: result.data.notes,
        best_time_to_visit: result.data.best_time_to_visit,
      });

      if (error) {
        toast.error('Failed to save location', {
          description: error,
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        // Add to store for immediate UI update
        addLocation(data);

        // Show success message
        toast.success('Location saved', {
          description: `${data.name} has been saved to your locations.`,
        });

        // Reset form
        setName('');
        setDescription('');
        setTags('');
        setNotes('');
        setBestTimeToVisit('');
        setVisibility('private');
        setCollectionId(null);
        setShowAdvanced(false);

        // Call success callback
        onSuccess?.();
      }

      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to save location', {
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>
          {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location-name">Location Name *</Label>
        <Input
          id="location-name"
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
        <Label htmlFor="location-description">Description</Label>
        <Input
          id="location-description"
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
        <Label htmlFor="location-tags">Tags</Label>
        <Input
          id="location-tags"
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

      {/* Expandable advanced options */}
      <div className="border rounded-lg">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-3 text-sm font-medium text-left hover:bg-accent/50 transition-colors"
          disabled={isLoading}
        >
          <span>More details (optional)</span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showAdvanced && (
          <div className="p-3 pt-0 space-y-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="location-notes">Notes</Label>
              <Textarea
                id="location-notes"
                placeholder="Detailed notes about parking, access, best angles, hazards..."
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setErrors({ ...errors, notes: '' });
                }}
                disabled={isLoading}
                rows={3}
                className="resize-none"
              />
              {errors.notes && (
                <p className="text-sm text-destructive">{errors.notes}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-best-time">Best Time to Visit</Label>
              <Input
                id="location-best-time"
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
                <p className="text-sm text-destructive">
                  {errors.best_time_to_visit}
                </p>
              )}
            </div>
          </div>
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

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Location
          </>
        )}
      </Button>
    </form>
  );
}
