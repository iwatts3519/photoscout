import SunCalc from 'suncalc';
import type {
  AlertRule,
  AlertConditions,
  AlertConditionsSnapshot,
  TimeWindow,
} from '@/src/types/alerts.types';

export interface WeatherConditions {
  cloud_cover: number; // percentage (0-100)
  wind_speed: number; // mph
  visibility: number; // km
  precipitation_probability: number; // percentage (0-100)
  temperature: number; // Celsius
  weather_description?: string;
}

export interface MatchResult {
  matches: boolean;
  reason?: string;
  snapshot: AlertConditionsSnapshot;
}

/**
 * Check if current weather conditions match alert rule conditions
 */
export function matchConditions(
  rule: AlertRule,
  weather: WeatherConditions,
  coordinates: { lat: number; lng: number }
): MatchResult {
  const alertType = rule.alert_type;
  const conditions = rule.conditions as AlertConditions;
  const now = new Date();

  // Build snapshot of current conditions
  const snapshot: AlertConditionsSnapshot = {
    cloud_cover: weather.cloud_cover,
    visibility: weather.visibility,
    wind_speed: weather.wind_speed,
    precipitation_probability: weather.precipitation_probability,
    temperature: weather.temperature,
    weather_description: weather.weather_description,
  };

  // Check time window first
  if (rule.time_window) {
    if (!isWithinTimeWindow(now, rule.time_window)) {
      return {
        matches: false,
        reason: 'Outside time window',
        snapshot,
      };
    }
  }

  // Check days of week
  if (rule.days_of_week && rule.days_of_week.length > 0) {
    const currentDay = now.getDay();
    if (!rule.days_of_week.includes(currentDay)) {
      return {
        matches: false,
        reason: 'Not scheduled for today',
        snapshot,
      };
    }
  }

  // Handle different alert types
  switch (alertType) {
    case 'golden_hour':
      return matchGoldenHour(rule, weather, coordinates, now, snapshot);

    case 'clear_skies':
      return matchClearSkies(conditions, weather, snapshot);

    case 'low_wind':
      return matchLowWind(conditions, weather, snapshot);

    case 'custom':
      return matchCustomConditions(conditions, weather, snapshot);

    default:
      return {
        matches: false,
        reason: 'Unknown alert type',
        snapshot,
      };
  }
}

/**
 * Check if current time is within the time window
 */
function isWithinTimeWindow(date: Date, timeWindow: TimeWindow): boolean {
  const currentHour = date.getHours();
  const { start_hour, end_hour } = timeWindow;

  // Handle overnight windows (e.g., 22:00 - 06:00)
  if (start_hour > end_hour) {
    return currentHour >= start_hour || currentHour < end_hour;
  }

  return currentHour >= start_hour && currentHour < end_hour;
}

/**
 * Match golden hour alert - notify before sunrise/sunset golden hour
 */
function matchGoldenHour(
  rule: AlertRule,
  weather: WeatherConditions,
  coordinates: { lat: number; lng: number },
  now: Date,
  snapshot: AlertConditionsSnapshot
): MatchResult {
  const leadTimeMs = (rule.lead_time_minutes || 30) * 60 * 1000;
  const times = SunCalc.getTimes(now, coordinates.lat, coordinates.lng);

  // Check if we're within lead time of golden hour
  const sunriseGoldenHour = times.goldenHourEnd; // End of morning golden hour
  const sunsetGoldenHour = times.goldenHour; // Start of evening golden hour

  const timesToCheck = [
    { time: times.sunrise, event: 'sunrise' },
    { time: sunriseGoldenHour, event: 'golden_hour_end' },
    { time: sunsetGoldenHour, event: 'golden_hour_start' },
    { time: times.sunset, event: 'sunset' },
  ];

  for (const { time, event } of timesToCheck) {
    if (!isNaN(time.getTime())) {
      const timeUntil = time.getTime() - now.getTime();

      // Check if we're within lead time (e.g., 30 minutes before)
      if (timeUntil > 0 && timeUntil <= leadTimeMs) {
        // Also check weather conditions are acceptable
        if (weather.cloud_cover <= 70 && weather.precipitation_probability <= 30) {
          return {
            matches: true,
            reason: `${event} in ${Math.round(timeUntil / 60000)} minutes`,
            snapshot: {
              ...snapshot,
              sun_event: event,
              sun_event_time: time.toISOString(),
            },
          };
        } else {
          return {
            matches: false,
            reason: 'Weather conditions not suitable for golden hour',
            snapshot: {
              ...snapshot,
              sun_event: event,
              sun_event_time: time.toISOString(),
            },
          };
        }
      }
    }
  }

  return {
    matches: false,
    reason: 'Not near golden hour',
    snapshot,
  };
}

/**
 * Match clear skies alert
 */
function matchClearSkies(
  conditions: AlertConditions,
  weather: WeatherConditions,
  snapshot: AlertConditionsSnapshot
): MatchResult {
  const maxCloudCover = conditions.max_cloud_cover ?? 30;

  if (weather.cloud_cover <= maxCloudCover) {
    return {
      matches: true,
      reason: `Cloud cover ${weather.cloud_cover}% (threshold: ${maxCloudCover}%)`,
      snapshot,
    };
  }

  return {
    matches: false,
    reason: `Cloud cover ${weather.cloud_cover}% exceeds ${maxCloudCover}%`,
    snapshot,
  };
}

/**
 * Match low wind alert
 */
function matchLowWind(
  conditions: AlertConditions,
  weather: WeatherConditions,
  snapshot: AlertConditionsSnapshot
): MatchResult {
  const maxWindSpeed = conditions.max_wind_speed ?? 10;

  if (weather.wind_speed <= maxWindSpeed) {
    return {
      matches: true,
      reason: `Wind ${weather.wind_speed} mph (threshold: ${maxWindSpeed} mph)`,
      snapshot,
    };
  }

  return {
    matches: false,
    reason: `Wind ${weather.wind_speed} mph exceeds ${maxWindSpeed} mph`,
    snapshot,
  };
}

/**
 * Match custom conditions alert
 */
function matchCustomConditions(
  conditions: AlertConditions,
  weather: WeatherConditions,
  snapshot: AlertConditionsSnapshot
): MatchResult {
  const failedConditions: string[] = [];

  // Check cloud cover
  if (conditions.max_cloud_cover !== undefined) {
    if (weather.cloud_cover > conditions.max_cloud_cover) {
      failedConditions.push(
        `Cloud cover ${weather.cloud_cover}% > ${conditions.max_cloud_cover}%`
      );
    }
  }

  // Check wind speed
  if (conditions.max_wind_speed !== undefined) {
    if (weather.wind_speed > conditions.max_wind_speed) {
      failedConditions.push(
        `Wind ${weather.wind_speed} mph > ${conditions.max_wind_speed} mph`
      );
    }
  }

  // Check precipitation
  if (conditions.max_precipitation_probability !== undefined) {
    if (weather.precipitation_probability > conditions.max_precipitation_probability) {
      failedConditions.push(
        `Rain chance ${weather.precipitation_probability}% > ${conditions.max_precipitation_probability}%`
      );
    }
  }

  // Check visibility
  if (conditions.min_visibility !== undefined) {
    if (weather.visibility < conditions.min_visibility) {
      failedConditions.push(
        `Visibility ${weather.visibility}km < ${conditions.min_visibility}km`
      );
    }
  }

  // Check temperature range
  if (conditions.min_temperature !== undefined) {
    if (weather.temperature < conditions.min_temperature) {
      failedConditions.push(
        `Temperature ${weather.temperature}°C < ${conditions.min_temperature}°C`
      );
    }
  }

  if (conditions.max_temperature !== undefined) {
    if (weather.temperature > conditions.max_temperature) {
      failedConditions.push(
        `Temperature ${weather.temperature}°C > ${conditions.max_temperature}°C`
      );
    }
  }

  if (failedConditions.length === 0) {
    return {
      matches: true,
      reason: 'All conditions met',
      snapshot,
    };
  }

  return {
    matches: false,
    reason: failedConditions.join('; '),
    snapshot,
  };
}

/**
 * Check if alert is in cooldown period
 */
export function isInCooldown(
  rule: AlertRule,
  cooldownHours: number = 6
): boolean {
  if (!rule.last_triggered_at) {
    return false;
  }

  const lastTriggered = new Date(rule.last_triggered_at);
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  const now = new Date();

  return now.getTime() - lastTriggered.getTime() < cooldownMs;
}
