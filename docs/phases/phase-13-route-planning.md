# Phase 13: Route Planning

**Status**: 🔄 In Progress
**Completion**: 80% (Phase 13A-13E Complete)

## Goal
Enable photographers to plan multi-location shoots with route optimization, travel time estimates, and exportable itineraries.

## Overview

**Core Concept**: Users create "trips" with multiple photography locations, get optimal route suggestions, see travel times between stops, and export the route for navigation.

**Routing API**: OpenRouteService (free tier: 2000 requests/day)

---

## Sub-Phases

### Phase 13A: Trips Database Schema ✅

**Status**: Complete

**Goal**: Create data model for multi-location trips.

**Files Created**:
- `supabase/migrations/20260127000001_add_trips.sql` - Migration with tables, RLS, and helper functions
- `src/types/trips.types.ts` - TypeScript types and Zod schemas
- `lib/queries/trips.ts` - Database query functions
- `app/actions/trips.ts` - Server actions for trip management

**Database Features**:
- `trips` table with transport mode, date/time, and totals
- `trip_stops` table with location references or custom coordinates
- RLS policies for user data isolation
- `reorder_trip_stops()` function for drag-to-reorder
- `get_trip_with_stops()` function for fetching complete trip data

---

### Phase 13B: OpenRouteService Integration ✅

**Status**: Complete

**Goal**: Integrate routing API for directions and travel times.

**Files Created**:
- `src/types/routing.types.ts` - API types, route types, polyline decoder, GeoJSON utilities
- `lib/api/openrouteservice.ts` - API client with caching and error handling
- `app/actions/routing.ts` - Server actions for route calculations

**Features**:
- Calculate routes between multiple coordinates
- Support for driving, walking, and cycling profiles
- Automatic route geometry in GeoJSON format
- Cache routes for 1 hour
- Trip route calculation with database updates
- Travel time estimates to saved locations

---

### Phase 13C: Trip Planner UI ✅

**Status**: Complete

**Goal**: Build interface for creating and editing trips.

**Files Created**:
- `src/stores/tripPlannerStore.ts` - Zustand store for trip planning state
- `components/trips/TripPlanner.tsx` - Main trip planning dialog
- `components/trips/TripStopList.tsx` - Draggable stop list with route info
- `components/trips/TripStopCard.tsx` - Individual stop card with edit/delete
- `components/trips/AddStopDialog.tsx` - Dialog to add saved or custom locations
- `components/trips/TripSummary.tsx` - Trip totals and estimated end time
- `components/trips/index.ts` - Barrel export

**Features**:
- Create/edit trips with name, date, start time, transport mode
- Add stops from saved locations or custom coordinates
- Drag-to-reorder stops
- Edit stop duration and notes
- Calculate route with travel times between stops
- Show trip summary (total distance, travel time, shooting time)
- Unsaved changes detection with discard confirmation

---

### Phase 13D: Route Display on Map ✅

**Status**: Complete

**Goal**: Show planned route on the map with markers and polyline.

**Files Created**:
- `components/map/TripRouteLayer.tsx`
- `components/map/TripStopMarkers.tsx`
- `lib/utils/route-geometry.ts` - GeoJSON utilities

---

### Phase 13E: Route Optimization ✅

**Status**: Complete

**Goal**: Suggest optimal stop order to minimize travel distance.

**Files Created**:
- `lib/trips/route-optimizer.ts` - NN + 2-opt optimization (client-side, Haversine distance)
- `components/trips/OptimizationDialog.tsx` - Before/after comparison dialog

**Files Modified**:
- `src/stores/tripPlannerStore.ts` - Added `setStopsOrder()` action for batch reordering
- `components/trips/TripPlanner.tsx` - Added "Optimize" button and dialog integration

**Features**:
- Nearest-neighbor heuristic + 2-opt refinement for stop ordering
- First stop fixed by default (photographer's starting point)
- Before/after distance comparison with improvement percentage
- Auto-recalculates routed distance after applying optimization
- Button visible only when trip has 3+ stops

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
