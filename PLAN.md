# PhotoScout Implementation Plan

## 📊 Progress Tracker

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1: Foundation & Setup** | ✅ Complete | 100% |
| **Phase 2: Database Setup** | ✅ Complete | 100% |
| **Phase 3: Core Map Interface** | ✅ Complete | 100% |
| **Phase 4: Photography Conditions** | ⏳ Next | 0% |
| **Phase 5: Weather Integration** | 📋 Planned | 0% |
| **Phase 6: Polish & Testing** | 📋 Planned | 0% |

**Last Updated**: 2026-01-11
**Current Phase**: Phase 3 Complete → Ready for Phase 4

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

## 📋 Phase 4: Photography Conditions (Days 8-10)

### Goal
Implement sun calculations (golden hour, sunrise, sunset) and photography scoring algorithm.

### Key Files to Build
- `lib/utils/sun-calculations.ts` - SunCalc wrapper functions
- `lib/utils/photo-score.ts` - Photography scoring algorithm
- `src/types/photography.types.ts` - Type definitions
- `components/weather/SunTimesCard.tsx` - Displays sun times
- `components/weather/ConditionsScore.tsx` - Displays photo score
- Unit tests for sun calculations and scoring

### Validation
- Sun times calculate correctly for UK locations
- Golden hour detection works across seasons
- Photography scores make sense for test scenarios
- All tests pass with >95% coverage

---

## 📋 Phase 5: Weather Integration (Days 11-13)

### Goal
Create mocked Met Office API client, implement weather display, and integrate with photography scoring.

### Key Files to Build
- `lib/api/base.ts` - API error handling and retry logic
- `lib/api/met-office.ts` - Met Office API client (mocked)
- `src/mocks/handlers.ts` - MSW mock handlers
- `src/mocks/server.ts` - MSW server setup
- `app/actions/weather.ts` - Server action for weather
- `components/weather/WeatherCard.tsx` - Weather display component

### Validation
- Weather card displays mock data
- Photography score integrates weather data
- Loading states work correctly
- No API errors in console

---

## 📋 Phase 6: Polish & Testing (Days 14-15)

### Goal
Add error handling, loading states, improve mobile responsiveness, and achieve good test coverage.

### Key Files to Build
- `components/shared/ErrorBoundary.tsx` - Error boundary
- `components/shared/LoadingSpinner.tsx` - Loading spinner
- `components/layout/BottomSheet.tsx` - Mobile bottom sheet
- `app/error.tsx` - Error page
- `app/not-found.tsx` - 404 page
- Component tests for weather components
- `README.md` - Documentation

### Validation
```bash
npm run test         # All tests pass
npm run typecheck    # No TypeScript errors
npm run build        # Build succeeds
npm run lint         # No lint errors
```

---

## 🎯 Success Criteria (MVP Complete)

### When All Phases Done:
- ✅ Next.js project set up with TypeScript and Tailwind CSS
- ✅ Supabase database running locally with PostGIS
- ✅ Map interface displays with OpenStreetMap tiles
- ✅ Click on map selects location and shows coordinates
- ✅ Radius circle displays around selected location
- ✅ Sun times (sunrise, sunset, golden hour) calculate correctly
- ✅ Photography score displays based on mocked weather data
- ✅ Weather card shows conditions (cloud cover, visibility, wind, rain)
- ✅ Mobile responsive with bottom sheet
- ✅ All TypeScript checks pass
- ✅ Unit tests pass for core utilities
- ✅ No console errors

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

## 🚀 Post-MVP Enhancements (Future Work)

- Real Met Office API integration (when API key obtained)
- User authentication and location saving
- Wikimedia Commons photo discovery
- Overpass POI integration (parking, cafes)
- Weather alerts and notifications
- Community photo spots
- Deployment to Vercel

---

**Plan Created**: 2026-01-04
**Plan Location**: `D:\Cursor\photoscout\PLAN.md`
**Detailed Plan**: `C:\Users\iwatt\.claude\plans\composed-percolating-deer.md`
