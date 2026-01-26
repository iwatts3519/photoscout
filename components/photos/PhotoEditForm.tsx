'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X, MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updatePhotoAction } from '@/app/actions/photos';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { toast } from 'sonner';
import type { UserPhoto } from '@/src/types/photo.types';

const editPhotoSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  is_public: z.boolean().optional(),
  location_id: z.string().nullable().optional(),
});

type EditPhotoFormData = z.infer<typeof editPhotoSchema>;

interface PhotoEditFormProps {
  photo: UserPhoto;
  onSuccess: () => void;
}

export function PhotoEditForm({ photo, onSuccess }: PhotoEditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>(photo.tags || []);
  const [newTag, setNewTag] = useState('');

  const { updatePhoto, addTag: addToAvailableTags } = usePhotoLibraryStore();
  const { savedLocations } = useLocationStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditPhotoFormData>({
    resolver: zodResolver(editPhotoSchema),
    defaultValues: {
      title: photo.title || '',
      description: photo.description || '',
      is_public: photo.is_public,
      location_id: photo.location_id,
    },
  });

  const isPublic = watch('is_public');
  const locationId = watch('location_id');

  // Check if tags changed
  const tagsChanged =
    JSON.stringify(tags.sort()) !== JSON.stringify((photo.tags || []).sort());
  const hasChanges = isDirty || tagsChanged;

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 20) {
      setTags([...tags, trimmed]);
      addToAvailableTags(trimmed);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onSubmit = async (data: EditPhotoFormData) => {
    setIsSubmitting(true);

    const updates = {
      title: data.title || null,
      description: data.description || null,
      is_public: data.is_public,
      location_id: data.location_id || null,
      tags: tags.length > 0 ? tags : null,
    };

    const { data: updatedPhoto, error } = await updatePhotoAction(photo.id, updates);

    if (error) {
      toast.error('Failed to update photo', { description: error });
      setIsSubmitting(false);
      return;
    }

    if (updatedPhoto) {
      // Update store
      updatePhoto(photo.id, updatedPhoto);
      toast.success('Photo updated');
      onSuccess();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Give your photo a title"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Add a description..."
          rows={3}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleTagKeyDown}
            maxLength={50}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddTag}
            disabled={!newTag.trim() || tags.length >= 20}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {tags.length}/20 tags
        </p>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Linked Location</Label>
        <Select
          value={locationId || 'none'}
          onValueChange={(value) =>
            setValue('location_id', value === 'none' ? null : value, {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a location">
              {locationId ? (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {savedLocations.find((l) => l.id === locationId)?.name ||
                    'Unknown location'}
                </span>
              ) : (
                'No location linked'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No location</SelectItem>
            {savedLocations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {location.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {savedLocations.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Save locations on the map to link photos to them
          </p>
        )}
      </div>

      {/* Public toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="is_public">Public</Label>
          <p className="text-xs text-muted-foreground">
            Allow others to see this photo
          </p>
        </div>
        <Switch
          id="is_public"
          checked={isPublic}
          onCheckedChange={(checked) =>
            setValue('is_public', checked, { shouldDirty: true })
          }
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        disabled={!hasChanges || isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
}
