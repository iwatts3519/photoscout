'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MapPin,
  Search,
  Clock,
  Bookmark,
} from 'lucide-react';
import { useTripPlannerStore, useIsAddStopDialogOpen, type DraftStop } from '@/src/stores/tripPlannerStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { cn } from '@/lib/utils';

export function AddStopDialog() {
  const isOpen = useIsAddStopDialogOpen();
  const closeDialog = useTripPlannerStore((state) => state.closeAddStopDialog);
  const addStop = useTripPlannerStore((state) => state.addStop);
  const savedLocations = useLocationStore((state) => state.savedLocations);

  const [activeTab, setActiveTab] = useState<'saved' | 'custom'>('saved');
  const [searchQuery, setSearchQuery] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');

  // Custom location state
  const [customName, setCustomName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setDuration('60');
      setNotes('');
      setCustomName('');
      setCustomLat('');
      setCustomLng('');
      setActiveTab('saved');
    }
  }, [isOpen]);

  // Filter saved locations
  const filteredLocations = savedLocations.filter((location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectSavedLocation = (location: typeof savedLocations[0]) => {
    // Extract coordinates from location
    let lat = 0;
    let lng = 0;

    if (typeof location.coordinates === 'object' && location.coordinates !== null) {
      const coords = location.coordinates as { lat?: number; lng?: number };
      lat = coords.lat ?? 0;
      lng = coords.lng ?? 0;
    }

    const durationMinutes = parseInt(duration, 10) || 60;

    const stop: DraftStop = {
      id: `temp-${Date.now()}`,
      location_id: location.id,
      planned_duration_minutes: durationMinutes,
      notes: notes || undefined,
      display_name: location.name,
      coordinates: { lat, lng },
    };

    addStop(stop);
    closeDialog();
  };

  const handleAddCustomLocation = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);

    if (isNaN(lat) || isNaN(lng) || !customName.trim()) {
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return;
    }

    const durationMinutes = parseInt(duration, 10) || 60;

    const stop: DraftStop = {
      id: `temp-${Date.now()}`,
      custom_name: customName.trim(),
      custom_lat: lat,
      custom_lng: lng,
      planned_duration_minutes: durationMinutes,
      notes: notes || undefined,
      display_name: customName.trim(),
      coordinates: { lat, lng },
    };

    addStop(stop);
    closeDialog();
  };

  const isCustomValid =
    customName.trim() !== '' &&
    !isNaN(parseFloat(customLat)) &&
    !isNaN(parseFloat(customLng)) &&
    parseFloat(customLat) >= -90 &&
    parseFloat(customLat) <= 90 &&
    parseFloat(customLng) >= -180 &&
    parseFloat(customLng) <= 180;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Stop</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'saved' | 'custom')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="saved">
              <Bookmark className="h-4 w-4 mr-2" />
              Saved Locations
            </TabsTrigger>
            <TabsTrigger value="custom">
              <MapPin className="h-4 w-4 mr-2" />
              Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="flex-1 flex flex-col overflow-hidden mt-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search saved locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Location List */}
            <ScrollArea className="flex-1 -mx-6 px-6">
              {filteredLocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {savedLocations.length === 0
                    ? 'No saved locations yet'
                    : 'No locations match your search'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => handleSelectSavedLocation(location)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left',
                        'hover:bg-accent hover:border-accent-foreground/20',
                        'transition-colors'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{location.name}</div>
                          {location.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {location.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Duration for saved location */}
            <div className="pt-4 border-t mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="saved-duration" className="flex-shrink-0">
                  Stay duration
                </Label>
                <Input
                  id="saved-duration"
                  type="number"
                  min="0"
                  max="1440"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="flex-1 flex flex-col mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-name">Location Name *</Label>
              <Input
                id="custom-name"
                placeholder="e.g., Home, Parking Spot"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="custom-lat">Latitude *</Label>
                <Input
                  id="custom-lat"
                  type="number"
                  step="any"
                  placeholder="e.g., 51.5074"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-lng">Longitude *</Label>
                <Input
                  id="custom-lng"
                  type="number"
                  step="any"
                  placeholder="e.g., -0.1278"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="custom-duration" className="flex-shrink-0">
                Stay duration
              </Label>
              <Input
                id="custom-duration"
                type="number"
                min="0"
                max="1440"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-notes">Notes (optional)</Label>
              <Input
                id="custom-notes"
                placeholder="e.g., Meet at cafe"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              onClick={handleAddCustomLocation}
              disabled={!isCustomValid}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Add Custom Stop
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
