'use client';

import { useEffect, useState, useCallback } from 'react';
import { LocationCard } from './LocationCard';
import { Button } from '@/components/ui/button';
import { Loader2, MapPinned } from 'lucide-react';
import { fetchUserLocations } from '@/app/actions/locations';
import { useLocationStore } from '@/src/stores/locationStore';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditLocationForm } from './EditLocationForm';
import type { SavedLocation } from '@/src/stores/locationStore';

export function SavedLocationsList() {
  const { user } = useAuth();
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const setSavedLocations = useLocationStore((state) => state.setSavedLocations);
  const isLoading = useLocationStore((state) => state.isLoading);
  const setIsLoading = useLocationStore((state) => state.setIsLoading);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(
    null
  );

  const loadLocations = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await fetchUserLocations();

      if (error) {
        toast.error('Failed to load saved locations', {
          description: error,
        });
        setIsLoading(false);
        return;
      }

      if (data) {
        setSavedLocations(data);
      }

      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to load saved locations', {
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  }, [setIsLoading, setSavedLocations]);

  // Fetch saved locations on mount
  useEffect(() => {
    if (user) {
      loadLocations();
    }
  }, [user, loadLocations]);

  const handleRefresh = () => {
    loadLocations();
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (savedLocations.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <MapPinned className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          No saved locations yet. Select a location on the map and save it to
          get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            Saved Locations ({savedLocations.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 text-xs"
          >
            Refresh
          </Button>
        </div>

        <div className="space-y-2">
          {savedLocations.map((location) => (
            <LocationCard
              key={location.id}
              location={location}
              onEdit={setEditingLocation}
            />
          ))}
        </div>
      </div>

      {/* Edit Location Dialog */}
      <Dialog
        open={editingLocation !== null}
        onOpenChange={(open) => !open && setEditingLocation(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the details for this saved location.
            </DialogDescription>
          </DialogHeader>
          {editingLocation && (
            <EditLocationForm
              location={editingLocation}
              onSuccess={() => setEditingLocation(null)}
              onCancel={() => setEditingLocation(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
