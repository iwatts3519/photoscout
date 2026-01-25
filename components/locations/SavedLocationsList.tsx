'use client';

import { useEffect, useState, useCallback } from 'react';
import { LocationCard } from './LocationCard';
import { Button } from '@/components/ui/button';
import { Loader2, MapPinned, Download, FileJson, FileText } from 'lucide-react';
import { fetchUserLocations } from '@/app/actions/locations';
import { fetchUserCollections } from '@/app/actions/collections';
import { useLocationStore } from '@/src/stores/locationStore';
import { useCollectionStore } from '@/src/stores/collectionStore';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';
import { CollectionFilter } from './CollectionFilter';
import { CollectionManager } from './CollectionManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditLocationForm } from './EditLocationForm';
import { exportToJSON, exportToGPX, downloadFile, generateFilename } from '@/lib/utils/export';
import type { SavedLocation } from '@/src/stores/locationStore';

export function SavedLocationsList() {
  const { user } = useAuth();
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const setSavedLocations = useLocationStore((state) => state.setSavedLocations);
  const isLoading = useLocationStore((state) => state.isLoading);
  const setIsLoading = useLocationStore((state) => state.setIsLoading);

  const collections = useCollectionStore((state) => state.collections);
  const setCollections = useCollectionStore((state) => state.setCollections);
  const selectedCollectionId = useCollectionStore(
    (state) => state.selectedCollectionId
  );

  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(
    null
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Load locations and collections in parallel
      const [locationsResult, collectionsResult] = await Promise.all([
        fetchUserLocations(),
        fetchUserCollections(),
      ]);

      if (locationsResult.error) {
        toast.error('Failed to load saved locations', {
          description: locationsResult.error,
        });
      } else if (locationsResult.data) {
        setSavedLocations(locationsResult.data);
      }

      if (collectionsResult.data) {
        setCollections(collectionsResult.data);
      }

      setIsLoading(false);
    } catch (err) {
      toast.error('Failed to load saved locations', {
        description:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      });
      setIsLoading(false);
    }
  }, [setIsLoading, setSavedLocations, setCollections]);

  // Fetch saved locations and collections on mount
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleRefresh = () => {
    loadData();
  };

  const handleExportJSON = () => {
    if (savedLocations.length === 0) {
      toast.error('No locations to export');
      return;
    }
    const json = exportToJSON(savedLocations);
    const filename = generateFilename('photoscout-locations', 'json');
    downloadFile(json, filename, 'application/json');
    toast.success(`Exported ${savedLocations.length} locations to JSON`);
  };

  const handleExportGPX = () => {
    if (savedLocations.length === 0) {
      toast.error('No locations to export');
      return;
    }
    const gpx = exportToGPX(savedLocations);
    const filename = generateFilename('photoscout-locations', 'gpx');
    downloadFile(gpx, filename, 'application/gpx+xml');
    toast.success(`Exported ${savedLocations.length} locations to GPX`);
  };

  // Filter locations based on selected collection
  const filteredLocations = selectedCollectionId
    ? selectedCollectionId === 'uncategorized'
      ? savedLocations.filter((loc) => !loc.collection_id)
      : savedLocations.filter((loc) => loc.collection_id === selectedCollectionId)
    : savedLocations;

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
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium flex-shrink-0">
            Saved ({filteredLocations.length})
          </h3>
          <div className="flex items-center gap-1">
            {collections.length > 0 && <CollectionFilter />}
            <CollectionManager />
            {savedLocations.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    title="Export all locations"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="mr-2 h-4 w-4" />
                    Export as JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportGPX}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as GPX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredLocations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {selectedCollectionId
                ? 'No locations in this collection'
                : 'No saved locations'}
            </p>
          ) : (
            filteredLocations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onEdit={setEditingLocation}
              />
            ))
          )}
        </div>
      </div>

      {/* Edit Location Dialog */}
      <Dialog
        open={editingLocation !== null}
        onOpenChange={(open) => !open && setEditingLocation(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
