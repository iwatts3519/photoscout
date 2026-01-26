'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Trash2, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getSignedUrl } from '@/lib/supabase/storage';
import { deletePhotoAction } from '@/app/actions/photos';
import { ExifDisplay } from './ExifDisplay';
import { PhotoEditForm } from './PhotoEditForm';
import { usePhotoLibraryStore } from '@/src/stores/photoLibraryStore';
import { toast } from 'sonner';
import type { UserPhotoWithLocation } from '@/src/types/photo.types';
import { formatDateTaken } from '@/src/types/photo.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PhotoDetailDialogProps {
  photo: UserPhotoWithLocation | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function PhotoDetailDialog({
  photo,
  isOpen,
  onClose,
  onUpdate,
}: PhotoDetailDialogProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { removePhoto, updateStorageUsage } = usePhotoLibraryStore();

  // Load image URL
  useEffect(() => {
    if (!photo || !isOpen) {
      setImageUrl(null);
      setIsLoadingImage(true);
      return;
    }

    let isMounted = true;

    const loadImage = async () => {
      setIsLoadingImage(true);
      const supabase = createClient();
      const url = await getSignedUrl(supabase, photo.storage_path);

      if (isMounted) {
        setImageUrl(url);
        setIsLoadingImage(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [photo, isOpen]);

  const handleDelete = async () => {
    if (!photo) return;

    setIsDeleting(true);
    const { error } = await deletePhotoAction(photo.id);

    if (error) {
      toast.error('Failed to delete photo', { description: error });
      setIsDeleting(false);
      return;
    }

    // Update store
    removePhoto(photo.id);
    updateStorageUsage(-photo.file_size);

    toast.success('Photo deleted');
    onClose();
    onUpdate();
    setIsDeleting(false);
  };

  const handleEditSuccess = () => {
    setActiveTab('details');
    onUpdate();
  };

  if (!photo) return null;

  const dateTaken = formatDateTaken(photo);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Image Section */}
          <div className="md:w-2/3 bg-black flex items-center justify-center min-h-[300px] md:min-h-0">
            {isLoadingImage ? (
              <Loader2 className="h-8 w-8 text-white/50 animate-spin" />
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt={photo.title || photo.original_filename}
                className="max-w-full max-h-[60vh] md:max-h-[90vh] object-contain"
              />
            ) : (
              <Camera className="h-16 w-16 text-white/30" />
            )}
          </div>

          {/* Info Section */}
          <div className="md:w-1/3 flex flex-col border-l overflow-hidden">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg truncate pr-8">
                {photo.title || photo.original_filename}
              </DialogTitle>
              {dateTaken && (
                <p className="text-sm text-muted-foreground">{dateTaken}</p>
              )}
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start border-b rounded-none h-auto p-0">
                <TabsTrigger
                  value="details"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="edit"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  Edit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="flex-1 overflow-y-auto p-4 space-y-4 mt-0">
                {/* Description */}
                {photo.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {photo.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                {photo.location_name && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Location</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{photo.location_name}</span>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {photo.tags && photo.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-muted rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* EXIF Data */}
                <ExifDisplay photo={photo} />

                {/* GPS Coordinates */}
                {photo.exif_latitude && photo.exif_longitude && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">GPS Coordinates</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {photo.exif_latitude.toFixed(6)}, {photo.exif_longitude.toFixed(6)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        asChild
                      >
                        <a
                          href={`https://www.google.com/maps?q=${photo.exif_latitude},${photo.exif_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="flex-1 overflow-y-auto p-4 mt-0">
                <PhotoEditForm photo={photo} onSuccess={handleEditSuccess} />
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="p-4 border-t flex items-center justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this photo? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
