# Phase 13: Route Planning

**Status**: 📋 Planned
**Completion**: 0%

## Goal
Enable photographers to plan multi-location shoots with route optimization, travel time estimates, and exportable itineraries.

## Overview

**Core Concept**: Users create "trips" with multiple photography locations, get optimal route suggestions, see travel times between stops, and export the route for navigation.

**Routing API**: OpenRouteService (free tier: 2000 requests/day)

---

## Sub-Phases

### Phase 13A: Trips Database Schema

**Goal**: Create data model for multi-location trips.

**Database Schema**:
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trip_date DATE,
  start_time TIME,
  transport_mode TEXT DEFAULT 'driving' CHECK (transport_mode IN ('driving', 'walking', 'cycling')),
  total_distance_meters INTEGER,
  total_duration_seconds INTEGER,
  is_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trip_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  custom_name TEXT,
  custom_lat FLOAT,
  custom_lng FLOAT,
  stop_order INTEGER NOT NULL,
  planned_arrival TIME,
  planned_duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  distance_to_next_meters INTEGER,
  duration_to_next_seconds INTEGER,
  route_geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX trip_stops_trip_id_idx ON trip_stops(trip_id);
CREATE INDEX trip_stops_order_idx ON trip_stops(trip_id, stop_order);
```

**Files to Create**:
- `supabase/migrations/20260123000001_add_trips.sql`
- `src/types/trips.types.ts`
- `lib/queries/trips.ts`
- `app/actions/trips.ts`

---

### Phase 13B: OpenRouteService Integration

**Goal**: Integrate routing API for directions and travel times.

**API Endpoints**:
- `POST /v2/directions/{profile}` - Get route between points
- Profiles: `driving-car`, `foot-walking`, `cycling-regular`

**Files to Create**:
- `lib/api/openrouteservice.ts` - API client
- `src/types/routing.types.ts` - Route types
- `app/actions/routing.ts` - Server actions

---

### Phase 13C: Trip Planner UI

**Goal**: Build interface for creating and editing trips.

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🗺️ Plan Trip: Lake District Sunrise                    [✕]  │
├─────────────────────────────────────────────────────────────┤
│ Date: [📅 Jan 25, 2026]  Start: [05:00]  Mode: [🚗 Driving] │
├──────────────────────────┬──────────────────────────────────┤
│ Stops                    │                                  │
│ ─────────────────────────│                                  │
│ 1. 📍 Home               │         MAP                      │
│    ↓ 45 min (32 km)      │    (shows route polyline)        │
│ 2. 📍 Castlerigg Stone   │                                  │
│    ⏱️ Stay: 1h 30m        │         ━━━━━━━                  │
│    🌅 Golden: 07:15-07:52│            ╲                     │
│    ↓ 20 min (15 km)      │             ╲                    │
│ 3. 📍 Derwentwater       │              ●━━━●               │
│    ⏱️ Stay: 2h           │                                  │
│    ↓ 35 min (28 km)      │                                  │
│ 4. 📍 Home               │                                  │
│                          │                                  │
│ [+ Add Stop]             │                                  │
├──────────────────────────┴──────────────────────────────────┤
│ Total: 4 stops • 75 km • 1h 40m driving • 3h 30m shooting   │
├─────────────────────────────────────────────────────────────┤
│ [Cancel]  [Optimize Route]  [Export GPX]  [Save Trip]       │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create**:
- `components/trips/TripPlanner.tsx`
- `components/trips/TripStopList.tsx`
- `components/trips/TripStopCard.tsx`
- `components/trips/AddStopDialog.tsx`
- `components/trips/TripSummary.tsx`
- `src/stores/tripPlannerStore.ts`

---

### Phase 13D: Route Display on Map

**Goal**: Show planned route on the map with markers and polyline.

**Files to Create**:
- `components/map/TripRouteLayer.tsx`
- `components/map/TripStopMarkers.tsx`
- `lib/utils/route-geometry.ts` - GeoJSON utilities

---

### Phase 13E: Route Optimization

**Goal**: Suggest optimal stop order to minimize travel time.

**Files to Create**:
- `lib/trips/route-optimizer.ts`
- `components/trips/OptimizationDialog.tsx`

---

### Phase 13F: Trip Export & Sharing

**Goal**: Export trips for use in navigation apps.

**Files to Create**:
- `lib/trips/export-gpx.ts`
- `lib/trips/export-kml.ts`
- `components/trips/TripExportDialog.tsx`
- `app/trip/[id]/page.tsx` - Shareable trip page

---

## Technical Considerations

**OpenRouteService Setup**:
```env
OPENROUTESERVICE_API_KEY=your_api_key
```

**Rate Limiting**:
- Free tier: 2000 requests/day
- Cache calculated routes
- Batch waypoint calculations

**Performance**:
- Only calculate routes when stops change
- Debounce route recalculation
- Show loading state during route calculation

---

## Success Criteria
- [ ] Users can create trips with multiple stops
- [ ] Routes calculated with travel times between stops
- [ ] Route displayed on map with polyline
- [ ] Drag-to-reorder stops works smoothly
- [ ] Route optimization suggests better order
- [ ] Export to GPX/KML works
- [ ] All tests pass
- [ ] Production build succeeds
