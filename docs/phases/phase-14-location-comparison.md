# Phase 14: Location Comparison

**Status**: 🔄 In Progress
**Completion**: 80%

## Goal
Allow photographers to compare multiple locations side-by-side to choose the best spot for their shoot based on weather, lighting, and conditions.

## Overview

**Core Concept**: Users select 2-4 locations and see them in a comparison view with weather, sun times, photography scores, and conditions displayed side-by-side.

**Build Order**: 14A (Selection UI) → 14D (Comparison Logic) → 14B (Comparison Page) → 14C (Mini Maps) → 14E (Quick Compare)

---

## Sub-Phases

### Phase 14A: Comparison Selection UI

**Status**: ✅ Complete
**Goal**: Allow users to select locations for comparison.

**UI Component**:
```
+-------------------------------------------------------------+
| Compare Locations (3 selected)              [Clear] [Go]    |
| [Castlerigg x] [Derwentwater x] [Buttermere x] [+ Add]     |
+-------------------------------------------------------------+
```

**Files to Create**:
- `src/types/comparison.types.ts` - ComparisonLocation, ComparisonCategory, CategoryWinner, ComparisonResult types
- `src/stores/comparisonStore.ts` - Zustand store: isCompareMode, selectedLocationIds (max 4), comparisonDate, toggle/clear actions
- `lib/utils/parse-coordinates.ts` - Extract parseCoordinates from LocationCard into shared utility
- `components/comparison/ComparisonSelectionBar.tsx` - Sticky bar with selected location pills, Clear/Compare buttons

**Files to Modify**:
- `components/locations/LocationCard.tsx` - Add checkbox when compare mode active, "Add to Compare" in dropdown, use shared parseCoordinates
- `components/locations/SavedLocationsList.tsx` - Add "Compare" toggle button in header, render ComparisonSelectionBar

---

### Phase 14B: Comparison View Page

**Status**: ✅ Complete
**Goal**: Create dedicated comparison view with side-by-side display.

**Page Layout**:
```
+-------------------------------------------------------------------------+
| Compare Locations                    Date: [Jan 25, 2026] [Today]       |
+-------------------------------------------------------------------------+
|     Castlerigg        |    Derwentwater      |    Buttermere            |
|     --------          |    --------          |    --------              |
| Score: 78             | Score: 72            | Score: 85 *             |
| Partly Cloudy 8C      | Cloudy 7C            | Clear 6C *              |
| Cloud: 45%            | Cloud: 68%           | Cloud: 12% *            |
| Visibility: 15km *    | Visibility: 10km     | Visibility: 12km        |
| Golden: 16:32-17:08   | Golden: 16:30-17:05  | Golden: 16:35-17:12 *   |
| Wind: 12mph NW        | Wind: 18mph W        | Wind: 8mph N *          |
| [View] [Remove]       | [View] [Remove]      | [View] [Remove]         |
+-------------------------------------------------------------------------+
| Recommendation: Buttermere has the best conditions today with           |
| clear skies, low wind, and the longest golden hour window.             |
| [View Buttermere on Map]                                               |
+-------------------------------------------------------------------------+
```

**Files to Create**:
- `app/compare/page.tsx` - Server component with metadata, Suspense wrapper
- `app/compare/ComparePageContent.tsx` - Client component: reads URL ids, fetches weather in parallel (Promise.allSettled), computes scores/sun times, runs comparison logic, renders grid + recommendation
- `components/comparison/ComparisonGrid.tsx` - Responsive grid (mobile: vertical stack with snap scroll, desktop: grid-cols-2/3/4)
- `components/comparison/LocationComparisonCard.tsx` - Single location column showing all metrics, highlights category winners with gold star
- `components/comparison/ComparisonRecommendation.tsx` - Bottom card with recommendation text, overall winner, tradeoffs, "View on Map" button

**Key Implementation Details**:
- Parallel weather fetch: `Promise.allSettled(locations.map(loc => fetchWeatherForecast(lat, lng)))`
- Scoring pipeline: `getPhotographyConditions(date, lat, lng)` + `adaptWeatherForPhotography(weather)` → `calculatePhotographyScore(conditions, photoWeather)`
- Sun times: `getSunTimes(date, lat, lng)` for golden hour duration
- Date picker: shadcn Calendar + Popover; future dates use `fetchMultiDayForecast`
- Units: use `useSettingsStore` formatters (formatTemperature, formatSpeed, formatVisibility)

---

### Phase 14C: Mini Map Comparison

**Status**: ✅ Complete
**Goal**: Show small maps for each location in comparison view.

**Files to Create**:
- `components/comparison/MiniMap.tsx` - Small MapLibre preview (interactive: false, h-32/h-40, OSM tiles, single marker, React.memo, lazy init with IntersectionObserver)
- `components/comparison/SunPositionIndicator.tsx` - 48x48 SVG compass with sun dot at azimuth angle, overlaid on MiniMap

**Files to Modify**:
- `components/comparison/LocationComparisonCard.tsx` - Add MiniMap + SunPositionIndicator at top of card

---

### Phase 14D: Comparison Recommendations

**Status**: ✅ Complete
**Goal**: Deterministic recommendations based on comparison data.

**Build Note**: This is implemented BEFORE Phase 14B since the comparison page depends on this logic.

**Recommendation Logic**:
```typescript
interface ComparisonResult {
  overallWinner: { id: string; name: string; score: number } | null;
  categoryWinners: CategoryWinner[];
  recommendation: string;
  tradeoffs: string[];
}

interface CategoryWinner {
  category: ComparisonCategory;
  label: string;
  winnerId: string;
  winnerName: string;
  value: string;
  allValues: { locationId: string; name: string; value: string; numericValue: number }[];
}
```

**Category Winner Logic**:
- overall/weather/lighting/visibility: highest score wins
- wind: lowest speed wins (calmest)
- cloudCover: closest to 40% wins (dramatic skies)
- goldenHourDuration: longest total duration wins
- Overall winner: most category wins, tiebreak by overall score

**Recommendation Templates**:
- Clear winner (>= 60% categories): "{Name} is the clear best choice..."
- Close call (winner by 1): "{Name} has a slight edge..."
- All poor: "None have ideal conditions. {Best} is the best option..."

**Files to Create**:
- `lib/comparison/compare-locations.ts` - `compareLocations(locations): ComparisonResult`
- `lib/comparison/generate-recommendation.ts` - `generateRecommendation(locations, result): { recommendation, tradeoffs }`
- `lib/comparison/compare-locations.test.ts` - Tests for comparison logic
- `lib/comparison/generate-recommendation.test.ts` - Tests for recommendation generation

---

### Phase 14E: Quick Compare from Map

**Status**: 📋 Planned
**Goal**: Enable quick comparison without leaving the main map view.

**Files to Create**:
- `components/comparison/QuickComparePanel.tsx` - Floating overlay: compact bar with location names, color-coded score badges, overall winner, "View Full Comparison" link. Desktop: bottom-center float. Mobile: above bottom peek bar.

**Files to Modify**:
- `components/map/MapView.tsx` - Render QuickComparePanel when isCompareMode && selectedLocationIds.length >= 2

---

## Technical Considerations

**Performance**:
- Fetch weather for all locations in parallel via Promise.allSettled
- Reuse existing 30min weather cache from Open-Meteo client
- Lazy load mini maps with IntersectionObserver
- React.memo on MiniMap and comparison cards

**Integration Points**:
- Weather: `fetchWeatherForecast` / `fetchCurrentWeather` server actions
- Scoring: `calculatePhotographyScore`, `getPhotographyConditions`, `adaptWeatherForPhotography`
- Sun times: `getSunTimes` from `lib/utils/sun-calculations.ts`
- Coordinates: shared `parseCoordinates` from `lib/utils/parse-coordinates.ts`
- Settings: `useSettingsStore` formatters for units

**Responsive Design**:
- Stack cards vertically on mobile with horizontal snap scroll
- Full grid on desktop (grid-cols-2/3/4)
- Mobile-first Tailwind (sm -> md -> lg)

**Accessibility**:
- Screen reader friendly comparison
- Keyboard navigation between cards
- High contrast for "best" indicators

---

## Success Criteria
- [x] Users can select 2-4 locations for comparison (14A)
- [x] Comparison logic determines category winners and overall winner (14D)
- [x] Recommendation text generated with tradeoffs (14D)
- [x] Comparison page shows side-by-side data (14B)
- [x] Best values highlighted in each category (14B)
- [x] Date picker allows comparing different days (14B)
- [x] Mini maps with sun position shown per location (14C)
- [ ] Quick compare panel available from main map (14E)
- [x] Works on mobile with stacked/scrollable cards (14B)
- [x] All tests pass
- [x] Production build succeeds
