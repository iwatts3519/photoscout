'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Route,
  Save,
  Loader2,
  Car,
  Footprints,
  Bike,
  Calculator,
  Calendar,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import { TripStopList } from './TripStopList';
import { TripSummary } from './TripSummary';
import { AddStopDialog } from './AddStopDialog';
import {
  useTripPlannerStore,
  useIsTripPlannerOpen,
  useCurrentTrip,
  useTripStops,
  useHasUnsavedChanges,
} from '@/src/stores/tripPlannerStore';
import {
  createTripAction,
  updateTripAction,
  addTripStopAction,
} from '@/app/actions/trips';
import { calculateTripRouteAction } from '@/app/actions/routing';
import { TRANSPORT_MODE_INFO, type TransportMode } from '@/src/types/trips.types';

export function TripPlanner() {
  const isOpen = useIsTripPlannerOpen();
  const currentTrip = useCurrentTrip();
  const stops = useTripStops();
  const hasUnsavedChanges = useHasUnsavedChanges();

  const closeTripPlanner = useTripPlannerStore((state) => state.closeTripPlanner);
  const setTripName = useTripPlannerStore((state) => state.setTripName);
  const setTripDate = useTripPlannerStore((state) => state.setTripDate);
  const setStartTime = useTripPlannerStore((state) => state.setStartTime);
  const setTransportMode = useTripPlannerStore((state) => state.setTransportMode);
  const setRouteCalculation = useTripPlannerStore((state) => state.setRouteCalculation);
  const setIsCalculatingRoute = useTripPlannerStore((state) => state.setIsCalculatingRoute);
  const isCalculatingRoute = useTripPlannerStore((state) => state.isCalculatingRoute);
  const addUserTrip = useTripPlannerStore((state) => state.addUserTrip);
  const resetChanges = useTripPlannerStore((state) => state.resetChanges);

  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const isNewTrip = !currentTrip?.id;

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      closeTripPlanner();
    }
  }, [hasUnsavedChanges, closeTripPlanner]);

  const handleConfirmDiscard = () => {
    setShowDiscardDialog(false);
    closeTripPlanner();
  };

  // Calculate route
  const handleCalculateRoute = async () => {
    if (!currentTrip?.id || stops.length < 2) {
      toast.error('Save the trip first and add at least 2 stops');
      return;
    }

    setIsCalculatingRoute(true);

    try {
      const { data, error } = await calculateTripRouteAction(currentTrip.id);

      if (error) {
        toast.error('Failed to calculate route', { description: error });
        return;
      }

      if (data) {
        setRouteCalculation(data);
        toast.success('Route calculated');
      }
    } catch {
      toast.error('Failed to calculate route');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Save trip
  const handleSave = async () => {
    if (!currentTrip) return;

    if (!currentTrip.name.trim()) {
      toast.error('Please enter a trip name');
      return;
    }

    setIsSaving(true);

    try {
      if (isNewTrip) {
        // Create new trip
        const { data: tripData, error: tripError } = await createTripAction({
          name: currentTrip.name,
          description: currentTrip.description,
          trip_date: currentTrip.trip_date,
          start_time: currentTrip.start_time,
          transport_mode: currentTrip.transport_mode,
        });

        if (tripError || !tripData) {
          toast.error('Failed to create trip', { description: tripError || 'Unknown error' });
          return;
        }

        // Add stops to the trip
        for (let i = 0; i < stops.length; i++) {
          const stop = stops[i];
          const { error: stopError } = await addTripStopAction({
            trip_id: tripData.id,
            location_id: stop.location_id,
            custom_name: stop.custom_name,
            custom_coordinates: stop.custom_lat && stop.custom_lng
              ? { lat: stop.custom_lat, lng: stop.custom_lng }
              : undefined,
            stop_order: i,
            planned_duration_minutes: stop.planned_duration_minutes,
            notes: stop.notes,
          });

          if (stopError) {
            console.error('Failed to add stop:', stopError);
          }
        }

        // Add to user trips list
        addUserTrip(tripData);

        toast.success('Trip created', {
          description: `${tripData.name} has been saved`,
        });

        resetChanges();
        closeTripPlanner();
      } else {
        // Update existing trip
        const { error: updateError } = await updateTripAction(currentTrip.id!, {
          name: currentTrip.name,
          description: currentTrip.description,
          trip_date: currentTrip.trip_date || null,
          start_time: currentTrip.start_time || null,
          transport_mode: currentTrip.transport_mode,
        });

        if (updateError) {
          toast.error('Failed to update trip', { description: updateError });
          return;
        }

        toast.success('Trip updated');
        resetChanges();
      }
    } catch (err) {
      toast.error('Failed to save trip');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const transportModeIcon = {
    driving: Car,
    walking: Footprints,
    cycling: Bike,
  };

  const CurrentModeIcon = transportModeIcon[currentTrip?.transport_mode || 'driving'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              <DialogTitle>
                {isNewTrip ? 'Plan New Trip' : 'Edit Trip'}
              </DialogTitle>
            </div>
            <DialogDescription>
              Plan your photography route with multiple stops
            </DialogDescription>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Trip Details */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trip-name">Trip Name *</Label>
                    <Input
                      id="trip-name"
                      placeholder="e.g., Lake District Sunrise"
                      value={currentTrip?.name || ''}
                      onChange={(e) => setTripName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Date */}
                    <div className="space-y-2">
                      <Label htmlFor="trip-date" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </Label>
                      <Input
                        id="trip-date"
                        type="date"
                        value={currentTrip?.trip_date || ''}
                        onChange={(e) => setTripDate(e.target.value || undefined)}
                      />
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2">
                      <Label htmlFor="trip-time" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Start Time
                      </Label>
                      <Input
                        id="trip-time"
                        type="time"
                        value={currentTrip?.start_time || ''}
                        onChange={(e) => setStartTime(e.target.value || undefined)}
                      />
                    </div>

                    {/* Transport Mode */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        <CurrentModeIcon className="h-3 w-3" />
                        Mode
                      </Label>
                      <Select
                        value={currentTrip?.transport_mode || 'driving'}
                        onValueChange={(v) => setTransportMode(v as TransportMode)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TRANSPORT_MODE_INFO).map(([key, info]) => {
                            const Icon = transportModeIcon[key as TransportMode];
                            return (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {info.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Stops */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Stops</h3>
                    {stops.length >= 2 && currentTrip?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCalculateRoute}
                        disabled={isCalculatingRoute}
                      >
                        {isCalculatingRoute ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Calculating...
                          </>
                        ) : (
                          <>
                            <Calculator className="h-4 w-4 mr-2" />
                            Calculate Route
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  <TripStopList />
                </div>

                {/* Summary */}
                <TripSummary />
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !currentTrip?.name.trim()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isNewTrip ? 'Create Trip' : 'Save Changes'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Stop Dialog */}
      <AddStopDialog />
    </>
  );
}
