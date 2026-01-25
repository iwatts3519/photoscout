import { z } from 'zod';

// =============================================================================
// Visibility Enum
// =============================================================================

export const VISIBILITY_OPTIONS = ['private', 'public', 'unlisted'] as const;
export type Visibility = (typeof VISIBILITY_OPTIONS)[number];

export const visibilityLabels: Record<Visibility, string> = {
  private: 'Private',
  public: 'Public',
  unlisted: 'Unlisted',
};

export const visibilityDescriptions: Record<Visibility, string> = {
  private: 'Only you can see this location',
  public: 'Visible in discovery and searchable by everyone',
  unlisted: 'Only accessible via direct link',
};

// =============================================================================
// Report Reasons
// =============================================================================

export const REPORT_REASONS = [
  'inappropriate',
  'spam',
  'inaccurate',
  'duplicate',
  'other',
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const reportReasonLabels: Record<ReportReason, string> = {
  inappropriate: 'Inappropriate content',
  spam: 'Spam or advertising',
  inaccurate: 'Inaccurate location information',
  duplicate: 'Duplicate of another spot',
  other: 'Other issue',
};

// =============================================================================
// Report Status
// =============================================================================

export const REPORT_STATUSES = [
  'pending',
  'reviewed',
  'resolved',
  'dismissed',
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// =============================================================================
// Sort Options for Discovery
// =============================================================================

export const SORT_OPTIONS = ['recent', 'popular', 'trending'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const sortOptionLabels: Record<SortOption, string> = {
  recent: 'Most Recent',
  popular: 'Most Popular',
  trending: 'Trending',
};

// =============================================================================
// View Mode for Discovery
// =============================================================================

export const VIEW_MODES = ['grid', 'map'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

// =============================================================================
// Zod Schemas
// =============================================================================

export const visibilitySchema = z.enum(VISIBILITY_OPTIONS);

export const reportReasonSchema = z.enum(REPORT_REASONS);

export const sortOptionSchema = z.enum(SORT_OPTIONS);

export const createReportSchema = z.object({
  location_id: z.string().uuid(),
  reason: reportReasonSchema,
  details: z.string().max(1000).optional(),
});

export const discoverFiltersSchema = z.object({
  sortBy: sortOptionSchema.default('recent'),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// =============================================================================
// Types for Database Function Returns
// =============================================================================

export interface PublicLocation {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  radius_meters: number;
  visibility: Visibility;
  tags: string[] | null;
  best_time_to_visit: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  owner_name: string;
}

export interface LocationWithCoords extends PublicLocation {
  notes: string | null;
}

export interface FavoritedLocation extends PublicLocation {
  favorited_at: string;
}

export interface PopularTag {
  tag: string;
  count: number;
}

export interface ToggleFavoriteResult {
  is_favorited: boolean;
  new_count: number;
}

export interface LocationFavorite {
  id: string;
  user_id: string;
  location_id: string;
  created_at: string;
}

export interface LocationReport {
  id: string;
  location_id: string;
  reporter_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at: string | null;
}

// =============================================================================
// Type Guards
// =============================================================================

export function isVisibility(value: unknown): value is Visibility {
  return (
    typeof value === 'string' &&
    VISIBILITY_OPTIONS.includes(value as Visibility)
  );
}

export function isReportReason(value: unknown): value is ReportReason {
  return (
    typeof value === 'string' && REPORT_REASONS.includes(value as ReportReason)
  );
}

export function isSortOption(value: unknown): value is SortOption {
  return (
    typeof value === 'string' && SORT_OPTIONS.includes(value as SortOption)
  );
}
