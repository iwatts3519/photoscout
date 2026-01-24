# Phase 14: Location Comparison

**Status**: 📋 Planned
**Completion**: 0%

## Goal
Allow photographers to compare multiple locations side-by-side to choose the best spot for their shoot based on weather, lighting, and conditions.

## Overview

**Core Concept**: Users select 2-4 locations and see them in a comparison view with weather, sun times, photography scores, and conditions displayed side-by-side.

---

## Sub-Phases

### Phase 14A: Comparison Selection UI

**Goal**: Allow users to select locations for comparison.

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

### Phase 14B: Comparison View Page

**Goal**: Create dedicated comparison view with side-by-side display.

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

### Phase 14C: Mini Map Comparison

**Goal**: Show small maps for each location in comparison view.

**Files to Create**:
- `components/comparison/MiniMap.tsx`
- `components/comparison/SunPositionIndicator.tsx`

---

### Phase 14D: Comparison Recommendations

**Goal**: AI-style recommendations based on comparison data.

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

### Phase 14E: Quick Compare from Map

**Goal**: Enable quick comparison without leaving the main map view.

**Files to Create**:
- `components/comparison/QuickComparePanel.tsx`
- `components/comparison/SplitMapView.tsx`

---

## Technical Considerations

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

---

## Success Criteria
- [ ] Users can select 2-4 locations for comparison
- [ ] Comparison page shows side-by-side data
- [ ] Best values highlighted in each category
- [ ] Recommendation generated based on conditions
- [ ] Works on mobile with swipeable cards
- [ ] Date picker allows comparing different days
- [ ] All tests pass
- [ ] Production build succeeds
