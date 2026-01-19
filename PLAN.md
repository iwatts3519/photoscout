# PhotoScout Implementation Plan

## 📊 Progress Tracker

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1: Foundation & Setup** | ✅ Complete | 100% |
| **Phase 2: Database Setup** | ✅ Complete | 100% |
| **Phase 3: Core Map Interface** | ✅ Complete | 100% |
| **Phase 4: Photography Conditions** | ✅ Complete | 100% |
| **Phase 5: Weather Integration** | ✅ Complete | 100% |
| **Phase 6: Polish & Testing** | ✅ Complete | 100% |
| **Phase 7: High Priority Core Features** | ✅ Complete | 100% |
| **Phase 8: UX & Feature Enhancements** | ✅ Complete | 100% |
| **Phase 9: Sidebar UI/UX Improvement** | ✅ Complete | 100% |
| **Phase 10: Weather Alerts & Notifications** | 📋 Planned | 0% |
| **Phase 11: Community Photo Spots** | 📋 Planned | 0% |
| **Phase 12: Photo Upload & Tagging** | 📋 Planned | 0% |
| **Phase 13: Route Planning** | 📋 Planned | 0% |
| **Phase 14: Location Comparison** | 📋 Planned | 0% |

**Last Updated**: 2026-01-19
**Current Phase**: MVP Complete - Post-MVP Phases Planned

---

## Project Overview

**PhotoScout** is a web app helping UK landscape photographers discover locations, check weather conditions, and plan shoots. Currently building from scratch.

**Tech Stack**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, MapLibre GL JS, Supabase (PostgreSQL + PostGIS), SunCalc.js

**Project Directory**: `D:\Cursor\photoscout`

## User Priorities (MVP Focus)
1. ✅ Map + location selection (core interface)
2. ✅ Golden hour calculations (photography scoring)
3. ✅ Weather integration (Met Office - mocked initially)
4. 🎯 Local development only
5. 🎯 Mock API data first, real APIs later

---

## Git Configuration ✅

**Repository**: https://github.com/iwatts3519/photoscout.git
**Strategy**: Commit and push at the end of each phase
**Commit Format**: Conventional Commits (feat:, fix:, docs:, etc.)

See CLAUDE.md for complete git workflow and best practices.

---

## ✅ Phase 1: Foundation & Setup (COMPLETED)

### Accomplished Tasks
- [x] Initialize Next.js project with TypeScript and Tailwind
- [x] Install core dependencies (MapLibre, SunCalc, Zustand, etc.)
- [x] Set up shadcn/ui components (button, card, input, form, dialog, sheet, label, select, slider)
- [x] Configure Vitest for testing
- [x] Create project directory structure
- [x] Set up environment variables (.env.local, .env.example)
- [x] Validate Phase 1 (typecheck, lint, test, dev server)

### Validation Results ✅
```bash
✅ npm run typecheck    # No TypeScript errors
✅ npm run lint         # No ESLint warnings
✅ npm run test         # Vitest configured
✅ npm run dev          # Server running on localhost:3000
```

### Files Created
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript strict configuration
- `tailwind.config.ts` - Tailwind theme
- `vitest.config.ts` - Test configuration
- `next.config.mjs` - Next.js configuration
- `.env.local` - Environment variables
- `.env.example` - Environment template
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- `app/globals.css` - Tailwind CSS with theme
- `components.json` - shadcn/ui config
- `lib/utils.ts` - cn() helper function
- 9 shadcn/ui components in `components/ui/`

### Directory Structure Created
```
D:\Cursor\photoscout\
├── app/                    # Next.js App Router ✅
├── components/
│   ├── ui/                # shadcn/ui components ✅
│   ├── map/               # Ready for map components
│   ├── weather/           # Ready for weather components
│   ├── locations/         # Ready for location components
│   ├── layout/            # Ready for layout components
│   └── shared/            # Ready for shared components
├── lib/
│   ├── supabase/          # Ready for Supabase clients
│   ├── api/               # Ready for API clients
│   ├── queries/           # Ready for database queries
│   └── utils/             # Contains cn() helper ✅
├── src/
│   ├── hooks/             # Ready for custom hooks
│   ├── stores/            # Ready for Zustand stores
│   ├── types/             # Ready for TypeScript types
│   ├── mocks/             # Ready for MSW mocks
│   └── setupTests.ts      # Vitest setup ✅
```

---

## ✅ Phase 2: Database Setup (COMPLETED)

### Goal
Set up local Supabase with PostGIS, create schema for locations, and configure authentication.

### Tasks

#### 2.1 Initialize Local Supabase
```bash
npx supabase init
npx supabase start
```
- Note the `anon key` and `service_role key` from output
- Update `.env.local` with local keys

#### 2.2 Create Initial Database Migration
Create `supabase/migrations/20240101000001_initial_schema.sql`:

```sql
-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations table with PostGIS
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coordinates GEOGRAPHY(Point, 4326) NOT NULL,
  radius_meters INTEGER DEFAULT 1000,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index on coordinates for fast radius queries
CREATE INDEX locations_coordinates_idx ON locations USING GIST (coordinates);

-- Weather alerts table
CREATE TABLE weather_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('good_conditions', 'golden_hour', 'clear_skies')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 2.3 Create RLS Policies
Create `supabase/migrations/20240101000002_rls_policies.sql`:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Locations policies
CREATE POLICY "Users can read own locations" ON locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can read public locations" ON locations FOR SELECT USING (is_public = true);
CREATE POLICY "Users can insert own locations" ON locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON locations FOR DELETE USING (auth.uid() = user_id);

-- Weather alerts policies
CREATE POLICY "Users can manage own alerts" ON weather_alerts FOR ALL USING (auth.uid() = user_id);
```

#### 2.4 Create PostGIS Functions
Create `supabase/migrations/20240101000003_postgis_functions.sql`:

```sql
CREATE OR REPLACE FUNCTION locations_near_point(lng FLOAT, lat FLOAT, radius_meters INT)
RETURNS SETOF locations AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM locations
  WHERE ST_DWithin(
    coordinates,
    ST_MakePoint(lng, lat)::geography,
    radius_meters
  );
END;
$$ LANGUAGE plpgsql;
```

#### 2.5 Apply Migrations
```bash
npx supabase db reset  # Applies all migrations
```

#### 2.6 Generate TypeScript Types
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

#### 2.7 Create Supabase Client Configurations

**File**: `lib/supabase/client.ts` (browser client)
```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/src/types/database';

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

**File**: `lib/supabase/server.ts` (server client)
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/src/types/database';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

#### 2.8 Create Database Query Functions

**File**: `lib/queries/locations.ts`
```typescript
import type { Database } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Location = Database['public']['Tables']['locations']['Row'];

export async function getLocationsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getLocationsNearPoint(
  supabase: SupabaseClient<Database>,
  lng: number,
  lat: number,
  radiusMeters: number = 5000
) {
  const { data, error } = await supabase.rpc('locations_near_point', {
    lng,
    lat,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data;
}

export async function saveLocation(
  supabase: SupabaseClient<Database>,
  location: Omit<Location, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Critical Files to Create (Phase 2)
1. `supabase/migrations/20240101000001_initial_schema.sql` - Database schema
2. `supabase/migrations/20240101000002_rls_policies.sql` - Security policies
3. `supabase/migrations/20240101000003_postgis_functions.sql` - PostGIS functions
4. `src/types/database.ts` - Generated TypeScript types
5. `lib/supabase/client.ts` - Browser Supabase client
6. `lib/supabase/server.ts` - Server Supabase client
7. `lib/queries/locations.ts` - Location database queries

### Accomplished Tasks (Phase 2)
- [x] Initialize local Supabase with PostGIS
- [x] Create database schema migrations (profiles, locations, weather_alerts)
- [x] Set up RLS policies for security
- [x] Create PostGIS spatial functions
- [x] Generate TypeScript types from schema
- [x] Create Supabase client configurations (browser & server)
- [x] Add location query functions

### Validation Results ✅
```bash
✅ npx supabase status    # Local Supabase running
✅ npx supabase db reset  # All migrations applied successfully
✅ npm run typecheck      # No TypeScript errors with generated types
```

### Git Commit ✅
Pushed to GitHub: `feat: complete phase 1 and 2 - project foundation and database setup`

---

## ✅ Phase 3: Core Map Interface (COMPLETED)

### Goal
Implement MapLibre GL JS map with location selection, radius overlay, and basic interactions.

### Accomplished Tasks
- [x] Create map state store (Zustand) with location, center, zoom, radius
- [x] Create geolocation hook with error handling
- [x] Implement MapView component with MapLibre GL JS
- [x] Add click-to-select location functionality
- [x] Add draggable marker with smooth fly-to animation
- [x] Create RadiusOverlay component with Turf.js circle
- [x] Create MapControls component (zoom, locate buttons)
- [x] Build responsive Sidebar with coordinates and radius slider
- [x] Build AppShell layout (desktop sidebar, mobile sheet)
- [x] Create geographic utility functions (distance, bearing, etc.)
- [x] Add comprehensive tests (33 tests passing)

### Validation Results ✅
```bash
✅ npm run typecheck    # No TypeScript errors
✅ npm run lint         # No ESLint warnings
✅ npm run test         # 33 tests passing
✅ npm run dev          # Server running, map renders
✅ Map renders with OpenStreetMap tiles
✅ Click on map selects location and shows marker
✅ Marker is draggable
✅ Radius circle displays around selected location
✅ Zoom controls work
✅ "Locate me" button uses device location
✅ Mobile responsive (sidebar in sheet)
✅ No console errors
```

### Files Created (Phase 3)
1. `src/stores/mapStore.ts` - Map state management (+ tests)
2. `src/hooks/useGeolocation.ts` - Geolocation hook (+ tests)
3. `components/map/MapView.tsx` - Main map component
4. `components/map/MapControls.tsx` - Zoom and locate controls
5. `components/map/RadiusOverlay.tsx` - Radius circle overlay
6. `components/layout/AppShell.tsx` - Main app layout
7. `components/layout/Sidebar.tsx` - Sidebar with location details
8. `lib/utils/geo.ts` - Geographic utility functions (+ tests)
9. `app/page.tsx` - Updated to use AppShell and MapView
10. `components/map/README.md` - Component documentation
11. `PHASE3_SUMMARY.md` - Detailed implementation summary

### Git Commit ✅
Ready for commit: `feat: complete phase 3 - core map interface`

---

## ✅ Phase 4: Photography Conditions (COMPLETED)

### Goal
Implement sun calculations (golden hour, sunrise, sunset) and photography scoring algorithm.

### Accomplished Tasks
- [x] Create comprehensive SunCalc wrapper with typed interfaces
- [x] Implement sun time calculations (sunrise, sunset, golden hour, blue hour)
- [x] Build photography scoring algorithm with lighting, weather, and visibility scoring
- [x] Create photography condition detection (time of day, golden hour, blue hour)
- [x] Build SunTimesCard component for displaying sun times
- [x] Build ConditionsScore component for displaying photography score
- [x] Add comprehensive unit tests (53 new tests for Phase 4)
- [x] Integrate with existing map interface

### Validation Results ✅
```bash
✅ npm run typecheck    # No TypeScript errors
✅ npm run lint         # No ESLint warnings
✅ npm run test         # 86 tests passing (up from 33)
✅ Sun times calculate correctly for UK locations
✅ Golden hour detection works across all seasons
✅ Photography scoring algorithm produces sensible results
✅ Test coverage >95% for sun calculations and scoring
```

### Files Created (Phase 4)
1. `lib/utils/sun-calculations.ts` - SunCalc wrapper (341 lines, 33 tests)
2. `lib/utils/sun-calculations.test.ts` - Comprehensive sun calculation tests
3. `lib/utils/photo-score.ts` - Photography scoring algorithm (274 lines, 20 tests)
4. `lib/utils/photo-score.test.ts` - Photography scoring tests
5. `src/types/photography.types.ts` - Type definitions for photography conditions
6. `components/weather/SunTimesCard.tsx` - Sun times display component
7. `components/weather/ConditionsScore.tsx` - Photography score display component

### Key Features Implemented
- **Sun Calculations**: Sunrise, sunset, golden hour (morning/evening), blue hour, twilight periods
- **Time of Day Detection**: 9 different time periods for photography planning
- **Photography Scoring**: Weighted algorithm (50% lighting, 30% weather, 20% visibility)
- **Smart Recommendations**: Excellent/good/fair/poor with contextual reasons
- **Countdown Timers**: Minutes to next golden hour, sunrise, sunset
- **UK-Optimized**: Times formatted in 24-hour format, calculations accurate for UK latitudes

### Git Commit ✅
Pushed to GitHub: `feat: complete phase 4 - photography conditions and sun calculations`

---

## ✅ Phase 5: Weather Integration (COMPLETED)

### Goal
Implement weather API integration, display weather conditions, and integrate with photography scoring.

### Accomplished Tasks
- [x] Migrate from retired Met Office DataPoint to Open-Meteo API
- [x] Create Open-Meteo API client with WMO weather code mapping
- [x] Build weather adapter to transform API data for photography scoring
- [x] Create WeatherCard component for displaying weather conditions
- [x] Integrate weather fetching into Sidebar with loading/error states
- [x] Connect weather data to photography scoring algorithm
- [x] Set up MSW (Mock Service Worker) for testing
- [x] Add comprehensive tests for weather functionality
- [x] Enable MSW server in test setup

### Validation Results ✅
```bash
✅ npm run typecheck    # No TypeScript errors
✅ npm run lint         # No ESLint warnings
✅ npm run build        # Production build succeeds
✅ npm run test         # 105/111 tests passing (94.6%)
✅ Weather fetches automatically on location selection
✅ Loading states display during API calls
✅ Error handling works correctly
✅ Photography score integrates real weather data
```

### Files Created (Phase 5)
1. `lib/api/open-meteo.ts` - Open-Meteo API client (no key required)
2. `lib/api/base.ts` - API error handling, retry logic, and caching
3. `lib/api/base.test.ts` - Base API utility tests
4. `app/actions/weather.ts` - Server action for fetching weather
5. `components/weather/WeatherCard.tsx` - Weather display component
6. `lib/utils/weather-adapter.ts` - Transform weather data for scoring
7. `lib/utils/weather-adapter.test.ts` - Weather adapter tests
8. `src/types/weather.types.ts` - Weather type definitions
9. `src/mocks/handlers.ts` - MSW mock handlers for Open-Meteo
10. `src/mocks/server.ts` - MSW server setup
11. `src/mocks/data/weatherData.ts` - Mock weather data generators
12. `components/layout/Sidebar.tsx` - Updated with weather integration

### Key Features Implemented
- **Open-Meteo Integration**: Free weather API, no key required, unlimited requests
- **Automatic Weather Fetching**: Fetches on location selection with proper loading states
- **Weather Display**: Temperature, cloud cover, visibility, wind speed/direction, humidity
- **Photography Scoring**: Weather data influences photography score (30% weight)
- **Error Handling**: Graceful error states with user-friendly messages
- **Mobile Responsive**: Weather cards work on all screen sizes
- **Test Coverage**: Comprehensive tests for API client, adapter, and components

### Git Commits ✅
1. `feat: migrate from Met Office DataPoint to Open-Meteo API` (71b2112)
2. `feat: complete phase 5 - weather integration` (pending)

---

## ✅ Phase 6: Polish & Testing (COMPLETED)

### Goal
Add error handling, loading states, improve mobile responsiveness, and achieve good test coverage.

### Accomplished Tasks
- [x] Fix all test failures (6 failing tests in base.test.ts)
- [x] Create ErrorBoundary component with fallback UI
- [x] Create LoadingSpinner component with multiple variants
- [x] Create app/error.tsx error page for Next.js App Router
- [x] Create app/not-found.tsx 404 page
- [x] Add comprehensive component tests for WeatherCard (27 tests)
- [x] Add comprehensive component tests for SunTimesCard (13 tests)
- [x] Add comprehensive component tests for ConditionsScore (16 tests)
- [x] Review and verify mobile responsiveness across all components
- [x] Run final validation (typecheck, lint, test, build)
- [x] Update README.md with current status and features
- [x] Update PLAN.md to mark Phase 6 complete

### Validation Results ✅
```bash
✅ npm run typecheck    # No TypeScript errors
✅ npm run lint         # 1 minor warning (non-blocking)
✅ npm run test         # 167/167 tests passing (100%)
✅ npm run build        # Production build succeeds
```

### Test Coverage
- **Total Tests**: 167 passing
- **Unit Tests**: 113 tests (utilities, stores, hooks)
- **Component Tests**: 56 tests (weather cards, map components)
- **API Tests**: 13 tests (base API, caching, retries)

### Files Created (Phase 6)
1. `components/shared/ErrorBoundary.tsx` - React error boundary
2. `components/shared/LoadingSpinner.tsx` - Loading states
3. `app/error.tsx` - Global error page
4. `app/not-found.tsx` - 404 page
5. `components/weather/WeatherCard.test.tsx` - 27 tests
6. `components/weather/SunTimesCard.test.tsx` - 13 tests
7. `components/weather/ConditionsScore.test.tsx` - 16 tests

### Key Achievements
- ✅ **100% test pass rate** - All 167 tests passing
- ✅ **Comprehensive error handling** - Error boundary, error pages, loading states
- ✅ **Mobile responsive** - All components work on mobile and desktop
- ✅ **Production ready** - Build succeeds, no blocking issues
- ✅ **Well documented** - README and PLAN updated

### Git Commit ✅
Ready for commit: `feat: complete phase 6 - polish and testing`

---

## 🎯 Success Criteria (MVP Complete) ✅

### All Criteria Met:
- ✅ Next.js project set up with TypeScript and Tailwind CSS
- ✅ Supabase database running locally with PostGIS
- ✅ Map interface displays with OpenStreetMap tiles
- ✅ Click on map selects location and shows coordinates
- ✅ Radius circle displays around selected location
- ✅ Sun times (sunrise, sunset, golden hour) calculate correctly
- ✅ Photography scoring algorithm implemented with lighting/weather/visibility
- ✅ Photography score displays with real weather data from Open-Meteo
- ✅ Weather card shows conditions (cloud cover, visibility, wind, temperature)
- ✅ Mobile responsive with bottom sheet for sidebar
- ✅ All TypeScript checks pass (0 errors)
- ✅ All tests pass (167/167 tests, 100% pass rate)
- ✅ Production build succeeds
- ✅ Error handling and loading states implemented
- ✅ Comprehensive component test coverage

**🎉 MVP COMPLETE! All success criteria achieved.**

---

## 📝 Implementation Notes

### Code Style Reminders
- Run `npm run typecheck` after EVERY code change
- Use strict TypeScript (no `any` types)
- Server Components by default, `'use client'` only when needed
- Mobile-first Tailwind CSS (sm → md → lg)

### Common Pitfalls to Avoid
1. **MapLibre cleanup** - Always call `map.remove()` in useEffect cleanup
2. **PostGIS casting** - Use `::geography` for distance accuracy
3. **SunCalc radians** - Convert to degrees: `(azimuth * 180 / Math.PI) + 180`
4. **Environment variables** - Use `NEXT_PUBLIC_` prefix for client-side access

### After Each Phase
Run validation commands:
```bash
npm run typecheck && npm run lint && npm run test
```

---

## 🔄 Phase 7: High Priority Core Features (IN PROGRESS)

### Goal
Implement critical user-facing features: authentication, location saving, photo discovery, and POI integration.

### Sub-Phases

#### Phase 7A: Authentication & User Management (✅ COMPLETED)
**Goal**: Enable passwordless authentication via magic link

**Tasks**:
- [x] Create auth context and hooks (`AuthContext`, `useAuth`, `useUser`)
- [x] Build auth UI components (`AuthDialog`, `UserMenu`)
- [x] Create auth API layer (`lib/queries/profiles.ts`, `app/actions/auth.ts`)
- [x] Set up magic link callback route (`app/auth/callback/route.ts`)
- [x] Integrate auth into app layout and components
- [x] Add sign-in/sign-out functionality
- [x] Test authentication flow

**Files Created**: 8 new files
- `src/contexts/AuthContext.tsx` - Auth provider with Supabase integration
- `src/hooks/useAuth.ts` - Auth state hook
- `src/hooks/useUser.ts` - User profile hook
- `components/auth/AuthDialog.tsx` - Magic link login dialog
- `components/auth/UserMenu.tsx` - User dropdown menu
- `lib/queries/profiles.ts` - Profile database queries
- `app/actions/auth.ts` - Auth server actions
- `app/auth/callback/route.ts` - Magic link callback handler

**Files Modified**: 3 files
- `app/layout.tsx` - Added AuthProvider wrapper
- `components/layout/AppShell.tsx` - Added UserMenu and Sign In button
- `components/layout/Sidebar.tsx` - Added auth messaging

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167 passing)

#### Phase 7B: Location Saving (✅ COMPLETED)
**Goal**: Allow authenticated users to save, edit, and delete photography locations

**Tasks**:
- [x] Create location store (`src/stores/locationStore.ts`)
- [x] Build location UI components (`SaveLocationForm`, `EditLocationForm`, `LocationCard`, `SavedLocationsList`, `SavedLocationMarkers`)
- [x] Create location server actions (`app/actions/locations.ts`)
- [x] Add delete/update functions to `lib/queries/locations.ts`)
- [x] Create PostGIS function to extract lat/lng from geography
- [x] Integrate saved locations into sidebar and map
- [x] Test location CRUD operations

**Files Created**: 9 new files
- `src/stores/locationStore.ts` - Zustand store for saved locations
- `app/actions/locations.ts` - Server actions with Zod validation
- `components/locations/SaveLocationForm.tsx` - Save current location form
- `components/locations/EditLocationForm.tsx` - Edit existing location
- `components/locations/LocationCard.tsx` - Display individual location
- `components/locations/SavedLocationsList.tsx` - List all saved locations
- `components/map/SavedLocationMarkers.tsx` - Green markers on map
- `components/auth/DevPasswordSignIn.tsx` - Dev-only password auth
- `supabase/migrations/20260113000001_add_get_locations_with_coords.sql` - PostGIS function

**Files Modified**: 4 files
- `lib/queries/locations.ts` - Added updateLocation, deleteLocation, getLocationById, coordinate parsing
- `components/layout/Sidebar.tsx` - Integrated SaveLocationForm and SavedLocationsList
- `components/map/MapView.tsx` - Added SavedLocationMarkers component
- `supabase/config.toml` - Fixed invalid config

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167 passing) | ✅ build

#### Phase 7C: Wikimedia Commons Photo Discovery (✅ COMPLETED)
**Goal**: Fetch and display nearby geotagged photos from Wikimedia Commons

**Tasks**:
- [x] Create Wikimedia API types (`src/types/wikimedia.types.ts`)
- [x] Build Wikimedia API client (`lib/api/wikimedia.ts`)
- [x] Create server action (`app/actions/wikimedia.ts`)
- [x] Build photo gallery UI (`PhotoGallery`, `PhotoDialog`, `PhotoThumbnail`)
- [x] Integrate photo gallery into sidebar
- [x] Add Wikimedia API mocks for testing
- [x] Test photo discovery flow

**API**: `https://commons.wikimedia.org/w/api.php` (geosearch, 1-hour cache)

**Files Created**: 6 new files
- `src/types/wikimedia.types.ts` - Wikimedia API type definitions
- `lib/api/wikimedia.ts` - Wikimedia API client with geosearch and imageinfo
- `app/actions/wikimedia.ts` - Server action for fetching nearby photos
- `components/locations/PhotoThumbnail.tsx` - Photo thumbnail component
- `components/locations/PhotoDialog.tsx` - Photo detail dialog
- `components/locations/PhotoGallery.tsx` - Photo gallery component

**Files Modified**: 2 files
- `components/layout/Sidebar.tsx` - Added PhotoGallery integration
- `src/mocks/handlers.ts` - Added Wikimedia API mocks

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167 passing)

#### Phase 7D: Overpass POI Integration (✅ COMPLETED)
**Goal**: Display nearby points of interest (parking, cafes, viewpoints) on the map

**Tasks**:
- [x] Create Overpass API types (`src/types/overpass.types.ts`)
- [x] Build Overpass API client (`lib/api/overpass.ts`)
- [x] Create server action (`app/actions/overpass.ts`)
- [x] Create POI store (`src/stores/poiStore.ts`)
- [x] Build POI UI components (`POILayer`, `POIFilters`, `POIList`)
- [x] Integrate POI layer into map
- [x] Add Overpass API mocks for testing
- [x] Test POI display and filtering

**API**: `https://overpass-api.de/api/interpreter` (Overpass QL, 24-hour cache)

**POI Types**: Parking, Cafes, Viewpoints, Toilets, Information

**Files Created**: 7 new files
- `src/types/overpass.types.ts` - Overpass API and POI type definitions
- `lib/api/overpass.ts` - Overpass API client with Overpass QL queries
- `app/actions/overpass.ts` - Server action for fetching POIs
- `src/stores/poiStore.ts` - Zustand store for POI state management
- `components/map/POILayer.tsx` - Map layer component with POI markers
- `components/map/POIFilters.tsx` - Filter component for toggling POI types
- `components/map/POIList.tsx` - List component displaying nearby POIs

**Files Modified**: 3 files
- `components/layout/Sidebar.tsx` - Added POIFilters and POIList
- `components/map/MapView.tsx` - Integrated POILayer
- `src/mocks/handlers.ts` - Added Overpass API mocks

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167 passing)

### Implementation Order
```
Phase 7A (Auth) → Phase 7B (Locations) → Phase 7C & 7D (Photos + POIs in parallel)
```

### Validation Steps
After each sub-phase:
```bash
npm run typecheck && npm run lint && npm run test
```

### Critical Dependencies
- Phase 7B requires 7A (authentication)
- Phase 7C and 7D are independent, can be done in parallel

### Estimated Effort
- Phase 7A: 2-3 days
- Phase 7B: 2 days
- Phase 7C: 1.5-2 days
- Phase 7D: 1.5-2 days
- **Total**: 7-9 days

### Success Criteria
- ✅ Users can sign in with magic link
- ✅ Users can save/edit/delete locations
- ✅ Saved locations appear on map with markers
- ✅ Nearby photos from Wikimedia Commons display in sidebar
- ✅ POIs (parking, cafes, viewpoints, toilets, information) show on map
- ✅ All new features work on mobile
- ✅ All tests pass with new features

**🎉 PHASE 7 COMPLETE! All success criteria achieved.**

---

## 📋 Phase 8: UX & Feature Enhancements (PLANNED)

### Goal
Improve PhotoScout's usability, user experience, and feature set based on codebase analysis and UX best practices research. Focus on high-impact improvements that make the app more useful and user-friendly.

### Current State Analysis

**Strengths:**
- Solid foundation with map, weather, and photography scoring
- Good mobile responsiveness
- Comprehensive test coverage (167 tests)
- Dark mode support exists but no user control

**Gaps Identified:**
1. No location search/geocoding (only map clicking)
2. No date/time selection for future planning
3. Only current weather (no multi-day forecast)
4. No user preferences/settings
5. No onboarding flow
6. Limited location organization (tags exist but no collections/folders)
7. No notes/annotations on locations
8. No share/export functionality
9. No keyboard shortcuts
10. No location history/recently viewed

### Sub-Phases

#### Phase 8A: Location Search & Geocoding (✅ COMPLETED)

**Goal**: Allow users to search for locations by name instead of only clicking on map.

**Tasks**:
- [x] Add geocoding API integration (Nominatim/OpenStreetMap - free, no key required)
- [x] Create `LocationSearch` component with autocomplete
- [x] Add search input to sidebar/map controls
- [x] Store recent searches in localStorage
- [x] Add debounced search with loading states

**Files Created**: 5 new files
- `src/types/geocoding.types.ts` - Type definitions for geocoding
- `lib/api/geocoding.ts` - Nominatim API client with caching (24hr)
- `app/actions/geocoding.ts` - Server actions with Zod validation
- `components/map/LocationSearch.tsx` - Search input with autocomplete dropdown
- `src/hooks/useRecentSearches.ts` - LocalStorage sync for recent searches

**Files Modified**: 3 files
- `src/stores/mapStore.ts` - Added search state and actions
- `components/layout/Sidebar.tsx` - Integrated LocationSearch component
- `components/layout/AppShell.tsx` - Added useRecentSearches hook

**Key Features**:
- Debounced search (300ms) to prevent API spam
- UK-biased results (countrycodes=gb)
- Recent searches persisted in localStorage (max 10)
- Fly-to animation when selecting result
- Loading and error states
- Accessible with ARIA attributes

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167) | ✅ build

**Benefits**:
- Faster location discovery
- Better for planning trips
- More intuitive for users unfamiliar with map navigation

---

#### Phase 8B: Date/Time Selection for Planning (✅ COMPLETED)

**Goal**: Allow users to plan shoots for future dates, not just current conditions.

**Tasks**:
- [x] Add date picker component (shadcn/ui calendar)
- [x] Add time selector for specific times
- [x] Update sun calculations to use selected date
- [x] Store selected date in mapStore
- [x] Show "Planning for: [date]" indicator
- [x] Add quick date buttons (Today, Tomorrow, +2 days, +7 days)

**Files Created**: 3 new files
- `components/ui/calendar.tsx` - shadcn/ui calendar component (react-day-picker v9)
- `components/ui/popover.tsx` - shadcn/ui popover component
- `components/shared/DateTimePicker.tsx` - Combined date/time picker with quick dates

**Files Modified**: 2 files
- `src/stores/mapStore.ts` - Added selectedDateTime, setSelectedDateTime, resetDateTime
- `components/layout/Sidebar.tsx` - Integrated DateTimePicker, passes date to SunTimesCard and ConditionsScore

**Dependencies Added**:
- `date-fns` - Date manipulation library
- `react-day-picker` - Calendar component (v9)
- `@radix-ui/react-popover` - Popover primitive

**Key Features**:
- Calendar picker with future dates only (can't select past)
- Time selector with hour/minute dropdowns (15-min increments)
- Quick date buttons for common planning scenarios
- "Planning for: [date]" indicator when viewing future dates
- "Now" button to reset to current time
- Sun times and photography score update based on selected date/time

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167) | ✅ build

**Benefits**:
- Enables trip planning
- Compare conditions across dates
- Plan shoots weeks in advance

---

#### Phase 8C: Multi-Day Weather Forecast (✅ COMPLETED)

**Goal**: Show weather forecast for next 7 days, not just current conditions.

**Tasks**:
- [x] Extend Open-Meteo API client to fetch forecast
- [x] Create `WeatherForecastCard` component
- [x] Add forecast view toggle (current vs forecast)
- [x] Show best days for photography based on forecast
- [x] Highlight golden hour times for each day

**Files Created**: 2 new files
- `components/weather/WeatherForecastCard.tsx` - Multi-day forecast display with expandable rows
- `lib/utils/forecast-analyzer.ts` - Analyze forecast and rank days for photography

**Files Modified**: 4 files
- `src/types/weather.types.ts` - Added DailyForecast and MultiDayForecast types
- `lib/api/open-meteo.ts` - Added getMultiDayForecast() function
- `app/actions/weather.ts` - Added fetchMultiDayForecast() server action
- `components/layout/Sidebar.tsx` - Added weather view toggle (Current/7-Day)

**Key Features**:
- 7-day forecast with daily summaries
- Photography score for each day (color-coded)
- Best day indicator (star icon)
- Expandable day rows with detailed conditions
- Golden hour times for each day
- "Plan for this day" button to select date
- Toggle between current weather and forecast views
- Uses user's unit preferences from settings

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167) | ✅ build

**Benefits**:
- Plan shoots days in advance
- Identify best weather windows
- Compare conditions across multiple days

---

#### Phase 8D: User Preferences & Settings (✅ COMPLETED)

**Goal**: Allow users to customize their experience and save preferences.

**Tasks**:
- [x] Create settings page/dialog
- [x] Add theme toggle (light/dark/system) - next-themes already installed
- [x] Add units preference (metric/imperial)
- [x] Add default radius preference
- [ ] Add notification preferences (deferred to future phase)
- [x] Store preferences in localStorage (Supabase sync deferred)

**Files Created**: 4 new files
- `components/settings/SettingsDialog.tsx` - Full settings dialog UI
- `components/settings/ThemeToggle.tsx` - Theme switcher (light/dark/system)
- `components/ui/switch.tsx` - shadcn/ui Switch component
- `src/stores/settingsStore.ts` - Zustand store with localStorage persistence

**Files Modified**: 3 files
- `app/layout.tsx` - ThemeProvider from next-themes configured
- `components/layout/AppShell.tsx` - Settings button added to header
- `components/layout/Sidebar.tsx` - Using settings for unit formatting

**Key Features**:
- Theme selection (light/dark/system) via next-themes
- Unit system preferences (metric/imperial)
- Temperature unit (celsius/fahrenheit)
- Distance unit (km/miles)
- Speed unit (km/h/mph)
- Default radius preference
- UI preferences (show coordinates, compact mode)
- All settings persist to localStorage
- Unit conversion utility functions in settingsStore

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (167/167) | ✅ build

**Benefits**:
- Personalized experience
- Better accessibility (theme control)
- User control over defaults

---

#### Phase 8E: Location Organization & Collections (✅ COMPLETED)

**Goal**: Better organization of saved locations with collections/folders.

**Tasks**:
- [x] Add collections/folders concept
- [x] Allow grouping locations into collections
- [x] Add collection management UI
- [x] Filter locations by collection
- [x] Add collection colors/icons (8-color palette)

**Files Created**: 9 new files
- `supabase/migrations/20260118000001_add_collections.sql` - Collections table with RLS
- `src/stores/collectionStore.ts` - Zustand store with predefined color palette
- `src/stores/collectionStore.test.ts` - 13 unit tests for collection store
- `lib/queries/collections.ts` - Database CRUD queries
- `app/actions/collections.ts` - Server actions with Zod validation
- `components/locations/CollectionBadge.tsx` - Colored badge showing collection name
- `components/locations/CollectionSelector.tsx` - Dropdown for forms
- `components/locations/CollectionFilter.tsx` - Filter dropdown for list
- `components/locations/CollectionManager.tsx` - Full CRUD dialog

**Files Modified**: 8 files
- `src/types/database.ts` - Regenerated with collections table
- `components/locations/SaveLocationForm.tsx` - Added CollectionSelector
- `components/locations/EditLocationForm.tsx` - Added CollectionSelector
- `components/locations/SavedLocationsList.tsx` - Added filter, manager, parallel data loading
- `components/locations/LocationCard.tsx` - Added CollectionBadge display
- `components/map/SavedLocationMarkers.tsx` - Colored markers by collection
- `app/actions/locations.ts` - Added collection_id support
- `lib/queries/locations.ts` - Added collection_id to queries

**Key Features**:
- Create/edit/delete collections with 8 predefined colors
- Assign locations to collections when saving or editing
- Filter saved locations by collection or "uncategorized"
- Collection badge on location cards
- Map markers colored by collection assignment
- Parallel loading of locations and collections

**Color Palette**:
- Green (#10b981), Blue (#3b82f6), Purple (#8b5cf6), Pink (#ec4899)
- Red (#ef4444), Orange (#f97316), Yellow (#eab308), Teal (#14b8a6)

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing) | ✅ build

**Benefits**:
- Better organization for users with many locations
- Group by trip, region, or theme
- Easier location discovery
- Visual distinction on map with colored markers

---

#### Phase 8F: Location Notes & Annotations (✅ COMPLETED)

**Goal**: Allow users to add notes, tips, and annotations to saved locations.

**Tasks**:
- [x] Add notes field to location edit form
- [x] Show notes in location card
- [x] Add "last visited" date tracking
- [x] Add "best time to visit" notes
- [x] Add expandable "More details" section to save form

**Files Created**: 1 new file
- `supabase/migrations/20260119000001_add_location_notes.sql` - Migration for notes, last_visited, best_time_to_visit

**Files Modified**: 6 files
- `components/locations/EditLocationForm.tsx` - Added notes textarea, best time, last visited date picker
- `components/locations/SaveLocationForm.tsx` - Added expandable advanced section with notes/best time
- `components/locations/LocationCard.tsx` - Display notes, best time, last visited with icons
- `app/actions/locations.ts` - Added new fields to schemas and actions
- `lib/queries/locations.ts` - Updated select to include new fields
- `src/types/database.ts` - Regenerated with new columns

**Key Features**:
- Notes field with 2000 character limit for detailed location tips
- Best time to visit field for seasonal/tidal conditions
- Last visited date tracking with relative time display ("3 days ago")
- Expandable "More details" section in save form for streamlined UX
- Icons for visual distinction (Clock, Calendar, FileText)

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180) | ✅ build

**Benefits**:
- Capture location-specific tips (parking, access, hazards)
- Remember why location was saved
- Track when locations were last scouted
- Note optimal shooting conditions

---

#### Phase 8G: Share & Export Functionality (✅ COMPLETED)

**Goal**: Allow users to share locations or export their data.

**Tasks**:
- [x] Add "Share Location" button
- [x] Generate shareable link with location data
- [x] Export locations to JSON/GPX
- [x] Add "Copy coordinates" quick action
- [ ] Generate printable location cards (deferred)

**Files Created**: 4 new files
- `lib/utils/export.ts` - Export utilities (JSON, GPX, clipboard, file download)
- `components/locations/ShareLocationDialog.tsx` - Share dialog with copy, export, and external map links
- `app/share/page.tsx` - Shareable link page with Suspense wrapper
- `app/share/SharePageContent.tsx` - Share page content component

**Files Modified**: 2 files
- `components/locations/LocationCard.tsx` - Added Share and Copy Coordinates menu items
- `components/locations/SavedLocationsList.tsx` - Added Export dropdown (JSON/GPX)

**Key Features**:
- Share dialog with copy link, coordinates (decimal & DMS), and export options
- External map links (Google Maps, OpenStreetMap)
- Single location export (JSON/GPX) from share dialog
- Bulk export all locations (JSON/GPX) from saved locations header
- Copy coordinates to clipboard with one click
- Shareable URL with lat/lng/name parameters
- Share page that displays location and allows opening in app

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180) | ✅ build

**Benefits**:
- Share locations with others
- Backup user data
- Integration with other tools (GPX for GPS devices)

---

#### Phase 8H: Onboarding & Feature Discovery (✅ COMPLETED)

**Goal**: Guide new users through key features.

**Tasks**:
- [x] Create onboarding flow component
- [x] Add tooltips for first-time feature use
- [x] Add "Getting Started" guide
- [x] Add keyboard shortcuts help
- [x] Track onboarding completion

**Files Created**: 5 new files
- `src/stores/onboardingStore.ts` - Zustand store with localStorage persistence for onboarding state
- `components/onboarding/OnboardingDialog.tsx` - Multi-step welcome tour (6 steps)
- `components/onboarding/FeatureTooltip.tsx` - Contextual tooltips and inline hints
- `components/shared/KeyboardShortcuts.tsx` - Keyboard shortcuts help dialog
- `src/hooks/useKeyboardShortcuts.ts` - Keyboard shortcut handler hook

**Files Modified**: 4 files
- `components/layout/AppShell.tsx` - Added onboarding, help menu, keyboard shortcuts integration
- `components/settings/SettingsDialog.tsx` - Added controlled mode support
- `components/map/LocationSearch.tsx` - Added data attribute for keyboard shortcut focus

**Key Features**:
- 6-step onboarding tour (Welcome, Map Basics, Location Search, Weather Info, Save Locations, Complete)
- Auto-shows for new users on first visit
- Help menu with "Getting Started" and "Keyboard Shortcuts" options
- Keyboard shortcuts: `/` (search), `s` (settings), `h` (help), `?` (shortcuts), `+/-` (zoom), `l` (locate)
- FeatureTooltip component for contextual first-use hints
- InlineHint component for dismissible hints
- All state persisted to localStorage

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180) | ✅ build

**Benefits**:
- Faster user adoption
- Reduced confusion
- Better feature discovery

---

#### Phase 8I: Keyboard Shortcuts (✅ COMPLETED - Merged with 8H)

**Goal**: Power user efficiency with keyboard shortcuts.

**Tasks**:
- [x] Add keyboard shortcut handler hook
- [x] Implement common shortcuts (search, settings, etc.)
- [x] Show shortcuts in help dialog
- [x] Add shortcut hints in UI

**Note**: Implemented as part of Phase 8H. See Phase 8H for details.

**Shortcuts Implemented**:
- `/` - Focus search
- `?` - Show keyboard shortcuts dialog
- `s` - Open settings
- `h` - Show help / onboarding
- `+` / `=` - Zoom in
- `-` - Zoom out
- `l` - Center on my location
- `1` - Show current weather
- `2` - Show 7-day forecast
- `Esc` - Close dialogs

**Benefits**:
- Faster workflow for power users
- Better accessibility
- Professional feel

---

#### Phase 8J: Location History & Recently Viewed (✅ COMPLETED)

**Goal**: Track and display recently viewed locations.

**Tasks**:
- [x] Store location view history in localStorage
- [x] Show "Recently Viewed" section in sidebar
- [x] Add "Clear History" option
- [x] Limit to last 10 locations

**Files Created**: 2 new files
- `src/stores/locationHistoryStore.ts` - Zustand store with localStorage persistence
- `components/locations/RecentlyViewed.tsx` - Collapsible history display with remove/clear options

**Files Modified**: 1 file
- `components/layout/Sidebar.tsx` - Added history tracking and RecentlyViewed component

**Dependencies Added**:
- `@radix-ui/react-collapsible` - For collapsible section
- `@radix-ui/react-alert-dialog` - For clear history confirmation

**Key Features**:
- Auto-tracks all viewed locations (max 10)
- Collapsible "Recently Viewed" section in sidebar
- Click to navigate back to a location
- Remove individual entries with X button
- Clear all history with confirmation dialog
- Relative time display ("2h ago", "Yesterday")
- Coordinates formatted as fallback names (e.g., "54.5000°N, 3.5000°W")
- Persisted to localStorage

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180) | ✅ build

**Benefits**:
- Quick access to recent locations
- Better navigation flow
- Reduces repetitive searching

---

### Implementation Priority

#### Phase 8.1 (High Impact, Quick Wins) ✅ COMPLETE
1. **8A: Location Search** - ✅ Complete
2. **8B: Date/Time Selection** - ✅ Complete
3. **8D: User Preferences & Settings** - ✅ Complete

#### Phase 8.2 (High Impact, Medium Effort) ✅ COMPLETE
4. **8C: Multi-Day Forecast** - ✅ Complete
5. **8E: Collections** - ✅ Complete
6. **8F: Location Notes** - ✅ Complete

#### Phase 8.3 (Polish & Power Features) ✅ COMPLETE
7. **8H: Onboarding** - ✅ Complete
8. **8I: Keyboard Shortcuts** - ✅ Complete (merged with 8H)

#### Phase 8.4 (Nice to Have) ✅ COMPLETE
9. **8J: Location History** - ✅ Complete
10. **8G: Share & Export** - ✅ Complete

---

### Technical Considerations

#### Dependencies to Add
- `date-fns` or `dayjs` - Date manipulation (if not already present)
- `react-day-picker` - Date picker component (shadcn/ui compatible)
- Nominatim API - Free geocoding (no key required)

#### Performance
- Cache geocoding results (localStorage)
- Lazy load forecast data
- Debounce search input

#### Accessibility
- Ensure all new components are keyboard accessible
- Add ARIA labels
- Test with screen readers

#### Testing
- Add tests for new components
- Test date/time selection edge cases
- Test search with various inputs

---

### Success Metrics

- **Location Search**: 80%+ of users use search within first session
- **Date Selection**: 50%+ of users plan for future dates
- **Forecast**: Users check forecast 3+ days ahead regularly
- **Settings**: Theme toggle used by 30%+ of users
- **Collections**: Users with 10+ locations create collections

---

### Validation Steps
After each sub-phase:
```bash
npm run typecheck && npm run lint && npm run test
```

---

## 🔄 Phase 9: Sidebar UI/UX Improvement (IN PROGRESS)

### Goal
Transform the cluttered sidebar into a minimal action panel with floating cards on the map (Google Maps style). Move detailed information to floating cards while keeping essential actions in a streamlined sidebar.

### Design Overview

**Layout**: Floating Cards + Minimal Sidebar
**Always Visible**: Search + Weather summary

```
┌──────────────┬─────────────────────────────────────────────────┐
│  SIDEBAR     │                                                 │
│  (Minimal)   │    ┌─────────────────┐                          │
│              │    │ Weather Card    │    [Zoom] [Locate]       │
│ [🔍 Search]  │    │ Detailed view   │                          │
│              │    └─────────────────┘                          │
│ ┌──────────┐ │                                                 │
│ │☀️ 12°C   │ │                  MAP                            │
│ │Golden Hr │ │                                                 │
│ └──────────┘ │                                                 │
│              │                         ┌───────────────────┐   │
│ [Radius]     │                         │ Location Card     │   │
│ [DateTime]   │                         │ POIs, Photos      │   │
│ [POI Filter] │                         └───────────────────┘   │
│              │                                                 │
│ ─────────────│  ┌─────────────────────────────────────────┐    │
│ [Saved]      │  │ Bottom Sheet: Full Details (expandable) │    │
│ [Recent]     │  └─────────────────────────────────────────┘    │
└──────────────┴─────────────────────────────────────────────────┘
```

### Sub-Phases

---

#### Phase 9A: Refactor Sidebar to Minimal Layout (✅ COMPLETED)

**Goal**: Reduce sidebar to essential actions with compact weather summary.

**New Sidebar Structure**:
```
┌─────────────────────────────────┐
│ [Location Search]               │  ← Always visible
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ ☀️ 12°C  Partly Cloudy      │ │  ← Compact weather summary
│ │ 🌅 Golden: 16:32 - 17:15    │ │     (clickable to expand)
│ │ 📸 Score: 72/100            │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Search Radius: [====] 2km       │  ← Compact slider
│ Date/Time: [📅 Jan 18, 16:00]   │  ← Inline picker
├─────────────────────────────────┤
│ POI Filters: [🅿️][☕][👁️][🚻][ℹ️] │  ← Icon-only toggles
├─────────────────────────────────┤
│ 💾 Saved Locations (3)     [+]  │  ← Collapsed list
│ 🕐 Recently Viewed (5)     [+]  │  ← Collapsed list
└─────────────────────────────────┘
```

**Tasks**:
- [x] Create `WeatherSummary` component (compact 3-line display)
- [x] Refactor `Sidebar.tsx` to minimal layout
- [x] Remove full weather cards from sidebar
- [x] Create icon-only `POIFiltersCompact` component
- [x] Make Saved/Recent lists collapsible by default
- [x] Remove POI list from sidebar (moves to floating card)
- [x] Create UI store for floating card state

**Files Created**:
- `components/weather/WeatherSummary.tsx` - Compact 3-line weather display (temp, golden hour, score)
- `components/map/POIFiltersCompact.tsx` - Icon-only POI filter toggles with tooltips
- `components/ui/tooltip.tsx` - shadcn/ui Tooltip component
- `src/stores/uiStore.ts` - UI state store for floating cards and sidebar sections

**Files Modified**:
- `components/layout/Sidebar.tsx` - Major refactor to minimal layout

**Key Features**:
- WeatherSummary shows temperature + condition, next golden hour time, photography score
- WeatherSummary is clickable (will open floating card in Phase 9B)
- POIFiltersCompact uses icon-only buttons with tooltips
- Saved Locations and Recently Viewed are now collapsible, collapsed by default
- Removed: Full weather cards, sun times card, conditions score card, nearby photos, POI list

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing)

---

#### Phase 9B: Create Floating Weather Card (✅ COMPLETED)

**Goal**: Detailed weather info in a floating card on the map.

**Position**: Top-left of map area (below any mobile menu button)

**Tasks**:
- [x] Create `FloatingWeatherCard` component
- [x] Add floating card container to `MapView`
- [x] Implement open/close behavior from weather summary click
- [x] Add current weather tab content
- [x] Add 7-day forecast tab content
- [x] Add close button and outside click handling

**Files Created**:
- `components/map/FloatingWeatherCard.tsx` - Detailed weather floating card with tabs
- `components/ui/tabs.tsx` - shadcn/ui Tabs component

**Files Modified**:
- `components/map/MapView.tsx` - Added FloatingWeatherCard component

**Key Features**:
- Tabs for "Current" weather and "7-Day" forecast
- Current tab shows: temperature, feels like, sun times, golden hours, blue hours, cloud cover, visibility, wind, humidity
- Photography score with breakdown (lighting, weather, visibility)
- Next golden hour countdown
- 7-Day tab lazy-loads forecast data and reuses WeatherForecastCard
- Click outside to close, Escape key to close
- Smooth slide-in animation
- Positioned top-left of map area

**Behavior**:
- Opens when clicking weather summary in sidebar
- Can be closed with X button or clicking outside
- Shows current weather by default, tab to 7-day forecast
- Forecast data is lazy-loaded when tab is first opened

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing)

---

#### Phase 9C: Create Floating Location Card (✅ COMPLETED)

**Goal**: Show selected location details + nearby content near the pin.

**Position**: Bottom-right of map (near selected location)

```
┌─────────────────────────────────┐
│ 📍 Selected Location       [✕]  │
│ 51.5074°N, 0.1278°W             │
├─────────────────────────────────┤
│ Nearby POIs (12)           [▶]  │
│ 🅿️ Parking (3) ☕ Cafe (2)      │
├─────────────────────────────────┤
│ 📸 Nearby Photos (8)       [▶]  │
│ [thumb] [thumb] [thumb] [+5]    │
├─────────────────────────────────┤
│ [💾 Save Location]              │
└─────────────────────────────────┘
```

**Tasks**:
- [x] Create `FloatingLocationCard` component
- [x] Move POI summary logic to floating card
- [x] Move photo thumbnails to floating card
- [x] Add photo gallery expand functionality (opens PhotoDialog)
- [x] Add quick save button with inline form

**Files Created**:
- `components/map/FloatingLocationCard.tsx` - Location details floating card

**Files Modified**:
- `components/map/MapView.tsx` - Added FloatingLocationCard component

**Key Features**:
- Auto-opens when a location is selected on the map
- Shows coordinates formatted as "51.5074°N, 0.1278°W"
- POI summary with colored badges grouped by type
- Photo thumbnails (first 3 + remaining count) with click to open PhotoDialog
- Quick save button with inline name input for authenticated users
- Click outside or Escape key to close
- Debounced photo fetching (500ms) to prevent API spam
- Smooth slide-in-from-right animation
- Wikimedia Commons attribution link

**Behavior**:
- Appears when a location is selected on the map
- Click photo thumbnails to open full-size PhotoDialog
- Save button shows inline input for quick location naming
- Click outside to close, Escape key to close

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing)

---

#### Phase 9D: Create Bottom Sheet for Expanded Content (✅ COMPLETED)

**Goal**: Full-screen expandable panel for detailed lists (POIs, photos, forecasts).

**Trigger**: Click "expand" on floating cards or sidebar sections.

**Tasks**:
- [x] Create reusable `BottomSheet` component
- [x] Implement three states: collapsed, peek, expanded
- [x] Create `POIBottomSheet` with grouped POI content
- [x] Create `PhotosBottomSheet` with photo gallery
- [x] Create `ForecastBottomSheet` with 7-day details
- [x] Add swipe gestures for expand/collapse
- [x] Add click outside to close

**Files Created**:
- `components/layout/BottomSheet.tsx` - Reusable expandable sheet with drag/swipe gestures
- `components/poi/POIBottomSheet.tsx` - POI-specific content with grouped display
- `components/weather/ForecastBottomSheet.tsx` - 7-day forecast with photography scores
- `components/photos/PhotosBottomSheet.tsx` - Photo gallery with full grid view

**Files Modified**:
- `components/map/MapView.tsx` - Added bottom sheet components
- `components/map/FloatingLocationCard.tsx` - Added "View All" buttons for POIs and Photos
- `components/map/FloatingWeatherCard.tsx` - Added "View Full Forecast" button

**Key Features**:
- Drag handle for swipe gestures (up to expand, down to collapse/close)
- Three states: collapsed (hidden), peek (partial), expanded (full)
- Click outside or Escape key to close
- Backdrop overlay when expanded
- Double-click header to toggle expand/collapse
- Smooth CSS transitions

**Behavior**:
- POI Bottom Sheet: Shows grouped POIs by category, with directions and "Show on Map" buttons
- Photos Bottom Sheet: Full grid view of nearby photos with distance and license info
- Forecast Bottom Sheet: Expandable day cards with detailed weather and photography scores

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing)

---

#### Phase 9E: Mobile Adaptations (✅ COMPLETED)

**Goal**: Ensure floating cards work well on small screens.

**Mobile Layout**:
```
┌─────────────────────────────────┐
│ [≡]  ☀️ 12°C | Golden: 16:32    │  ← Top bar (weather summary)
├─────────────────────────────────┤
│                                 │
│              MAP                │
│                                 │
├─────────────────────────────────┤
│ 📍 Location | 🅿️ 3 | 📸 8  [▲]  │  ← Bottom peek bar
└─────────────────────────────────┘
```

**Tasks**:
- [x] Create `MobileWeatherBar` component (compact top bar)
- [x] Create `MobileBottomPeek` component (bottom summary bar)
- [x] Update `AppShell` with mobile-specific layouts
- [x] Add responsive breakpoints to floating cards
- [x] Ensure bottom sheet is primary detail view on mobile
- [ ] Test all interactions on touch devices (deferred to manual testing)

**Files Created**:
- `components/mobile/MobileWeatherBar.tsx` - Compact weather bar for mobile (temp, golden hour, score)
- `components/mobile/MobileBottomPeek.tsx` - Bottom bar showing location, POI count, photo count
- `src/hooks/useWeather.ts` - Shared weather hook with caching (5 min)
- `src/hooks/useNearbyPhotos.ts` - Shared photos hook with deduplication

**Files Modified**:
- `components/layout/AppShell.tsx` - Added mobile bars, integrated shared hooks
- `components/map/FloatingWeatherCard.tsx` - Hidden on mobile (lg:block)
- `components/map/FloatingLocationCard.tsx` - Hidden on mobile (lg:block)

**Key Features**:
- MobileWeatherBar shows temperature, weather condition, next golden hour, and photography score
- Tapping weather bar opens forecast bottom sheet (not floating card)
- MobileBottomPeek shows coordinates, POI count, and photo count with tap targets
- Floating cards hidden on mobile - bottom sheets are primary detail view
- Shared hooks reduce duplicate API calls and state management

**Validation Results**: ✅ typecheck | ✅ lint | ✅ test (180/180 passing)

---

### File Changes Summary

#### New Files
| File | Purpose | Status |
|------|---------|--------|
| `components/weather/WeatherSummary.tsx` | Compact 3-line weather display | ✅ |
| `components/map/FloatingWeatherCard.tsx` | Detailed weather floating card | ✅ |
| `components/map/FloatingLocationCard.tsx` | Location + POI + photos card | ✅ |
| `components/layout/BottomSheet.tsx` | Reusable expandable bottom sheet | ✅ |
| `components/poi/POIBottomSheet.tsx` | POI-specific bottom sheet content | ✅ |
| `components/weather/ForecastBottomSheet.tsx` | 7-day forecast bottom sheet | ✅ |
| `components/photos/PhotosBottomSheet.tsx` | Photo gallery bottom sheet | ✅ |
| `components/mobile/MobileWeatherBar.tsx` | Mobile top bar with weather | ✅ |
| `components/mobile/MobileBottomPeek.tsx` | Mobile bottom peek bar | ✅ |
| `src/hooks/useWeather.ts` | Shared weather hook with caching | ✅ |
| `src/hooks/useNearbyPhotos.ts` | Shared photos hook | ✅ |

#### Modified Files
| File | Changes |
|------|---------|
| `components/layout/Sidebar.tsx` | Remove weather/POI details, add summary |
| `components/layout/AppShell.tsx` | Add floating card containers, mobile bars |
| `components/map/MapView.tsx` | Add floating card positioning layer |
| `components/map/POIFilters.tsx` | Convert to icon-only compact mode |

---

### Component Hierarchy

```
AppShell
├── Sidebar (desktop) / Sheet (mobile)
│   ├── LocationSearch
│   ├── WeatherSummary (NEW - clickable)
│   ├── RadiusSlider (compact)
│   ├── DateTimePicker (inline)
│   ├── POIFilters (icons only)
│   ├── SavedLocationsList (collapsed)
│   └── RecentlyViewed (collapsed)
│
├── MapContainer
│   ├── MapView
│   ├── FloatingWeatherCard (NEW - top-left)
│   ├── FloatingLocationCard (NEW - bottom-right)
│   ├── MapControls (existing - top-right)
│   └── BottomSheet (NEW - expandable)
│
└── MobileWeatherBar (NEW - mobile only)
```

---

### Validation Steps

After each sub-phase:
```bash
npm run typecheck && npm run lint && npm run test
```

**Verification Checklist**:
1. **Visual check**: Sidebar fits without scrolling on 768px height viewport
2. **Weather flow**: Click summary → floating card opens → click 7-day → bottom sheet expands
3. **Location flow**: Click map → location card appears → shows POIs/photos → click to expand
4. **Mobile test**: Test on 375px width - all content accessible via bottom sheet
5. **Existing features**: All current functionality preserved, just reorganized
6. **Performance**: Floating cards use same data stores, no extra API calls

---

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Floating cards obscure map | Add minimize/close buttons, remember state |
| Too many cards open at once | Limit to 1-2 floating cards, use bottom sheet for details |
| Mobile complexity | Progressive disclosure, bottom sheet as primary mobile pattern |
| User confusion with new layout | Keep weather summary prominent, clear visual hierarchy |

---

### Success Criteria

- [x] Sidebar fits on 768px height without scrolling
- [x] Weather summary shows temp, condition, golden hour, and score
- [x] Clicking weather summary opens floating weather card
- [x] Floating location card shows POIs and photos for selected location
- [x] Bottom sheet expands to show full details
- [x] Mobile layout uses top bar + bottom peek pattern
- [x] All existing functionality preserved
- [x] All tests pass (180/180)
- [x] Production build succeeds

**🎉 PHASE 9 COMPLETE! All success criteria achieved.**

---

## 📋 Phase 10: Weather Alerts & Notifications (PLANNED)

### Goal
Allow users to set up automated alerts for favorable photography conditions at their saved locations. Receive notifications when golden hour approaches, weather clears, or conditions match their preferences.

### Overview

**Core Concept**: Users configure alert rules (e.g., "notify me when cloud cover < 30% at Sunrise") and receive browser push notifications or email alerts when conditions are met.

**Architecture**:
```
User → Creates Alert Rule → Stored in Database
                              ↓
              Scheduled Job (every 15 min) checks conditions
                              ↓
              If conditions match → Send Push Notification
```

### Sub-Phases

#### Phase 10A: Alert Database Schema & Types
**Goal**: Set up database tables for storing alert configurations.

**Tasks**:
- [ ] Create `alert_rules` table with conditions (location_id, alert_type, thresholds)
- [ ] Create `alert_history` table for tracking sent notifications
- [ ] Add RLS policies for user-owned alerts
- [ ] Generate TypeScript types
- [ ] Create Zod schemas for alert validation

**Database Schema**:
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('golden_hour', 'clear_skies', 'low_wind', 'custom')),
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Example: {"max_cloud_cover": 30, "min_visibility": 10, "max_wind_speed": 20}
  time_window JSONB, -- {"start_hour": 5, "end_hour": 9} for morning alerts
  days_of_week INTEGER[], -- [0,6] for weekends only
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  conditions_snapshot JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT false
);
```

**Files to Create**:
- `supabase/migrations/20260120000001_add_alert_tables.sql`
- `src/types/alerts.types.ts`
- `lib/queries/alerts.ts`
- `app/actions/alerts.ts`

---

#### Phase 10B: Alert Configuration UI
**Goal**: Build UI for creating and managing alert rules.

**Tasks**:
- [ ] Create `AlertRuleForm` component with condition builder
- [ ] Create `AlertRuleCard` component for displaying rules
- [ ] Create `AlertRulesList` component for managing all alerts
- [ ] Create `AlertsDialog` accessible from location cards
- [ ] Add alert quick-create from weather card ("Alert me when conditions like this")
- [ ] Create alert store with Zustand

**UI Components**:
```
┌─────────────────────────────────────────┐
│ 🔔 Create Alert                    [✕]  │
├─────────────────────────────────────────┤
│ Location: [Dropdown - saved locations]  │
│ Alert Name: [________________]          │
├─────────────────────────────────────────┤
│ Alert Type:                             │
│ ○ Golden Hour Reminder (30 min before)  │
│ ○ Clear Skies (cloud cover < ___%)      │
│ ○ Low Wind (wind speed < ___ mph)       │
│ ○ Custom Conditions                     │
├─────────────────────────────────────────┤
│ When to Check:                          │
│ ☑ Morning (5am - 10am)                  │
│ ☑ Evening (4pm - 9pm)                   │
│ Days: [M][T][W][T][F][S][S]            │
├─────────────────────────────────────────┤
│ [Cancel]              [Create Alert]    │
└─────────────────────────────────────────┘
```

**Files to Create**:
- `src/stores/alertStore.ts`
- `components/alerts/AlertRuleForm.tsx`
- `components/alerts/AlertRuleCard.tsx`
- `components/alerts/AlertRulesList.tsx`
- `components/alerts/AlertsDialog.tsx`
- `components/alerts/ConditionBuilder.tsx`

---

#### Phase 10C: Push Notification Service
**Goal**: Implement Web Push API for browser notifications.

**Tasks**:
- [ ] Set up Web Push with VAPID keys
- [ ] Create service worker for push notifications
- [ ] Build notification permission request flow
- [ ] Store push subscriptions in database
- [ ] Create notification sending utility
- [ ] Handle notification clicks (open app to location)

**Technical Details**:
- Use Web Push API (no external service needed for browser notifications)
- Generate VAPID keys and store in environment variables
- Service worker handles background notifications
- Fallback to in-app notification center if push denied

**Files to Create**:
- `public/sw.js` - Service worker for push
- `lib/notifications/web-push.ts` - Push notification utilities
- `lib/notifications/vapid.ts` - VAPID key management
- `src/hooks/usePushNotifications.ts` - Hook for managing push subscription
- `components/notifications/NotificationPermission.tsx` - Permission request UI
- `supabase/migrations/20260120000002_add_push_subscriptions.sql`

---

#### Phase 10D: Alert Checking Logic
**Goal**: Implement scheduled checking of alert conditions.

**Tasks**:
- [ ] Create alert condition evaluation logic
- [ ] Build weather condition matcher
- [ ] Implement golden hour proximity checker
- [ ] Create API route for checking alerts (can be called by cron)
- [ ] Add rate limiting to prevent notification spam
- [ ] Implement alert cooldown (don't re-trigger for X hours)

**Architecture Options**:
1. **Vercel Cron Jobs** (recommended for Hobby plan)
   - Create `/api/cron/check-alerts` route
   - Configure in `vercel.json` to run every 15 minutes

2. **Client-side checking** (fallback)
   - Check conditions when user opens app
   - Less reliable but no server costs

**Files to Create**:
- `app/api/cron/check-alerts/route.ts` - Cron endpoint
- `lib/alerts/condition-matcher.ts` - Evaluate alert conditions
- `lib/alerts/alert-checker.ts` - Main alert checking logic
- `vercel.json` - Cron configuration

---

#### Phase 10E: Notification Center UI
**Goal**: In-app notification history and management.

**Tasks**:
- [ ] Create notification center dropdown/panel
- [ ] Show recent alerts with conditions that triggered them
- [ ] Add "View Location" action from notification
- [ ] Add notification preferences (quiet hours, frequency limits)
- [ ] Create notification badge for unread alerts

**Files to Create**:
- `components/notifications/NotificationCenter.tsx`
- `components/notifications/NotificationItem.tsx`
- `components/notifications/NotificationBadge.tsx`
- `src/stores/notificationStore.ts`

---

### Technical Considerations

**Web Push Setup**:
```bash
# Generate VAPID keys
npx web-push generate-vapid-keys
```

**Environment Variables**:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:alerts@photoscout.app
```

**Rate Limiting**:
- Max 1 notification per alert per 6 hours
- Max 10 notifications per user per day
- Respect quiet hours (configurable, default 10pm-7am)

### Success Criteria
- [ ] Users can create alert rules for saved locations
- [ ] Browser push notifications work when conditions match
- [ ] Notification center shows alert history
- [ ] Alerts respect cooldown and rate limits
- [ ] Users can enable/disable individual alerts
- [ ] All tests pass
- [ ] Production build succeeds

---

## 📋 Phase 11: Community Photo Spots (PLANNED)

### Goal
Enable users to share their photography locations with the community, discover spots shared by others, and build a collaborative database of UK photography locations.

### Overview

**Core Concept**: Users can mark their saved locations as "public" to share with the community. A discovery page shows popular and nearby community spots with photos, ratings, and tips.

**Privacy Model**:
- Private (default): Only visible to owner
- Public: Visible to all users, appears in community discovery
- Unlisted: Accessible via direct link but not in discovery

### Sub-Phases

#### Phase 11A: Public Locations Schema
**Goal**: Extend locations table for community features.

**Tasks**:
- [ ] Add visibility enum to locations (private, public, unlisted)
- [ ] Add community metadata (view_count, favorite_count, featured)
- [ ] Create `location_favorites` table for user favorites
- [ ] Create `location_reports` table for moderation
- [ ] Update RLS policies for public access
- [ ] Add indexes for community queries

**Database Schema**:
```sql
-- Add to locations table
ALTER TABLE locations ADD COLUMN visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('private', 'public', 'unlisted'));
ALTER TABLE locations ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN favorite_count INTEGER DEFAULT 0;
ALTER TABLE locations ADD COLUMN is_featured BOOLEAN DEFAULT false;
ALTER TABLE locations ADD COLUMN featured_at TIMESTAMPTZ;

-- Favorites table
CREATE TABLE location_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- Reports table for moderation
CREATE TABLE location_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('inappropriate', 'inaccurate', 'private_property', 'dangerous', 'spam', 'other')),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to Create**:
- `supabase/migrations/20260121000001_add_community_features.sql`
- `lib/queries/community.ts`
- `app/actions/community.ts`

---

#### Phase 11B: Community Discovery Page
**Goal**: Build a page for exploring public photography locations.

**Tasks**:
- [ ] Create `/discover` page with location grid
- [ ] Add filtering (by region, tags, distance)
- [ ] Add sorting (popular, recent, nearest)
- [ ] Implement infinite scroll or pagination
- [ ] Show location cards with preview info
- [ ] Add map view toggle for discovery

**Page Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Discover Photo Spots                                     │
├─────────────────────────────────────────────────────────────┤
│ [Search locations...] [Region ▼] [Tags ▼] [Sort: Popular ▼] │
├─────────────────────────────────────────────────────────────┤
│ [📍 Map View] [📋 Grid View]                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ 📸      │ │ 📸      │ │ 📸      │ │ 📸      │            │
│ │ Name    │ │ Name    │ │ Name    │ │ Name    │            │
│ │ ⭐ 24   │ │ ⭐ 18   │ │ ⭐ 15   │ │ ⭐ 12   │            │
│ │ 5.2 km  │ │ 12 km   │ │ 8.3 km  │ │ 3.1 km  │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
│                                                             │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │ ...     │ │ ...     │ │ ...     │ │ ...     │            │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create**:
- `app/discover/page.tsx`
- `components/community/DiscoveryGrid.tsx`
- `components/community/DiscoveryMap.tsx`
- `components/community/LocationPreviewCard.tsx`
- `components/community/DiscoveryFilters.tsx`

---

#### Phase 11C: Location Detail Page
**Goal**: Public-facing page for viewing shared locations.

**Tasks**:
- [ ] Create `/spot/[id]` dynamic route
- [ ] Show full location details (description, notes, photos)
- [ ] Display current weather and photography conditions
- [ ] Show nearby POIs and amenities
- [ ] Add favorite button for logged-in users
- [ ] Add "Open in App" button to view on main map
- [ ] Add social sharing (Twitter, Facebook, copy link)
- [ ] Show similar nearby locations

**Files to Create**:
- `app/spot/[id]/page.tsx`
- `components/community/SpotDetail.tsx`
- `components/community/SpotWeather.tsx`
- `components/community/SimilarSpots.tsx`
- `components/community/FavoriteButton.tsx`

---

#### Phase 11D: Sharing & Visibility Controls
**Goal**: Allow users to control location visibility and share.

**Tasks**:
- [ ] Add visibility selector to SaveLocationForm
- [ ] Add visibility selector to EditLocationForm
- [ ] Create share dialog with visibility options
- [ ] Generate shareable links for public/unlisted locations
- [ ] Add "Make Public" quick action on location cards
- [ ] Show public indicator on owned public locations

**Files to Modify**:
- `components/locations/SaveLocationForm.tsx` - Add visibility
- `components/locations/EditLocationForm.tsx` - Add visibility
- `components/locations/ShareLocationDialog.tsx` - Enhance for community
- `components/locations/LocationCard.tsx` - Show public indicator

---

#### Phase 11E: Favorites & User Profiles
**Goal**: Allow users to favorite locations and view their profile.

**Tasks**:
- [ ] Create favorites store and hooks
- [ ] Add favorite button to location cards and detail pages
- [ ] Create "My Favorites" section in sidebar or separate page
- [ ] Create basic user profile page showing public locations
- [ ] Add favorite count display on public locations
- [ ] Track view counts for analytics

**Files to Create**:
- `src/stores/favoritesStore.ts`
- `src/hooks/useFavorites.ts`
- `components/community/FavoritesList.tsx`
- `app/profile/[userId]/page.tsx`
- `components/community/UserProfile.tsx`

---

### Technical Considerations

**SEO for Public Pages**:
- Generate metadata for `/spot/[id]` pages
- Add Open Graph tags for social sharing
- Create sitemap for public locations

**Moderation**:
- Report button on all public locations
- Admin review queue (future enhancement)
- Auto-hide locations with multiple reports

**Performance**:
- Cache popular locations
- Use PostGIS for efficient nearby queries
- Lazy load images in discovery grid

### Success Criteria
- [ ] Users can set locations as public/private/unlisted
- [ ] Discovery page shows community locations with filters
- [ ] Public location detail pages work and are shareable
- [ ] Users can favorite locations
- [ ] View and favorite counts tracked
- [ ] All tests pass
- [ ] Production build succeeds

---

## 📋 Phase 12: Photo Upload & Tagging (PLANNED)

### Goal
Allow users to upload their own photos to locations, automatically extract GPS coordinates from EXIF data, and build a personal photo library linked to photography spots.

### Overview

**Core Concept**: Users upload photos which are stored in Supabase Storage. EXIF data is extracted to auto-suggest location coordinates. Photos can be linked to saved locations or create new locations.

**Storage**: Supabase Storage (included in free tier, 1GB limit)

### Sub-Phases

#### Phase 12A: Supabase Storage Setup
**Goal**: Configure storage buckets and policies for photo uploads.

**Tasks**:
- [ ] Create `photos` storage bucket in Supabase
- [ ] Configure RLS policies for user-owned photos
- [ ] Set up image transformation (thumbnails, optimized)
- [ ] Create `user_photos` database table for metadata
- [ ] Add storage size limits per user

**Database Schema**:
```sql
CREATE TABLE user_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  -- EXIF data
  exif_data JSONB,
  taken_at TIMESTAMPTZ,
  camera_make TEXT,
  camera_model TEXT,
  focal_length TEXT,
  aperture TEXT,
  shutter_speed TEXT,
  iso INTEGER,
  -- GPS from EXIF
  exif_latitude FLOAT,
  exif_longitude FLOAT,
  -- User metadata
  title TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX user_photos_user_id_idx ON user_photos(user_id);
CREATE INDEX user_photos_location_id_idx ON user_photos(location_id);
```

**Files to Create**:
- `supabase/migrations/20260122000001_add_user_photos.sql`
- `lib/supabase/storage.ts` - Storage utilities
- `lib/queries/photos.ts` - Photo database queries
- `app/actions/photos.ts` - Photo server actions

---

#### Phase 12B: Photo Upload Component
**Goal**: Build drag-and-drop photo upload with progress.

**Tasks**:
- [ ] Create `PhotoUploader` component with drag-and-drop
- [ ] Add upload progress indicator
- [ ] Support multiple file upload
- [ ] Validate file types (JPEG, PNG, WebP)
- [ ] Validate file size (max 10MB per photo)
- [ ] Show upload preview thumbnails
- [ ] Handle upload errors gracefully

**UI Component**:
```
┌─────────────────────────────────────────┐
│ 📸 Upload Photos                        │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │     Drag photos here or click      │ │
│ │          to browse                  │ │
│ │                                     │ │
│ │     JPEG, PNG, WebP up to 10MB     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Uploading: photo1.jpg                   │
│ [████████████░░░░░░░░] 65%              │
├─────────────────────────────────────────┤
│ ✓ photo2.jpg - Uploaded                 │
│ ✓ photo3.jpg - Uploaded                 │
└─────────────────────────────────────────┘
```

**Files to Create**:
- `components/photos/PhotoUploader.tsx`
- `components/photos/UploadProgress.tsx`
- `components/photos/UploadPreview.tsx`
- `src/hooks/usePhotoUpload.ts`

---

#### Phase 12C: EXIF Data Extraction
**Goal**: Extract and display photo metadata including GPS coordinates.

**Tasks**:
- [ ] Integrate EXIF parsing library (exifr or exif-js)
- [ ] Extract GPS coordinates from photos
- [ ] Extract camera settings (aperture, shutter, ISO, focal length)
- [ ] Extract capture timestamp
- [ ] Show EXIF data in photo details
- [ ] Auto-suggest location from GPS coordinates

**EXIF Fields to Extract**:
- GPS Latitude/Longitude
- DateTimeOriginal
- Make, Model (camera)
- FocalLength
- FNumber (aperture)
- ExposureTime (shutter speed)
- ISOSpeedRatings
- Orientation

**Files to Create**:
- `lib/photos/exif-parser.ts` - EXIF extraction utilities
- `components/photos/ExifDisplay.tsx` - Show camera settings
- `components/photos/LocationSuggestion.tsx` - Suggest location from GPS

---

#### Phase 12D: Photo Library & Management
**Goal**: Build photo gallery for managing uploaded photos.

**Tasks**:
- [ ] Create `/photos` page for user's photo library
- [ ] Create photo grid with lazy loading
- [ ] Add photo detail view/dialog
- [ ] Enable photo editing (title, description)
- [ ] Enable photo deletion with confirmation
- [ ] Filter photos by location, date, unlinked
- [ ] Bulk actions (delete, link to location)

**Files to Create**:
- `app/photos/page.tsx`
- `components/photos/PhotoLibrary.tsx`
- `components/photos/PhotoGrid.tsx`
- `components/photos/PhotoDetailDialog.tsx`
- `components/photos/PhotoEditForm.tsx`
- `src/stores/photoLibraryStore.ts`

---

#### Phase 12E: Location-Photo Linking
**Goal**: Connect photos to saved locations.

**Tasks**:
- [ ] Add "Link to Location" action on photos
- [ ] Show location selector dialog
- [ ] Auto-suggest nearest saved location based on GPS
- [ ] Create location from photo GPS (new location flow)
- [ ] Show linked photos on location cards
- [ ] Show photo count on map markers
- [ ] Add photos section to location detail view

**Files to Create**:
- `components/photos/LinkToLocationDialog.tsx`
- `components/photos/LocationPhotoGallery.tsx`
- `components/locations/LocationPhotos.tsx`

**Files to Modify**:
- `components/locations/LocationCard.tsx` - Show photo thumbnails
- `components/map/SavedLocationMarkers.tsx` - Show photo count badge

---

### Technical Considerations

**Storage Limits**:
- Supabase free tier: 1GB storage
- Implement per-user quotas (e.g., 100MB per user)
- Show storage usage in settings

**Image Optimization**:
- Generate thumbnails on upload (200x200)
- Generate medium size for galleries (800x600)
- Use Supabase image transformations

**Dependencies**:
```bash
npm install exifr  # EXIF parsing
```

**Privacy**:
- Strip EXIF GPS data from public photos (optional setting)
- Photos private by default
- Warn users about GPS data in photos

### Success Criteria
- [ ] Users can upload photos via drag-and-drop
- [ ] EXIF data extracted and displayed (camera settings, GPS)
- [ ] Photos can be linked to saved locations
- [ ] Photo library page with filtering and management
- [ ] GPS coordinates auto-suggest location matches
- [ ] All tests pass
- [ ] Production build succeeds

---

## 📋 Phase 13: Route Planning (PLANNED)

### Goal
Enable photographers to plan multi-location shoots with route optimization, travel time estimates, and exportable itineraries.

### Overview

**Core Concept**: Users create "trips" with multiple photography locations, get optimal route suggestions, see travel times between stops, and export the route for navigation.

**Routing API**: OpenRouteService (free tier: 2000 requests/day)

### Sub-Phases

#### Phase 13A: Trips Database Schema
**Goal**: Create data model for multi-location trips.

**Tasks**:
- [ ] Create `trips` table for trip metadata
- [ ] Create `trip_stops` table for ordered locations
- [ ] Add trip-related RLS policies
- [ ] Generate TypeScript types
- [ ] Create trip query functions

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
  -- Allow custom stops not from saved locations
  custom_name TEXT,
  custom_lat FLOAT,
  custom_lng FLOAT,
  stop_order INTEGER NOT NULL,
  planned_arrival TIME,
  planned_duration_minutes INTEGER DEFAULT 60,
  notes TEXT,
  -- Routing info to next stop
  distance_to_next_meters INTEGER,
  duration_to_next_seconds INTEGER,
  route_geometry JSONB, -- GeoJSON LineString
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

#### Phase 13B: OpenRouteService Integration
**Goal**: Integrate routing API for directions and travel times.

**Tasks**:
- [ ] Create OpenRouteService API client
- [ ] Implement route calculation between points
- [ ] Support multiple transport modes (driving, walking, cycling)
- [ ] Parse route geometry for map display
- [ ] Cache route calculations
- [ ] Handle API errors and rate limits

**API Endpoints**:
- `POST /v2/directions/{profile}` - Get route between points
- Profiles: `driving-car`, `foot-walking`, `cycling-regular`

**Files to Create**:
- `lib/api/openrouteservice.ts` - API client
- `src/types/routing.types.ts` - Route types
- `app/actions/routing.ts` - Server actions

---

#### Phase 13C: Trip Planner UI
**Goal**: Build interface for creating and editing trips.

**Tasks**:
- [ ] Create trip creation dialog/page
- [ ] Build stop list with drag-to-reorder
- [ ] Add stop from saved locations or map click
- [ ] Show travel time between stops
- [ ] Add planned duration at each stop
- [ ] Calculate total trip duration
- [ ] Show golden hour windows for trip date

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

#### Phase 13D: Route Display on Map
**Goal**: Show planned route on the map with markers and polyline.

**Tasks**:
- [ ] Create route polyline layer on map
- [ ] Show numbered markers for each stop
- [ ] Highlight active/selected stop
- [ ] Allow adding stops by clicking map
- [ ] Show route info popup on polyline hover
- [ ] Animate route drawing

**Files to Create**:
- `components/map/TripRouteLayer.tsx`
- `components/map/TripStopMarkers.tsx`
- `lib/utils/route-geometry.ts` - GeoJSON utilities

---

#### Phase 13E: Route Optimization
**Goal**: Suggest optimal stop order to minimize travel time.

**Tasks**:
- [ ] Implement traveling salesman approximation
- [ ] Use OpenRouteService optimization endpoint (if available)
- [ ] Show comparison (original vs optimized)
- [ ] Allow user to accept/reject optimization
- [ ] Consider time constraints (golden hour windows)

**Files to Create**:
- `lib/trips/route-optimizer.ts`
- `components/trips/OptimizationDialog.tsx`

---

#### Phase 13F: Trip Export & Sharing
**Goal**: Export trips for use in navigation apps.

**Tasks**:
- [ ] Export trip to GPX format (for GPS devices)
- [ ] Export trip to KML format (for Google Earth)
- [ ] Generate printable trip summary
- [ ] Create shareable trip links
- [ ] Export to Google Maps directions URL

**Files to Create**:
- `lib/trips/export-gpx.ts`
- `lib/trips/export-kml.ts`
- `components/trips/TripExportDialog.tsx`
- `app/trip/[id]/page.tsx` - Shareable trip page

---

### Technical Considerations

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

### Success Criteria
- [ ] Users can create trips with multiple stops
- [ ] Routes calculated with travel times between stops
- [ ] Route displayed on map with polyline
- [ ] Drag-to-reorder stops works smoothly
- [ ] Route optimization suggests better order
- [ ] Export to GPX/KML works
- [ ] All tests pass
- [ ] Production build succeeds

---

## 📋 Phase 14: Location Comparison (PLANNED)

### Goal
Allow photographers to compare multiple locations side-by-side to choose the best spot for their shoot based on weather, lighting, and conditions.

### Overview

**Core Concept**: Users select 2-4 locations and see them in a comparison view with weather, sun times, photography scores, and conditions displayed side-by-side.

### Sub-Phases

#### Phase 14A: Comparison Selection UI
**Goal**: Allow users to select locations for comparison.

**Tasks**:
- [ ] Add "Compare" checkbox/button to location cards
- [ ] Create comparison selection bar (shows selected locations)
- [ ] Limit selection to 4 locations max
- [ ] Add "Clear Selection" and "Compare Now" buttons
- [ ] Store comparison selection in store
- [ ] Add comparison mode to map (highlight selected)

**UI Component**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Compare Locations (3 selected)              [Clear] [Go] │
│ [Castlerigg ✕] [Derwentwater ✕] [Buttermere ✕] [+ Add]      │
└─────────────────────────────────────────────────────────────┘
```

**Files to Create**:
- `src/stores/comparisonStore.ts`
- `components/comparison/ComparisonSelectionBar.tsx`
- `components/comparison/CompareCheckbox.tsx`

**Files to Modify**:
- `components/locations/LocationCard.tsx` - Add compare checkbox
- `components/locations/SavedLocationsList.tsx` - Add selection bar

---

#### Phase 14B: Comparison View Page
**Goal**: Create dedicated comparison view with side-by-side display.

**Tasks**:
- [ ] Create `/compare` page
- [ ] Build responsive comparison grid (2-4 columns)
- [ ] Fetch weather data for all locations in parallel
- [ ] Calculate sun times for all locations
- [ ] Show photography scores with breakdown
- [ ] Highlight "best" values in each category
- [ ] Add date picker to compare for different dates

**Page Layout**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 Compare Locations                    Date: [📅 Jan 25, 2026] [Today] │
├─────────────────────────────────────────────────────────────────────────┤
│     Castlerigg        │    Derwentwater      │    Buttermere           │
│     ────────────      │    ────────────      │    ────────────         │
│                       │                      │                          │
│ 📸 Score              │ 📸 Score             │ 📸 Score                 │
│ ████████░░ 78 ⭐      │ ███████░░░ 72        │ █████████░ 85 ⭐⭐       │
│                       │                      │                          │
│ ☀️ Weather            │ ☀️ Weather           │ ☀️ Weather               │
│ Partly Cloudy         │ Cloudy               │ Clear ⭐                 │
│ 8°C                   │ 7°C                  │ 6°C                      │
│                       │                      │                          │
│ ☁️ Cloud Cover        │ ☁️ Cloud Cover       │ ☁️ Cloud Cover           │
│ 45%                   │ 68%                  │ 12% ⭐                   │
│                       │                      │                          │
│ 👁️ Visibility         │ 👁️ Visibility        │ 👁️ Visibility            │
│ 15 km ⭐              │ 10 km                │ 12 km                    │
│                       │                      │                          │
│ 🌅 Golden Hour        │ 🌅 Golden Hour       │ 🌅 Golden Hour           │
│ 16:32 - 17:08         │ 16:30 - 17:05        │ 16:35 - 17:12 ⭐         │
│ (36 min)              │ (35 min)             │ (37 min)                 │
│                       │                      │                          │
│ 🌬️ Wind               │ 🌬️ Wind              │ 🌬️ Wind                  │
│ 12 mph NW             │ 18 mph W             │ 8 mph N ⭐               │
│                       │                      │                          │
│ 📍 Distance           │ 📍 Distance          │ 📍 Distance              │
│ 45 km                 │ 52 km                │ 68 km                    │
│                       │                      │                          │
│ [View] [Remove]       │ [View] [Remove]      │ [View] [Remove]          │
└─────────────────────────────────────────────────────────────────────────┘
│                                                                         │
│ 💡 Recommendation: Buttermere has the best conditions today with        │
│    clear skies, low wind, and the longest golden hour window.           │
│                                                                         │
│    [📍 View Buttermere on Map]                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Files to Create**:
- `app/compare/page.tsx`
- `components/comparison/ComparisonGrid.tsx`
- `components/comparison/LocationComparisonCard.tsx`
- `components/comparison/ComparisonRecommendation.tsx`

---

#### Phase 14C: Mini Map Comparison
**Goal**: Show small maps for each location in comparison view.

**Tasks**:
- [ ] Create mini map component for comparison cards
- [ ] Show location marker and radius on mini map
- [ ] Add sun position indicator (direction of golden hour light)
- [ ] Make mini maps interactive (click to expand)

**Files to Create**:
- `components/comparison/MiniMap.tsx`
- `components/comparison/SunPositionIndicator.tsx`

---

#### Phase 14D: Comparison Recommendations
**Goal**: AI-style recommendations based on comparison data.

**Tasks**:
- [ ] Create scoring comparison algorithm
- [ ] Identify "winner" in each category
- [ ] Generate natural language recommendation
- [ ] Consider user preferences in recommendation
- [ ] Show trade-offs (e.g., "Better weather but longer drive")

**Recommendation Logic**:
```typescript
interface ComparisonResult {
  overallWinner: Location;
  categoryWinners: {
    weather: Location;
    lighting: Location;
    wind: Location;
    visibility: Location;
    goldenHourDuration: Location;
  };
  recommendation: string;
  tradeoffs: string[];
}
```

**Files to Create**:
- `lib/comparison/compare-locations.ts`
- `lib/comparison/generate-recommendation.ts`

---

#### Phase 14E: Quick Compare from Map
**Goal**: Enable quick comparison without leaving the main map view.

**Tasks**:
- [ ] Add split-view mode to main map
- [ ] Show 2-location comparison in floating panel
- [ ] Enable "Compare with selected" on location markers
- [ ] Add comparison mini-view in bottom sheet

**Files to Create**:
- `components/comparison/QuickComparePanel.tsx`
- `components/comparison/SplitMapView.tsx`

---

### Technical Considerations

**Performance**:
- Fetch weather for all locations in parallel
- Cache comparison results for same date
- Lazy load mini maps

**Responsive Design**:
- Stack cards vertically on mobile
- Swipeable card carousel on small screens
- Full grid on desktop

**Accessibility**:
- Screen reader friendly comparison
- Keyboard navigation between cards
- High contrast for "best" indicators

### Success Criteria
- [ ] Users can select 2-4 locations for comparison
- [ ] Comparison page shows side-by-side data
- [ ] Best values highlighted in each category
- [ ] Recommendation generated based on conditions
- [ ] Works on mobile with swipeable cards
- [ ] Date picker allows comparing different days
- [ ] All tests pass
- [ ] Production build succeeds

---

## 🚀 Future Considerations

After completing Phases 10-14, potential future enhancements include:

- **Deployment to Vercel** - Production hosting with edge functions
- **Mobile App** - React Native or PWA for native experience
- **AI Photo Analysis** - Analyze uploaded photos for composition tips
- **Tide Information** - Coastal photography planning
- **Aurora/ISS Tracking** - Night sky photography features
- **Social Features** - Follow photographers, activity feed
- **Premium Tier** - Advanced features for paying users

---

**Plan Created**: 2026-01-04
**Plan Location**: `D:\Cursor\photoscout\PLAN.md`
**Last Updated**: 2026-01-19
