'use client';

import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, MapPin } from 'lucide-react';
import { createLocation } from '@/app/actions/locations';
import { useLocationStore } from '@/src/stores/locationStore';
import { toast } from 'sonner';

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  tags: z.string().optional(), // Comma-separated tags
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const addLocation = useLocationStore((state) => state.addLocation);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const result = locationSchema.safeParse({ name, description, tags });
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
        is_public: false,
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
