# Phase 11: Community Photo Spots

**Status**: 📋 Planned
**Completion**: 0%

## Goal
Enable users to share their photography locations with the community, discover spots shared by others, and build a collaborative database of UK photography locations.

## Overview

**Core Concept**: Users can mark their saved locations as "public" to share with the community. A discovery page shows popular and nearby community spots with photos, ratings, and tips.

**Privacy Model**:
- Private (default): Only visible to owner
- Public: Visible to all users, appears in community discovery
- Unlisted: Accessible via direct link but not in discovery

---

## Sub-Phases

### Phase 11A: Public Locations Schema

**Goal**: Extend locations table for community features.

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

### Phase 11B: Community Discovery Page

**Goal**: Build a page for exploring public photography locations.

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
└─────────────────────────────────────────────────────────────┘
```

**Files to Create**:
- `app/discover/page.tsx`
- `components/community/DiscoveryGrid.tsx`
- `components/community/DiscoveryMap.tsx`
- `components/community/LocationPreviewCard.tsx`
- `components/community/DiscoveryFilters.tsx`

---

### Phase 11C: Location Detail Page

**Goal**: Public-facing page for viewing shared locations.

**Files to Create**:
- `app/spot/[id]/page.tsx`
- `components/community/SpotDetail.tsx`
- `components/community/SpotWeather.tsx`
- `components/community/SimilarSpots.tsx`
- `components/community/FavoriteButton.tsx`

---

### Phase 11D: Sharing & Visibility Controls

**Goal**: Allow users to control location visibility and share.

**Files to Modify**:
- `components/locations/SaveLocationForm.tsx` - Add visibility
- `components/locations/EditLocationForm.tsx` - Add visibility
- `components/locations/ShareLocationDialog.tsx` - Enhance for community
- `components/locations/LocationCard.tsx` - Show public indicator

---

### Phase 11E: Favorites & User Profiles

**Goal**: Allow users to favorite locations and view their profile.

**Files to Create**:
- `src/stores/favoritesStore.ts`
- `src/hooks/useFavorites.ts`
- `components/community/FavoritesList.tsx`
- `app/profile/[userId]/page.tsx`
- `components/community/UserProfile.tsx`

---

## Technical Considerations

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

---

## Success Criteria
- [ ] Users can set locations as public/private/unlisted
- [ ] Discovery page shows community locations with filters
- [ ] Public location detail pages work and are shareable
- [ ] Users can favorite locations
- [ ] View and favorite counts tracked
- [ ] All tests pass
- [ ] Production build succeeds
