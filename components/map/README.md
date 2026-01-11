# Map Components

Map components for PhotoScout built with MapLibre GL JS and OpenStreetMap tiles.

## Components

### MapView
Main map component that renders the MapLibre map with user interactions.

**Features:**
- Click to select location and place marker
- Draggable marker to adjust location
- Syncs with map store (center, zoom, selected location)
- Mobile responsive
- Proper cleanup on unmount

**Usage:**
```tsx
import { MapView } from '@/components/map/MapView';

<MapView />
```

### MapControls
Floating control buttons for map interactions.

**Features:**
- Zoom in/out buttons
- "Locate me" button (uses device geolocation)
- Positioned in top-right corner
- Loading state for location request

**Props:**
```typescript
interface MapControlsProps {
  map: MapLibreMap | null;
  onLocateClick: () => void;
  isLocating?: boolean;
}
```

### RadiusOverlay
Displays a circle overlay showing the search radius around selected location.

**Features:**
- Uses Turf.js to create GeoJSON circle
- Semi-transparent fill with blue outline
- Updates dynamically when location or radius changes
- Automatic cleanup when location is deselected

**Props:**
```typescript
interface RadiusOverlayProps {
  map: MapLibreMap | null;
  location: MapLocation | null;
  radiusMeters: number;
}
```

## Map Configuration

**Default Settings:**
- Center: `[54.5, -3.5]` (center of UK)
- Zoom: `6`
- Min Zoom: `4`
- Max Zoom: `18`
- Tile Source: OpenStreetMap

**Attribution:**
OpenStreetMap tiles require attribution (automatically included in map).

## State Management

All map state is managed through Zustand store (`src/stores/mapStore.ts`):
- Selected location (lat/lng)
- Map center and zoom
- Search radius
- Selected marker ID

## Mobile Responsiveness

- Map takes full viewport height
- Controls positioned to avoid conflicts with mobile UI
- Touch-friendly marker dragging
- Geolocation supported on mobile devices

## Performance Notes

- Map instance created once and reused
- Proper cleanup prevents memory leaks
- Radius overlay uses efficient GeoJSON updates
- Debounced map move events to avoid excessive store updates
