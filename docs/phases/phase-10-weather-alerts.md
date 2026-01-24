# Phase 10: Weather Alerts & Notifications

**Status**: ✅ Complete
**Completion**: 100%

## Goal
Allow users to set up automated alerts for favorable photography conditions at their saved locations. Receive notifications when golden hour approaches, weather clears, or conditions match their preferences.

## Overview

**Core Concept**: Users configure alert rules (e.g., "notify me when cloud cover < 30% at Sunrise") and receive browser push notifications or email alerts when conditions are met.

**Architecture**:
```
User → Creates Alert Rule → Stored in Database
                              ↓
              Scheduled Job (every 15 min) checks conditions
                              ↓
              If conditions match → Send Push Notification
```

---

## Sub-Phases

### Phase 10A: Alert Database Schema & Types ✅

**Goal**: Set up database tables for storing alert configurations.

**Database Schema**:
```sql
CREATE TABLE alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('golden_hour', 'clear_skies', 'low_wind', 'custom')),
  conditions JSONB NOT NULL DEFAULT '{}',
  time_window JSONB,
  days_of_week INTEGER[],
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  conditions_snapshot JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT false
);
```

**Files Created**:
- `supabase/migrations/20260120000001_add_alert_tables.sql`
- `src/types/alerts.types.ts`
- `lib/queries/alerts.ts`
- `app/actions/alerts.ts`

---

### Phase 10B: Alert Configuration UI ✅

**Goal**: Build UI for creating and managing alert rules.

**UI Layout**:
```
┌─────────────────────────────────────────┐
│ 🔔 Create Alert                    [✕]  │
├─────────────────────────────────────────┤
│ Location: [Dropdown - saved locations]  │
│ Alert Name: [________________]          │
├─────────────────────────────────────────┤
│ Alert Type:                             │
│ ○ Golden Hour Reminder (30 min before)  │
│ ○ Clear Skies (cloud cover < ___%)      │
│ ○ Low Wind (wind speed < ___ mph)       │
│ ○ Custom Conditions                     │
├─────────────────────────────────────────┤
│ When to Check:                          │
│ ☑ Morning (5am - 10am)                  │
│ ☑ Evening (4pm - 9pm)                   │
│ Days: [M][T][W][T][F][S][S]            │
├─────────────────────────────────────────┤
│ [Cancel]              [Create Alert]    │
└─────────────────────────────────────────┘
```

**Files Created**:
- `src/stores/alertStore.ts`
- `components/alerts/AlertRuleForm.tsx`
- `components/alerts/AlertRuleCard.tsx`
- `components/alerts/AlertRulesList.tsx`
- `components/alerts/AlertsDialog.tsx`
- `components/alerts/ConditionBuilder.tsx`

---

### Phase 10C: Push Notification Service ✅

**Goal**: Implement Web Push API for browser notifications.

**Technical Details**:
- Use Web Push API (no external service needed)
- Generate VAPID keys and store in environment variables
- Service worker handles background notifications
- Fallback to in-app notification center if push denied

**Files Created**:
- `public/sw.js` - Service worker for push
- `lib/notifications/web-push.ts` - Push notification utilities
- `lib/notifications/vapid.ts` - VAPID key management
- `src/hooks/usePushNotifications.ts` - Hook for managing push subscription
- `components/notifications/NotificationPermission.tsx` - Permission request UI
- `supabase/migrations/20260120000002_add_push_subscriptions.sql`

---

### Phase 10D: Alert Checking Logic ✅

**Goal**: Implement scheduled checking of alert conditions.

**Architecture**:
1. **Vercel Cron Jobs** (recommended for Hobby plan)
   - `/api/cron/check-alerts` route
   - Runs every 15 minutes

**Files Created**:
- `app/api/cron/check-alerts/route.ts` - Cron endpoint
- `lib/alerts/condition-matcher.ts` - Evaluate alert conditions
- `lib/alerts/alert-checker.ts` - Main alert checking logic
- `vercel.json` - Cron configuration

**Rate Limiting**:
- Max 1 notification per alert per 6 hours
- Max 10 notifications per user per day
- Respect quiet hours (default 10pm-7am)

---

### Phase 10E: Notification Center UI ✅

**Goal**: In-app notification history and management.

**Files Created**:
- `components/notifications/NotificationCenter.tsx`
- `components/notifications/NotificationItem.tsx`
- `components/notifications/NotificationBadge.tsx`
- `src/stores/notificationStore.ts`

---

## Technical Considerations

**Web Push Setup**:
```bash
# Generate VAPID keys
npx web-push generate-vapid-keys
```

**Environment Variables**:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:alerts@photoscout.app
```

---

## Success Criteria (All Met)
- [x] Users can create alert rules for saved locations
- [x] Browser push notifications work when conditions match
- [x] Notification center shows alert history
- [x] Alerts respect cooldown and rate limits
- [x] Users can enable/disable individual alerts
- [x] All tests pass
- [x] Production build succeeds

**🎉 PHASE 10 COMPLETE!**
