-- Phase 10A: Alert Database Schema for Weather Alerts & Notifications
-- This migration enhances the alert system with comprehensive rule configuration

-- Drop the existing basic weather_alerts table and recreate with enhanced schema
DROP TABLE IF EXISTS weather_alerts CASCADE;

-- Create enhanced alert_rules table
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('golden_hour', 'clear_skies', 'low_wind', 'custom')),
  -- Conditions stored as JSONB for flexibility
  -- Example: {"max_cloud_cover": 30, "min_visibility": 10, "max_wind_speed": 20}
  conditions JSONB NOT NULL DEFAULT '{}',
  -- Time window for when to check alerts
  -- Example: {"start_hour": 5, "end_hour": 9} for morning alerts
  time_window JSONB,
  -- Days of week to check (0 = Sunday, 6 = Saturday)
  -- Example: [0, 6] for weekends only, null for all days
  days_of_week INTEGER[],
  -- Alert lead time in minutes (how far in advance to notify)
  lead_time_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alert_history table for tracking sent notifications
CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  -- Snapshot of weather conditions when alert was triggered
  conditions_snapshot JSONB NOT NULL,
  -- Whether notification was actually sent (vs just logged)
  notification_sent BOOLEAN DEFAULT false,
  -- Notification channel used (push, in-app, etc.)
  notification_channel TEXT,
  -- Whether user has seen/acknowledged this alert
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ
);

-- Create push_subscriptions table for Web Push notifications
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Web Push subscription object as JSON
  subscription JSONB NOT NULL,
  -- User agent/device info for managing multiple devices
  user_agent TEXT,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on user_id and subscription endpoint (unique constraint on expression)
CREATE UNIQUE INDEX push_subscriptions_user_endpoint_idx
  ON push_subscriptions(user_id, (subscription->>'endpoint'));

-- Create notification_preferences table for user settings
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- Enable/disable all notifications
  notifications_enabled BOOLEAN DEFAULT true,
  -- Push notification settings
  push_enabled BOOLEAN DEFAULT true,
  -- In-app notification settings
  in_app_enabled BOOLEAN DEFAULT true,
  -- Quiet hours (don't send notifications during this time)
  quiet_hours_start INTEGER, -- Hour (0-23)
  quiet_hours_end INTEGER,   -- Hour (0-23)
  -- Rate limiting
  max_notifications_per_day INTEGER DEFAULT 10,
  -- Minimum hours between same alert triggers
  cooldown_hours INTEGER DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX alert_rules_user_id_idx ON alert_rules(user_id);
CREATE INDEX alert_rules_location_id_idx ON alert_rules(location_id);
CREATE INDEX alert_rules_is_active_idx ON alert_rules(is_active) WHERE is_active = true;
CREATE INDEX alert_history_alert_rule_id_idx ON alert_history(alert_rule_id);
CREATE INDEX alert_history_user_id_idx ON alert_history(user_id);
CREATE INDEX alert_history_triggered_at_idx ON alert_history(triggered_at DESC);
CREATE INDEX alert_history_is_read_idx ON alert_history(is_read) WHERE is_read = false;
CREATE INDEX push_subscriptions_user_id_idx ON push_subscriptions(user_id);

-- Enable RLS on all tables
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_rules
CREATE POLICY "Users can read own alert rules" ON alert_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert rules" ON alert_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert rules" ON alert_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alert rules" ON alert_rules
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for alert_history
CREATE POLICY "Users can read own alert history" ON alert_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alert history" ON alert_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert history" ON alert_history
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for push_subscriptions
CREATE POLICY "Users can read own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for notification_preferences
CREATE POLICY "Users can read own notification preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER alert_rules_updated_at BEFORE UPDATE ON alert_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create function to count notifications sent today for rate limiting
CREATE OR REPLACE FUNCTION count_notifications_today(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM alert_history
  WHERE user_id = p_user_id
    AND notification_sent = true
    AND triggered_at >= CURRENT_DATE
    AND triggered_at < CURRENT_DATE + INTERVAL '1 day';
$$ LANGUAGE SQL STABLE;

-- Create function to check if alert is in cooldown
CREATE OR REPLACE FUNCTION is_alert_in_cooldown(p_alert_rule_id UUID, p_cooldown_hours INTEGER)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM alert_rules
    WHERE id = p_alert_rule_id
      AND last_triggered_at IS NOT NULL
      AND last_triggered_at > NOW() - (p_cooldown_hours || ' hours')::INTERVAL
  );
$$ LANGUAGE SQL STABLE;
