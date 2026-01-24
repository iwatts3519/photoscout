# Phase 12: Photo Upload & Tagging

**Status**: 📋 Planned
**Completion**: 0%

## Goal
Allow users to upload their own photos to locations, automatically extract GPS coordinates from EXIF data, and build a personal photo library linked to photography spots.

## Overview

**Core Concept**: Users upload photos which are stored in Supabase Storage. EXIF data is extracted to auto-suggest location coordinates. Photos can be linked to saved locations or create new locations.

**Storage**: Supabase Storage (included in free tier, 1GB limit)

---

## Sub-Phases

### Phase 12A: Supabase Storage Setup

**Goal**: Configure storage buckets and policies for photo uploads.

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

### Phase 12B: Photo Upload Component

**Goal**: Build drag-and-drop photo upload with progress.

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

### Phase 12C: EXIF Data Extraction

**Goal**: Extract and display photo metadata including GPS coordinates.

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

### Phase 12D: Photo Library & Management

**Goal**: Build photo gallery for managing uploaded photos.

**Files to Create**:
- `app/photos/page.tsx`
- `components/photos/PhotoLibrary.tsx`
- `components/photos/PhotoGrid.tsx`
- `components/photos/PhotoDetailDialog.tsx`
- `components/photos/PhotoEditForm.tsx`
- `src/stores/photoLibraryStore.ts`

---

### Phase 12E: Location-Photo Linking

**Goal**: Connect photos to saved locations.

**Files to Create**:
- `components/photos/LinkToLocationDialog.tsx`
- `components/photos/LocationPhotoGallery.tsx`
- `components/locations/LocationPhotos.tsx`

**Files to Modify**:
- `components/locations/LocationCard.tsx` - Show photo thumbnails
- `components/map/SavedLocationMarkers.tsx` - Show photo count badge

---

## Technical Considerations

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

---

## Success Criteria
- [ ] Users can upload photos via drag-and-drop
- [ ] EXIF data extracted and displayed (camera settings, GPS)
- [ ] Photos can be linked to saved locations
- [ ] Photo library page with filtering and management
- [ ] GPS coordinates auto-suggest location matches
- [ ] All tests pass
- [ ] Production build succeeds
