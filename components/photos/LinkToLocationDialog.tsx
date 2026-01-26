'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Loader2, Check, X } from 'lucide-react';
import { linkPhotoToLocationAction } from '@/app/actions/photos';
import { useLocationStore } from '@/src/stores/locationStore';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import { toast } from 'sonner';
import type { UserPhoto } from '@/src/types/photo.types';

interface LinkToLocationDialogProps {
  photo: UserPhoto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkToLocationDialog({
  photo,
  isOpen,
  onClose,
  onSuccess,
}: LinkToLocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    photo.location_id
  );

  const { savedLocations } = useLocationStore();
  const { updatePhoto, updateLocationPhotoCount } = usePhotoLibraryStore();

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { data, error } = await linkPhotoToLocationAction(
      photo.id,
      selectedLocationId
    );

    if (error) {
      toast.error('Failed to link photo', { description: error });
      setIsSubmitting(false);
      return;
    }

    if (data) {
      // Update photo in store
      updatePhoto(photo.id, { location_id: selectedLocationId });

      // Update location photo counts
      if (photo.location_id && photo.location_id !== selectedLocationId) {
        updateLocationPhotoCount(photo.location_id, -1);
      }
      if (selectedLocationId && selectedLocationId !== photo.location_id) {
        updateLocationPhotoCount(selectedLocationId, 1);
      }

      toast.success(
        selectedLocationId ? 'Photo linked to location' : 'Photo unlinked'
      );
      onSuccess();
      onClose();
    }

    setIsSubmitting(false);
  };

  const hasChanges = selectedLocationId !== photo.location_id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link to Location</DialogTitle>
          <DialogDescription>
            Select a saved location to link this photo to, or remove the
            existing link.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-64">
          <div className="space-y-1">
            {/* No location option */}
            <button
              onClick={() => setSelectedLocationId(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                selectedLocationId === null
                  ? 'bg-primary/10 border-primary border'
                  : 'hover:bg-muted border border-transparent'
              }`}
            >
              <X className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">No location</span>
              {selectedLocationId === null && (
                <Check className="h-4 w-4 text-primary ml-auto" />
              )}
            </button>

            {/* Location options */}
            {savedLocations.map((location) => (
              <button
                key={location.id}
                onClick={() => setSelectedLocationId(location.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  selectedLocationId === location.id
                    ? 'bg-primary/10 border-primary border'
                    : 'hover:bg-muted border border-transparent'
                }`}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{location.name}</p>
                  {location.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {location.description}
                    </p>
                  )}
                </div>
                {selectedLocationId === location.id && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>

        {savedLocations.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No saved locations yet. Save locations on the map first.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!hasChanges || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
