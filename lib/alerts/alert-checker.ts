import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import {
  getActiveAlertRules,
  createAlertHistory,
  updateAlertRule,
  getNotificationPreferences,
  getPushSubscriptionsByUser,
} from '@/lib/queries/alerts';
import { matchConditions, isInCooldown, type WeatherConditions } from './condition-matcher';
import type { AlertRuleWithLocation, AlertConditionsSnapshot } from '@/src/types/alerts.types';

// Create Supabase client with service role for server-side operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface AlertCheckResult {
  alertId: string;
  locationId: string;
  userId: string;
  triggered: boolean;
  reason?: string;
  notificationSent: boolean;
  error?: string;
}

/**
 * Main function to check all active alerts
 * This is designed to be called by a cron job
 */
export async function checkAllAlerts(): Promise<{
  checked: number;
  triggered: number;
  errors: number;
  results: AlertCheckResult[];
}> {
  const supabase = getServiceClient();
  const results: AlertCheckResult[] = [];
  let triggeredCount = 0;
  let errorCount = 0;

  try {
    // Get all active alert rules with location data
    const activeRules = await getActiveAlertRules(supabase);

    console.log(`[AlertChecker] Checking ${activeRules.length} active alerts`);

    // Group rules by location to minimize weather API calls
    const rulesByLocation = groupByLocation(activeRules);

    for (const [locationId, rules] of Object.entries(rulesByLocation)) {
      // Get coordinates from the first rule (they all have same location)
      const firstRule = rules[0];
      const coords = firstRule.location?.coordinates;

      if (!coords || typeof coords !== 'object') {
        console.warn(`[AlertChecker] No coordinates for location ${locationId}`);
        for (const rule of rules) {
          results.push({
            alertId: rule.id,
            locationId,
            userId: rule.user_id,
            triggered: false,
            error: 'No coordinates for location',
            notificationSent: false,
          });
          errorCount++;
        }
        continue;
      }

      try {
        // Fetch weather for this location
        const weather = await fetchWeatherForLocation(
          coords.lat,
          coords.lng
        );

        // Check each rule for this location
        for (const rule of rules) {
          const result = await checkSingleAlert(supabase, rule, weather, coords);
          results.push(result);

          if (result.triggered) {
            triggeredCount++;
          }
          if (result.error) {
            errorCount++;
          }
        }
      } catch (error) {
        console.error(
          `[AlertChecker] Error fetching weather for location ${locationId}:`,
          error
        );
        for (const rule of rules) {
          results.push({
            alertId: rule.id,
            locationId,
            userId: rule.user_id,
            triggered: false,
            error: error instanceof Error ? error.message : 'Weather fetch failed',
            notificationSent: false,
          });
          errorCount++;
        }
      }
    }
  } catch (error) {
    console.error('[AlertChecker] Fatal error:', error);
  }

  return {
    checked: results.length,
    triggered: triggeredCount,
    errors: errorCount,
    results,
  };
}

/**
 * Check a single alert rule
 */
async function checkSingleAlert(
  supabase: ReturnType<typeof getServiceClient>,
  rule: AlertRuleWithLocation,
  weather: WeatherConditions,
  coords: { lat: number; lng: number }
): Promise<AlertCheckResult> {
  try {
    // Get user's notification preferences
    const prefs = await getNotificationPreferences(supabase, rule.user_id);
    const cooldownHours = prefs?.cooldown_hours ?? 6;

    // Check if in cooldown
    if (isInCooldown(rule, cooldownHours)) {
      return {
        alertId: rule.id,
        locationId: rule.location_id,
        userId: rule.user_id,
        triggered: false,
        reason: 'In cooldown period',
        notificationSent: false,
      };
    }

    // Check conditions
    const matchResult = matchConditions(rule, weather, coords);

    if (!matchResult.matches) {
      return {
        alertId: rule.id,
        locationId: rule.location_id,
        userId: rule.user_id,
        triggered: false,
        reason: matchResult.reason,
        notificationSent: false,
      };
    }

    // Conditions matched - trigger alert!
    console.log(`[AlertChecker] Alert triggered: ${rule.name} (${rule.id})`);

    // Check rate limits
    if (prefs?.notifications_enabled === false) {
      return {
        alertId: rule.id,
        locationId: rule.location_id,
        userId: rule.user_id,
        triggered: true,
        reason: 'Notifications disabled by user',
        notificationSent: false,
      };
    }

    // Check quiet hours
    if (isInQuietHours(prefs?.quiet_hours_start, prefs?.quiet_hours_end)) {
      // Still record the alert but don't send notification
      await createAlertHistory(supabase, {
        alert_rule_id: rule.id,
        user_id: rule.user_id,
        conditions_snapshot: matchResult.snapshot,
        notification_sent: false,
        notification_channel: null,
      });

      await updateAlertRule(supabase, rule.id, {
        last_triggered_at: new Date().toISOString(),
      });

      return {
        alertId: rule.id,
        locationId: rule.location_id,
        userId: rule.user_id,
        triggered: true,
        reason: 'In quiet hours - notification queued',
        notificationSent: false,
      };
    }

    // Send notification
    let notificationSent = false;
    let notificationChannel: 'push' | 'in_app' | null = null;

    if (prefs?.push_enabled !== false) {
      // Try to send push notification
      const pushSent = await sendPushNotification(supabase, rule, matchResult.snapshot);
      if (pushSent) {
        notificationSent = true;
        notificationChannel = 'push';
      }
    }

    // Always record as in-app notification
    if (!notificationSent && prefs?.in_app_enabled !== false) {
      notificationChannel = 'in_app';
      notificationSent = true;
    }

    // Create history entry
    await createAlertHistory(supabase, {
      alert_rule_id: rule.id,
      user_id: rule.user_id,
      conditions_snapshot: matchResult.snapshot,
      notification_sent: notificationSent,
      notification_channel: notificationChannel,
    });

    // Update last triggered time
    await updateAlertRule(supabase, rule.id, {
      last_triggered_at: new Date().toISOString(),
    });

    return {
      alertId: rule.id,
      locationId: rule.location_id,
      userId: rule.user_id,
      triggered: true,
      reason: matchResult.reason,
      notificationSent,
    };
  } catch (error) {
    console.error(`[AlertChecker] Error checking alert ${rule.id}:`, error);
    return {
      alertId: rule.id,
      locationId: rule.location_id,
      userId: rule.user_id,
      triggered: false,
      error: error instanceof Error ? error.message : 'Check failed',
      notificationSent: false,
    };
  }
}

/**
 * Group alert rules by location ID
 */
function groupByLocation(
  rules: AlertRuleWithLocation[]
): Record<string, AlertRuleWithLocation[]> {
  const grouped: Record<string, AlertRuleWithLocation[]> = {};

  for (const rule of rules) {
    const locationId = rule.location_id;
    if (!grouped[locationId]) {
      grouped[locationId] = [];
    }
    grouped[locationId].push(rule);
  }

  return grouped;
}

/**
 * Fetch weather data for a location
 */
async function fetchWeatherForLocation(
  lat: number,
  lng: number
): Promise<WeatherConditions> {
  // Use Open-Meteo API (no key required)
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lng.toString());
  url.searchParams.set(
    'current',
    'temperature_2m,cloud_cover,wind_speed_10m,precipitation_probability,visibility,weather_code'
  );
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    next: { revalidate: 900 }, // Cache for 15 minutes
  });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const current = data.current;

  return {
    cloud_cover: current.cloud_cover ?? 0,
    wind_speed: current.wind_speed_10m ?? 0,
    visibility: (current.visibility ?? 10000) / 1000, // Convert to km
    precipitation_probability: current.precipitation_probability ?? 0,
    temperature: current.temperature_2m ?? 15,
    weather_description: getWeatherDescription(current.weather_code),
  };
}

/**
 * Convert WMO weather code to description
 */
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return descriptions[code] || 'Unknown';
}

/**
 * Check if current time is within quiet hours
 */
function isInQuietHours(
  startHour: number | null | undefined,
  endHour: number | null | undefined
): boolean {
  if (startHour === null || startHour === undefined) return false;
  if (endHour === null || endHour === undefined) return false;

  const currentHour = new Date().getHours();

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startHour > endHour) {
    return currentHour >= startHour || currentHour < endHour;
  }

  return currentHour >= startHour && currentHour < endHour;
}

/**
 * Send push notification to user
 */
async function sendPushNotification(
  supabase: ReturnType<typeof getServiceClient>,
  rule: AlertRuleWithLocation,
  snapshot: AlertConditionsSnapshot
): Promise<boolean> {
  try {
    // Get user's push subscriptions
    const subscriptions = await getPushSubscriptionsByUser(supabase, rule.user_id);

    if (subscriptions.length === 0) {
      console.log(`[AlertChecker] No push subscriptions for user ${rule.user_id}`);
      return false;
    }

    // Prepare notification payload
    const payload = {
      title: `${rule.name}`,
      body: buildNotificationBody(rule, snapshot),
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: `alert-${rule.id}`,
      data: {
        alertId: rule.id,
        locationId: rule.location_id,
        alertType: rule.alert_type,
      },
      requireInteraction: true,
    };

    // In a real implementation, you would use web-push library here
    // For now, we'll just log and return true to simulate success
    console.log(
      `[AlertChecker] Would send push notification to ${subscriptions.length} subscription(s):`,
      payload
    );

    // TODO: Implement actual web-push sending
    // const webpush = require('web-push');
    // webpush.setVapidDetails(...)
    // for (const sub of subscriptions) {
    //   await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    // }

    return true;
  } catch (error) {
    console.error('[AlertChecker] Push notification error:', error);
    return false;
  }
}

/**
 * Build notification body text
 */
function buildNotificationBody(
  rule: AlertRuleWithLocation,
  snapshot: AlertConditionsSnapshot
): string {
  const locationName = rule.location?.name || 'your location';

  switch (rule.alert_type) {
    case 'golden_hour':
      if (snapshot.sun_event) {
        const eventName = snapshot.sun_event.replace(/_/g, ' ');
        return `${eventName.charAt(0).toUpperCase() + eventName.slice(1)} approaching at ${locationName}`;
      }
      return `Golden hour conditions at ${locationName}`;

    case 'clear_skies':
      return `Clear skies (${snapshot.cloud_cover}% cloud cover) at ${locationName}`;

    case 'low_wind':
      return `Low wind (${snapshot.wind_speed} mph) at ${locationName}`;

    case 'custom':
      return `Conditions match at ${locationName}`;

    default:
      return `Alert triggered at ${locationName}`;
  }
}
