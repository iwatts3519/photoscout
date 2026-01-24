'use client';

import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Sun, Cloud, Wind, Settings, MapPin, ExternalLink } from 'lucide-react';
import { markAlertAsRead } from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import type { AlertHistoryWithRule, AlertType } from '@/src/types/alerts.types';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: AlertHistoryWithRule;
  onViewLocation?: (locationId: string) => void;
}

const ALERT_TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  golden_hour: <Sun className="h-4 w-4 text-amber-500" />,
  clear_skies: <Cloud className="h-4 w-4 text-sky-500" />,
  low_wind: <Wind className="h-4 w-4 text-emerald-500" />,
  custom: <Settings className="h-4 w-4 text-purple-500" />,
};

export function NotificationItem({
  notification,
  onViewLocation,
}: NotificationItemProps) {
  const { markAlertAsRead: markAsReadInStore, decrementUnreadCount } = useAlertStore();

  const handleMarkAsRead = async () => {
    if (notification.is_read) return;

    await markAlertAsRead(notification.id);
    markAsReadInStore(notification.id);
    decrementUnreadCount();
  };

  const handleViewLocation = () => {
    handleMarkAsRead();
    onViewLocation?.(notification.alert_rule?.location_id || '');
  };

  const alertType = (notification.alert_rule?.alert_type || 'custom') as AlertType;
  const snapshot = notification.conditions_snapshot;
  const triggeredAt = new Date(notification.triggered_at);

  // Build description from snapshot
  const getDescription = () => {
    const parts: string[] = [];

    if (snapshot.sun_event) {
      const eventName = snapshot.sun_event.replace(/_/g, ' ');
      parts.push(eventName.charAt(0).toUpperCase() + eventName.slice(1));
    }

    if (snapshot.cloud_cover !== undefined) {
      parts.push(`${snapshot.cloud_cover}% clouds`);
    }

    if (snapshot.wind_speed !== undefined) {
      parts.push(`${snapshot.wind_speed} mph wind`);
    }

    if (snapshot.temperature !== undefined) {
      parts.push(`${Math.round(snapshot.temperature)}°C`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Conditions matched';
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        notification.is_read
          ? 'bg-transparent'
          : 'bg-primary/5 hover:bg-primary/10'
      )}
      onClick={handleMarkAsRead}
    >
      {/* Icon */}
      <div className="mt-0.5">{ALERT_TYPE_ICONS[alertType]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', !notification.is_read && 'text-primary')}>
              {notification.alert_rule?.name || 'Alert'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {getDescription()}
            </p>
          </div>

          {!notification.is_read && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>

        {/* Location and time */}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {notification.alert_rule?.name || 'Unknown location'}
          </span>
          <span>{formatDistanceToNow(triggeredAt, { addSuffix: true })}</span>
        </div>

        {/* Actions */}
        {onViewLocation && notification.alert_rule?.location_id && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 mt-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleViewLocation();
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Location
          </Button>
        )}
      </div>
    </div>
  );
}
