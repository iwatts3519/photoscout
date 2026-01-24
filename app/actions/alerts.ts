'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getAlertRulesByUser,
  getAlertRulesWithLocations,
  getAlertRuleById,
  getAlertRulesByLocation,
  createAlertRule as createAlertRuleQuery,
  updateAlertRule as updateAlertRuleQuery,
  deleteAlertRule as deleteAlertRuleQuery,
  toggleAlertRuleActive,
  getAlertHistoryByUser,
  getAlertHistoryWithRules,
  getUnreadAlertCount,
  markAlertAsRead as markAlertAsReadQuery,
  markAllAlertsAsRead as markAllAlertsAsReadQuery,
  getNotificationPreferences,
  upsertNotificationPreferences,
  upsertPushSubscription,
  deletePushSubscription as deletePushSubscriptionQuery,
  getPushSubscriptionsByUser,
} from '@/lib/queries/alerts';
import {
  createAlertRuleSchema,
  updateAlertRuleSchema,
  notificationPreferencesSchema,
  pushSubscriptionSchema,
} from '@/src/types/alerts.types';
import type {
  AlertRule,
  AlertRuleWithLocation,
  AlertHistory,
  AlertHistoryWithRule,
  NotificationPreferences,
  PushSubscription,
  CreateAlertRuleInput,
  UpdateAlertRuleInput,
  NotificationPreferencesInput,
  PushSubscriptionData,
} from '@/src/types/alerts.types';

// ============================================================================
// Alert Rules Actions
// ============================================================================

/**
 * Fetch all alert rules for the current user
 */
export async function fetchAlertRules(): Promise<{
  data: AlertRule[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert rules' };
    }

    const rules = await getAlertRulesByUser(supabase, user.id);
    return { data: rules, error: null };
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert rules',
    };
  }
}

/**
 * Fetch all alert rules with location details
 */
export async function fetchAlertRulesWithLocations(): Promise<{
  data: AlertRuleWithLocation[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert rules' };
    }

    const rules = await getAlertRulesWithLocations(supabase, user.id);
    return { data: rules, error: null };
  } catch (error) {
    console.error('Error fetching alert rules with locations:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert rules',
    };
  }
}

/**
 * Fetch a single alert rule by ID
 */
export async function fetchAlertRuleById(ruleId: string): Promise<{
  data: AlertRule | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert rules' };
    }

    const rule = await getAlertRuleById(supabase, ruleId);

    // Verify ownership
    if (rule && rule.user_id !== user.id) {
      return { data: null, error: 'Alert rule not found' };
    }

    return { data: rule, error: null };
  } catch (error) {
    console.error('Error fetching alert rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert rule',
    };
  }
}

/**
 * Fetch alert rules for a specific location
 */
export async function fetchAlertRulesForLocation(locationId: string): Promise<{
  data: AlertRule[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert rules' };
    }

    const rules = await getAlertRulesByLocation(supabase, locationId);
    return { data: rules, error: null };
  } catch (error) {
    console.error('Error fetching alert rules for location:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert rules',
    };
  }
}

/**
 * Create a new alert rule
 */
export async function createAlertRule(input: CreateAlertRuleInput): Promise<{
  data: AlertRule | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = createAlertRuleSchema.safeParse(input);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to create alert rules' };
    }

    const rule = await createAlertRuleQuery(supabase, {
      user_id: user.id,
      location_id: result.data.location_id,
      name: result.data.name,
      alert_type: result.data.alert_type,
      conditions: result.data.conditions,
      time_window: result.data.time_window ?? null,
      days_of_week: result.data.days_of_week ?? null,
      lead_time_minutes: result.data.lead_time_minutes,
      is_active: result.data.is_active,
    });

    return { data: rule, error: null };
  } catch (error) {
    console.error('Error creating alert rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create alert rule',
    };
  }
}

/**
 * Update an existing alert rule
 */
export async function updateAlertRule(
  ruleId: string,
  updates: UpdateAlertRuleInput
): Promise<{
  data: AlertRule | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = updateAlertRuleSchema.safeParse(updates);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update alert rules' };
    }

    // Verify ownership
    const existingRule = await getAlertRuleById(supabase, ruleId);
    if (!existingRule || existingRule.user_id !== user.id) {
      return { data: null, error: 'Alert rule not found' };
    }

    const rule = await updateAlertRuleQuery(supabase, ruleId, result.data);
    return { data: rule, error: null };
  } catch (error) {
    console.error('Error updating alert rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update alert rule',
    };
  }
}

/**
 * Delete an alert rule
 */
export async function deleteAlertRule(ruleId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to delete alert rules' };
    }

    // Verify ownership
    const existingRule = await getAlertRuleById(supabase, ruleId);
    if (!existingRule || existingRule.user_id !== user.id) {
      return { data: null, error: 'Alert rule not found' };
    }

    await deleteAlertRuleQuery(supabase, ruleId);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete alert rule',
    };
  }
}

/**
 * Toggle an alert rule's active status
 */
export async function toggleAlertRule(
  ruleId: string,
  isActive: boolean
): Promise<{
  data: AlertRule | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update alert rules' };
    }

    // Verify ownership
    const existingRule = await getAlertRuleById(supabase, ruleId);
    if (!existingRule || existingRule.user_id !== user.id) {
      return { data: null, error: 'Alert rule not found' };
    }

    const rule = await toggleAlertRuleActive(supabase, ruleId, isActive);
    return { data: rule, error: null };
  } catch (error) {
    console.error('Error toggling alert rule:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to toggle alert rule',
    };
  }
}

// ============================================================================
// Alert History Actions
// ============================================================================

/**
 * Fetch alert history for the current user
 */
export async function fetchAlertHistory(limit = 50): Promise<{
  data: AlertHistory[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert history' };
    }

    const history = await getAlertHistoryByUser(supabase, user.id, limit);
    return { data: history, error: null };
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert history',
    };
  }
}

/**
 * Fetch alert history with rule details
 */
export async function fetchAlertHistoryWithRules(limit = 50): Promise<{
  data: AlertHistoryWithRule[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alert history' };
    }

    const history = await getAlertHistoryWithRules(supabase, user.id, limit);
    return { data: history, error: null };
  } catch (error) {
    console.error('Error fetching alert history:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch alert history',
    };
  }
}

/**
 * Get unread alert count
 */
export async function fetchUnreadAlertCount(): Promise<{
  data: number | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view alerts' };
    }

    const count = await getUnreadAlertCount(supabase, user.id);
    return { data: count, error: null };
  } catch (error) {
    console.error('Error fetching unread alert count:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch unread count',
    };
  }
}

/**
 * Mark an alert as read
 */
export async function markAlertAsRead(historyId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update alerts' };
    }

    await markAlertAsReadQuery(supabase, historyId);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark alert as read',
    };
  }
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsAsRead(): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update alerts' };
    }

    await markAllAlertsAsReadQuery(supabase, user.id);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to mark alerts as read',
    };
  }
}

// ============================================================================
// Notification Preferences Actions
// ============================================================================

/**
 * Fetch notification preferences
 */
export async function fetchNotificationPreferences(): Promise<{
  data: NotificationPreferences | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view preferences' };
    }

    const prefs = await getNotificationPreferences(supabase, user.id);
    return { data: prefs, error: null };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch preferences',
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  input: NotificationPreferencesInput
): Promise<{
  data: NotificationPreferences | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = notificationPreferencesSchema.safeParse(input);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update preferences' };
    }

    const prefs = await upsertNotificationPreferences(supabase, {
      user_id: user.id,
      ...result.data,
    });

    return { data: prefs, error: null };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    };
  }
}

// ============================================================================
// Push Subscription Actions
// ============================================================================

/**
 * Register a push subscription
 */
export async function registerPushSubscription(
  subscription: PushSubscriptionData,
  deviceName?: string
): Promise<{
  data: PushSubscription | null;
  error: string | null;
}> {
  try {
    // Validate subscription
    const result = pushSubscriptionSchema.safeParse(subscription);
    if (!result.success) {
      return { data: null, error: 'Invalid push subscription format' };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to register for push notifications' };
    }

    const sub = await upsertPushSubscription(supabase, {
      user_id: user.id,
      subscription: result.data,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      device_name: deviceName,
    });

    return { data: sub, error: null };
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to register push subscription',
    };
  }
}

/**
 * Unregister a push subscription
 */
export async function unregisterPushSubscription(subscriptionId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to manage push subscriptions' };
    }

    await deletePushSubscriptionQuery(supabase, subscriptionId);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error unregistering push subscription:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to unregister push subscription',
    };
  }
}

/**
 * Fetch push subscriptions for current user
 */
export async function fetchPushSubscriptions(): Promise<{
  data: PushSubscription[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view push subscriptions' };
    }

    const subs = await getPushSubscriptionsByUser(supabase, user.id);
    return { data: subs, error: null };
  } catch (error) {
    console.error('Error fetching push subscriptions:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch push subscriptions',
    };
  }
}
