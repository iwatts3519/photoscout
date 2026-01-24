import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/src/types/database';
import type {
  AlertRule,
  AlertRuleWithLocation,
  AlertHistory,
  AlertHistoryWithRule,
  PushSubscription,
  NotificationPreferences,
  AlertConditions,
  TimeWindow,
  PushSubscriptionData,
  AlertConditionsSnapshot,
  NotificationChannel,
} from '@/src/types/alerts.types';

// ============================================================================
// Alert Rules Queries
// ============================================================================

/**
 * Get all alert rules for a user
 */
export async function getAlertRulesByUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as AlertRule[];
}

/**
 * Get alert rules for a user with location details
 */
export async function getAlertRulesWithLocations(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<AlertRuleWithLocation[]> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select(`
      *,
      locations (
        id,
        name,
        coordinates
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform to include location info
  return (data || []).map((rule) => ({
    ...rule,
    location: rule.locations,
  })) as unknown as AlertRuleWithLocation[];
}

/**
 * Get a single alert rule by ID
 */
export async function getAlertRuleById(
  supabase: SupabaseClient<Database>,
  ruleId: string
): Promise<AlertRule | null> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('id', ruleId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as unknown as AlertRule;
}

/**
 * Get alert rules for a specific location
 */
export async function getAlertRulesByLocation(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('location_id', locationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as unknown as AlertRule[];
}

/**
 * Get all active alert rules (for cron job)
 */
export async function getActiveAlertRules(
  supabase: SupabaseClient<Database>
): Promise<AlertRuleWithLocation[]> {
  const { data, error } = await supabase
    .from('alert_rules')
    .select(`
      *,
      locations (
        id,
        name,
        coordinates
      )
    `)
    .eq('is_active', true);

  if (error) throw error;

  return (data || []).map((rule) => ({
    ...rule,
    location: rule.locations,
  })) as unknown as AlertRuleWithLocation[];
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(
  supabase: SupabaseClient<Database>,
  rule: {
    user_id: string;
    location_id: string;
    name: string;
    alert_type: string;
    conditions?: AlertConditions;
    time_window?: TimeWindow | null;
    days_of_week?: number[] | null;
    lead_time_minutes?: number;
    is_active?: boolean;
  }
): Promise<AlertRule> {
  const { data, error } = await supabase
    .from('alert_rules')
    .insert([{
      user_id: rule.user_id,
      location_id: rule.location_id,
      name: rule.name,
      alert_type: rule.alert_type,
      conditions: rule.conditions || {},
      time_window: rule.time_window || null,
      days_of_week: rule.days_of_week || null,
      lead_time_minutes: rule.lead_time_minutes ?? 30,
      is_active: rule.is_active ?? true,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as unknown as AlertRule;
}

/**
 * Update an alert rule
 */
export async function updateAlertRule(
  supabase: SupabaseClient<Database>,
  ruleId: string,
  updates: Partial<{
    name: string;
    alert_type: string;
    conditions: AlertConditions;
    time_window: TimeWindow | null;
    days_of_week: number[] | null;
    lead_time_minutes: number;
    is_active: boolean;
    last_triggered_at: string;
  }>
): Promise<AlertRule> {
  const { data, error } = await supabase
    .from('alert_rules')
    .update(updates)
    .eq('id', ruleId)
    .select()
    .single();

  if (error) throw error;
  return data as unknown as AlertRule;
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(
  supabase: SupabaseClient<Database>,
  ruleId: string
): Promise<void> {
  const { error } = await supabase
    .from('alert_rules')
    .delete()
    .eq('id', ruleId);

  if (error) throw error;
}

/**
 * Toggle alert rule active status
 */
export async function toggleAlertRuleActive(
  supabase: SupabaseClient<Database>,
  ruleId: string,
  isActive: boolean
): Promise<AlertRule> {
  return updateAlertRule(supabase, ruleId, { is_active: isActive });
}

// ============================================================================
// Alert History Queries
// ============================================================================

/**
 * Get alert history for a user
 */
export async function getAlertHistoryByUser(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 50
): Promise<AlertHistory[]> {
  const { data, error } = await supabase
    .from('alert_history')
    .select('*')
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as unknown as AlertHistory[];
}

/**
 * Get alert history with rule details
 */
export async function getAlertHistoryWithRules(
  supabase: SupabaseClient<Database>,
  userId: string,
  limit = 50
): Promise<AlertHistoryWithRule[]> {
  const { data, error } = await supabase
    .from('alert_history')
    .select(`
      *,
      alert_rules (*)
    `)
    .eq('user_id', userId)
    .order('triggered_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((history) => ({
    ...history,
    alert_rule: history.alert_rules,
  })) as unknown as AlertHistoryWithRule[];
}

/**
 * Get unread alert count for a user
 */
export async function getUnreadAlertCount(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('alert_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

/**
 * Create alert history entry
 */
export async function createAlertHistory(
  supabase: SupabaseClient<Database>,
  history: {
    alert_rule_id: string;
    user_id: string;
    conditions_snapshot: AlertConditionsSnapshot;
    notification_sent?: boolean;
    notification_channel?: NotificationChannel | null;
  }
): Promise<AlertHistory> {
  const { data, error } = await supabase
    .from('alert_history')
    .insert({
      alert_rule_id: history.alert_rule_id,
      user_id: history.user_id,
      conditions_snapshot: history.conditions_snapshot as unknown as Json,
      notification_sent: history.notification_sent ?? false,
      notification_channel: history.notification_channel || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as AlertHistory;
}

/**
 * Mark alert history as read
 */
export async function markAlertAsRead(
  supabase: SupabaseClient<Database>,
  historyId: string
): Promise<void> {
  const { error } = await supabase
    .from('alert_history')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', historyId);

  if (error) throw error;
}

/**
 * Mark all alerts as read for a user
 */
export async function markAllAlertsAsRead(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('alert_history')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}

// ============================================================================
// Push Subscription Queries
// ============================================================================

/**
 * Get push subscriptions for a user
 */
export async function getPushSubscriptionsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<PushSubscription[]> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;
  return (data || []) as unknown as PushSubscription[];
}

/**
 * Create or update push subscription
 */
export async function upsertPushSubscription(
  supabase: SupabaseClient<Database>,
  subscription: {
    user_id: string;
    subscription: PushSubscriptionData;
    user_agent?: string;
    device_name?: string;
  }
): Promise<PushSubscription> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: subscription.user_id,
        subscription: subscription.subscription,
        user_agent: subscription.user_agent || null,
        device_name: subscription.device_name || null,
        is_active: true,
      },
      {
        onConflict: 'user_id,(subscription->>\'endpoint\')',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data as unknown as PushSubscription;
}

/**
 * Delete push subscription
 */
export async function deletePushSubscription(
  supabase: SupabaseClient<Database>,
  subscriptionId: string
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('id', subscriptionId);

  if (error) throw error;
}

/**
 * Deactivate push subscription (soft delete)
 */
export async function deactivatePushSubscription(
  supabase: SupabaseClient<Database>,
  endpoint: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('user_id', userId)
    .filter('subscription->>endpoint', 'eq', endpoint);

  if (error) throw error;
}

// ============================================================================
// Notification Preferences Queries
// ============================================================================

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<NotificationPreferences | null> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as unknown as NotificationPreferences;
}

/**
 * Create or update notification preferences
 */
export async function upsertNotificationPreferences(
  supabase: SupabaseClient<Database>,
  preferences: {
    user_id: string;
    notifications_enabled?: boolean;
    push_enabled?: boolean;
    in_app_enabled?: boolean;
    quiet_hours_start?: number | null;
    quiet_hours_end?: number | null;
    max_notifications_per_day?: number;
    cooldown_hours?: number;
  }
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: preferences.user_id,
        notifications_enabled: preferences.notifications_enabled ?? true,
        push_enabled: preferences.push_enabled ?? true,
        in_app_enabled: preferences.in_app_enabled ?? true,
        quiet_hours_start: preferences.quiet_hours_start ?? null,
        quiet_hours_end: preferences.quiet_hours_end ?? null,
        max_notifications_per_day: preferences.max_notifications_per_day ?? 10,
        cooldown_hours: preferences.cooldown_hours ?? 6,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data as unknown as NotificationPreferences;
}
