import { z } from 'zod';

// Alert types available in the system
export const ALERT_TYPES = ['golden_hour', 'clear_skies', 'low_wind', 'custom'] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

// Days of week (0 = Sunday, 6 = Saturday)
export const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Notification channels
export const NOTIFICATION_CHANNELS = ['push', 'in_app'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

// Weather conditions schema for custom alerts
export const alertConditionsSchema = z.object({
  // Cloud cover threshold (0-100%)
  max_cloud_cover: z.number().min(0).max(100).optional(),
  // Minimum visibility in km
  min_visibility: z.number().min(0).max(50).optional(),
  // Maximum wind speed in mph
  max_wind_speed: z.number().min(0).max(100).optional(),
  // Precipitation probability threshold (0-100%)
  max_precipitation_probability: z.number().min(0).max(100).optional(),
  // Temperature range in Celsius
  min_temperature: z.number().min(-50).max(60).optional(),
  max_temperature: z.number().min(-50).max(60).optional(),
});

export type AlertConditions = z.infer<typeof alertConditionsSchema>;

// Time window schema
export const timeWindowSchema = z.object({
  start_hour: z.number().min(0).max(23),
  end_hour: z.number().min(0).max(23),
});

export type TimeWindow = z.infer<typeof timeWindowSchema>;

// Alert rule creation schema
export const createAlertRuleSchema = z.object({
  location_id: z.string().uuid('Invalid location ID'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  alert_type: z.enum(ALERT_TYPES),
  conditions: alertConditionsSchema.optional().default({}),
  time_window: timeWindowSchema.nullable().optional(),
  days_of_week: z.array(z.number().min(0).max(6)).nullable().optional(),
  lead_time_minutes: z.number().min(0).max(120).optional().default(30),
  is_active: z.boolean().optional().default(true),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;

// Alert rule update schema
export const updateAlertRuleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  alert_type: z.enum(ALERT_TYPES).optional(),
  conditions: alertConditionsSchema.optional(),
  time_window: timeWindowSchema.nullable().optional(),
  days_of_week: z.array(z.number().min(0).max(6)).nullable().optional(),
  lead_time_minutes: z.number().min(0).max(120).optional(),
  is_active: z.boolean().optional(),
});

export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  notifications_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  quiet_hours_start: z.number().min(0).max(23).nullable().optional(),
  quiet_hours_end: z.number().min(0).max(23).nullable().optional(),
  max_notifications_per_day: z.number().min(1).max(50).optional(),
  cooldown_hours: z.number().min(1).max(48).optional(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

// Push subscription schema (Web Push API format)
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  expirationTime: z.number().nullable().optional(),
});

export type PushSubscriptionData = z.infer<typeof pushSubscriptionSchema>;

// ============================================================================
// Database Types (matching Supabase generated types)
// ============================================================================

export interface AlertRule {
  id: string;
  user_id: string;
  location_id: string;
  name: string;
  alert_type: AlertType;
  conditions: AlertConditions;
  time_window: TimeWindow | null;
  days_of_week: number[] | null;
  lead_time_minutes: number;
  is_active: boolean;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRuleWithLocation extends AlertRule {
  location: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
  };
}

export interface AlertHistory {
  id: string;
  alert_rule_id: string;
  user_id: string;
  triggered_at: string;
  conditions_snapshot: AlertConditionsSnapshot;
  notification_sent: boolean;
  notification_channel: NotificationChannel | null;
  is_read: boolean;
  read_at: string | null;
}

export interface AlertHistoryWithRule extends AlertHistory {
  alert_rule: AlertRule;
}

export interface AlertConditionsSnapshot {
  cloud_cover?: number;
  visibility?: number;
  wind_speed?: number;
  precipitation_probability?: number;
  temperature?: number;
  weather_description?: string;
  sun_event?: string; // e.g., 'sunrise', 'sunset', 'golden_hour_start'
  sun_event_time?: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  subscription: PushSubscriptionData;
  user_agent: string | null;
  device_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notifications_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  max_notifications_per_day: number;
  cooldown_hours: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// UI Helper Types
// ============================================================================

// Alert type display information
export interface AlertTypeInfo {
  value: AlertType;
  label: string;
  description: string;
  icon: string;
  defaultConditions: Partial<AlertConditions>;
}

export const ALERT_TYPE_INFO: Record<AlertType, AlertTypeInfo> = {
  golden_hour: {
    value: 'golden_hour',
    label: 'Golden Hour Reminder',
    description: 'Get notified before sunrise or sunset golden hour',
    icon: 'Sun',
    defaultConditions: {},
  },
  clear_skies: {
    value: 'clear_skies',
    label: 'Clear Skies',
    description: 'Notify when cloud cover is below threshold',
    icon: 'Cloud',
    defaultConditions: { max_cloud_cover: 30 },
  },
  low_wind: {
    value: 'low_wind',
    label: 'Low Wind',
    description: 'Notify when wind speed is below threshold',
    icon: 'Wind',
    defaultConditions: { max_wind_speed: 10 },
  },
  custom: {
    value: 'custom',
    label: 'Custom Conditions',
    description: 'Set your own weather condition thresholds',
    icon: 'Settings',
    defaultConditions: {},
  },
};

// Day of week display
export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};
