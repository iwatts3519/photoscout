'use client';

import { useState } from 'react';
import { Clock, MapPin, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
  useLocationHistoryStore,
  formatRelativeTime,
  type HistoryLocation,
} from '@/src/stores/locationHistoryStore';
import { useMapStore } from '@/src/stores/mapStore';
import { cn } from '@/lib/utils';

interface RecentlyViewedProps {
  /** Maximum number of items to show initially */
  initialLimit?: number;
  /** Whether the section is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  defaultCollapsed?: boolean;
}

export function RecentlyViewed({
  initialLimit = 5,
  collapsible = true,
  defaultCollapsed = false,
}: RecentlyViewedProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [showAll, setShowAll] = useState(false);

  const { history, removeFromHistory, clearHistory } = useLocationHistoryStore();
  const { setSelectedLocation, mapInstance } = useMapStore();

  // Don't render if no history
  if (history.length === 0) {
    return null;
  }

  const displayedHistory = showAll ? history : history.slice(0, initialLimit);
  const hasMore = history.length > initialLimit;

  const handleLocationClick = (location: HistoryLocation) => {
    setSelectedLocation({ lat: location.lat, lng: location.lng });

    // Fly to location if map instance exists
    if (mapInstance) {
      mapInstance.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(mapInstance.getZoom(), 12),
        duration: 1500,
      });
    }
  };

  const content = (
    <div className="space-y-2">
      {/* History list */}
      <div className="space-y-1">
        {displayedHistory.map((location) => (
          <HistoryItem
            key={location.id}
            location={location}
            onClick={() => handleLocationClick(location)}
            onRemove={() => removeFromHistory(location.id)}
          />
        ))}
      </div>

      {/* Show more/less toggle */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? (
            <>
              Show less
              <ChevronUp className="ml-1 h-3 w-3" />
            </>
          ) : (
            <>
              Show all ({history.length})
              <ChevronDown className="ml-1 h-3 w-3" />
            </>
          )}
        </Button>
      )}

      {/* Clear all button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Clear history
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear location history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {history.length} locations from your history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear history
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (!collapsible) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Recently Viewed</h3>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-0 hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Recently Viewed</span>
            <span className="text-xs text-muted-foreground">({history.length})</span>
          </div>
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{content}</CollapsibleContent>
    </Collapsible>
  );
}

interface HistoryItemProps {
  location: HistoryLocation;
  onClick: () => void;
  onRemove: () => void;
}

function HistoryItem({ location, onClick, onRemove }: HistoryItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md p-2 -mx-2',
        'hover:bg-accent cursor-pointer transition-colors'
      )}
    >
      <button
        onClick={onClick}
        className="flex flex-1 items-start gap-2 text-left min-w-0"
      >
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{location.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(location.viewedAt)}
          </p>
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Remove from history</span>
      </Button>
    </div>
  );
}
