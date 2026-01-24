'use client';

import { useEffect } from 'react';
import { Bell } from 'lucide-react';
import { fetchUnreadAlertCount } from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  className?: string;
  showZero?: boolean;
  onClick?: () => void;
}

export function NotificationBadge({
  className,
  showZero = false,
  onClick,
}: NotificationBadgeProps) {
  const { unreadCount, setUnreadCount } = useAlertStore();

  // Fetch unread count on mount
  useEffect(() => {
    async function loadUnreadCount() {
      const { data } = await fetchUnreadAlertCount();
      if (data !== null) {
        setUnreadCount(data);
      }
    }

    loadUnreadCount();

    // Refresh every 5 minutes
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setUnreadCount]);

  const displayCount = unreadCount > 99 ? '99+' : unreadCount.toString();
  const showBadge = unreadCount > 0 || showZero;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <Bell className="h-5 w-5" />
      {showBadge && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex items-center justify-center',
            'min-w-[18px] h-[18px] px-1 rounded-full',
            'text-[10px] font-bold',
            unreadCount > 0
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
