'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  GripVertical,
  Trash2,
  Clock,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useTripPlannerStore, type DraftStop } from '@/src/stores/tripPlannerStore';
import { formatDuration, formatDistance } from '@/src/types/trips.types';
import { cn } from '@/lib/utils';

interface TripStopCardProps {
  stop: DraftStop;
  index: number;
  isLast: boolean;
  distanceToNext?: number;
  durationToNext?: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function TripStopCard({
  stop,
  index,
  isLast,
  distanceToNext,
  durationToNext,
  onDragStart,
  onDragEnd,
}: TripStopCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDuration, setEditDuration] = useState(stop.planned_duration_minutes.toString());
  const [editNotes, setEditNotes] = useState(stop.notes || '');

  const updateStop = useTripPlannerStore((state) => state.updateStop);
  const removeStop = useTripPlannerStore((state) => state.removeStop);

  const handleSaveEdit = () => {
    const duration = parseInt(editDuration, 10);
    if (!isNaN(duration) && duration >= 0) {
      updateStop(stop.id, {
        planned_duration_minutes: duration,
        notes: editNotes || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditDuration(stop.planned_duration_minutes.toString());
    setEditNotes(stop.notes || '');
    setIsEditing(false);
  };

  const handleRemove = () => {
    removeStop(stop.id);
  };

  return (
    <div className="relative">
      {/* Stop Card */}
      <div
        className={cn(
          'border rounded-lg bg-card transition-shadow',
          isExpanded && 'shadow-md'
        )}
      >
        {/* Main Row */}
        <div className="flex items-center gap-2 p-3">
          {/* Drag Handle */}
          <button
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            onMouseDown={onDragStart}
            onMouseUp={onDragEnd}
            onTouchStart={onDragStart}
            onTouchEnd={onDragEnd}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Stop Number */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
            {index + 1}
          </div>

          {/* Stop Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{stop.display_name}</span>
            </div>
            {stop.planned_duration_minutes > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <Clock className="h-3 w-3" />
                <span>Stay: {formatDuration(stop.planned_duration_minutes * 60)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-0 border-t mt-2 pt-3 space-y-3">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor={`duration-${stop.id}`}>Stay Duration (minutes)</Label>
                  <Input
                    id={`duration-${stop.id}`}
                    type="number"
                    min="0"
                    max="1440"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`notes-${stop.id}`}>Notes</Label>
                  <Input
                    id={`notes-${stop.id}`}
                    type="text"
                    placeholder="Notes for this stop..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  <div>
                    Coordinates: {stop.coordinates.lat.toFixed(5)}, {stop.coordinates.lng.toFixed(5)}
                  </div>
                  {stop.notes && (
                    <div className="mt-1">Notes: {stop.notes}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit Details
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Route Info to Next Stop */}
      {!isLast && (distanceToNext !== undefined || durationToNext !== undefined) && (
        <div className="flex items-center gap-2 py-2 pl-6 text-sm text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
          {durationToNext !== undefined && (
            <span>{formatDuration(durationToNext)}</span>
          )}
          {distanceToNext !== undefined && durationToNext !== undefined && (
            <span className="text-muted-foreground/50">|</span>
          )}
          {distanceToNext !== undefined && (
            <span>{formatDistance(distanceToNext)}</span>
          )}
        </div>
      )}

      {/* Simple connector line when no route info */}
      {!isLast && distanceToNext === undefined && durationToNext === undefined && (
        <div className="flex items-center py-2 pl-6">
          <ArrowDown className="h-4 w-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
