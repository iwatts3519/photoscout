'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Check,
  Loader2,
  Settings,
} from 'lucide-react';
import {
  fetchAlertHistoryWithRules,
  markAllAlertsAsRead,
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import { NotificationBadge } from './NotificationBadge';
import { NotificationItem } from './NotificationItem';
import { NotificationPermission } from './NotificationPermission';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  variant?: 'popover' | 'sheet';
  onViewLocation?: (locationId: string) => void;
}

export function NotificationCenter({
  variant = 'popover',
  onViewLocation,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [isLoading, setIsLoading] = useState(false);

  const {
    alertHistory,
    setAlertHistory,
    unreadCount,
    setUnreadCount,
    markAllAlertsAsRead: markAllInStore,
    setNotificationPreferences,
    setIsLoadingHistory,
  } = useAlertStore();

  // Load notifications and preferences when opened
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setIsLoading(true);
      setIsLoadingHistory(true);

      try {
        const [historyResult, prefsResult] = await Promise.all([
          fetchAlertHistoryWithRules(50),
          fetchNotificationPreferences(),
        ]);

        if (historyResult.data) {
          setAlertHistory(historyResult.data);
          const unread = historyResult.data.filter((h) => !h.is_read).length;
          setUnreadCount(unread);
        }

        if (prefsResult.data) {
          setNotificationPreferences(prefsResult.data);
        }
      } catch (error) {
        console.error('Failed to load notification data:', error);
      }

      setIsLoading(false);
      setIsLoadingHistory(false);
    };

    loadData();
  }, [open, setAlertHistory, setUnreadCount, setNotificationPreferences, setIsLoadingHistory]);

  const handleMarkAllRead = async () => {
    const { error } = await markAllAlertsAsRead();
    if (error) {
      toast.error('Failed to mark all as read');
    } else {
      markAllInStore();
      setUnreadCount(0);
    }
  };

  const handleViewLocation = (locationId: string) => {
    setOpen(false);
    onViewLocation?.(locationId);
  };

  // Popover content
  const content = (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <TabsList className="h-8">
          <TabsTrigger value="notifications" className="text-xs px-3 h-7">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs px-3 h-7">
            <Settings className="h-3.5 w-3.5" />
          </TabsTrigger>
        </TabsList>

        {activeTab === 'notifications' && unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleMarkAllRead}
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <TabsContent value="notifications" className="m-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : alertHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <Bell className="h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Set up alerts to get notified about photography conditions
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {alertHistory.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onViewLocation={handleViewLocation}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </TabsContent>

      <TabsContent value="settings" className="m-0 p-4">
        <NotificationSettings />
      </TabsContent>
    </Tabs>
  );

  if (variant === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <NotificationBadge />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            <SheetDescription className="sr-only">
              View and manage your notifications
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <NotificationBadge />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0"
        sideOffset={8}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const { notificationPreferences, setNotificationPreferences } = useAlertStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (
    field: 'notifications_enabled' | 'push_enabled' | 'in_app_enabled',
    value: boolean
  ) => {
    setIsUpdating(true);
    const updates = { [field]: value };
    const { data, error } = await updateNotificationPreferences(updates as { notifications_enabled?: boolean; push_enabled?: boolean; in_app_enabled?: boolean });
    if (error) {
      toast.error('Failed to update settings');
    } else if (data) {
      setNotificationPreferences(data);
    }
    setIsUpdating(false);
  };

  const handleQuietHours = async (start: number | null, end: number | null) => {
    setIsUpdating(true);
    const { data, error } = await updateNotificationPreferences({
      quiet_hours_start: start ?? undefined,
      quiet_hours_end: end ?? undefined,
    });
    if (error) {
      toast.error('Failed to update quiet hours');
    } else if (data) {
      setNotificationPreferences(data);
    }
    setIsUpdating(false);
  };

  return (
    <div className="space-y-4">
      {/* Push notification status */}
      <NotificationPermission variant="inline" />

      {/* Settings toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">All notifications</p>
            <p className="text-xs text-muted-foreground">
              Enable or disable all alerts
            </p>
          </div>
          <button
            onClick={() =>
              handleToggle(
                'notifications_enabled',
                !(notificationPreferences?.notifications_enabled ?? true)
              )
            }
            disabled={isUpdating}
            className={cn(
              'w-10 h-5 rounded-full transition-colors',
              notificationPreferences?.notifications_enabled ?? true
                ? 'bg-primary'
                : 'bg-muted'
            )}
          >
            <span
              className={cn(
                'block w-4 h-4 rounded-full bg-white transition-transform',
                notificationPreferences?.notifications_enabled ?? true
                  ? 'translate-x-5'
                  : 'translate-x-0.5'
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Push notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive browser notifications
            </p>
          </div>
          <button
            onClick={() =>
              handleToggle(
                'push_enabled',
                !(notificationPreferences?.push_enabled ?? true)
              )
            }
            disabled={isUpdating || !(notificationPreferences?.notifications_enabled ?? true)}
            className={cn(
              'w-10 h-5 rounded-full transition-colors',
              notificationPreferences?.push_enabled ?? true
                ? 'bg-primary'
                : 'bg-muted',
              !(notificationPreferences?.notifications_enabled ?? true) && 'opacity-50'
            )}
          >
            <span
              className={cn(
                'block w-4 h-4 rounded-full bg-white transition-transform',
                notificationPreferences?.push_enabled ?? true
                  ? 'translate-x-5'
                  : 'translate-x-0.5'
              )}
            />
          </button>
        </div>
      </div>

      {/* Quiet hours */}
      <div className="pt-2 border-t">
        <p className="text-sm font-medium mb-2">Quiet hours</p>
        <p className="text-xs text-muted-foreground mb-3">
          Don&apos;t send notifications during these hours
        </p>

        <div className="flex items-center gap-2">
          <select
            value={notificationPreferences?.quiet_hours_start ?? ''}
            onChange={(e) =>
              handleQuietHours(
                e.target.value ? parseInt(e.target.value) : null,
                notificationPreferences?.quiet_hours_end ?? null
              )
            }
            disabled={isUpdating}
            className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Off</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>

          <span className="text-muted-foreground">to</span>

          <select
            value={notificationPreferences?.quiet_hours_end ?? ''}
            onChange={(e) =>
              handleQuietHours(
                notificationPreferences?.quiet_hours_start ?? null,
                e.target.value ? parseInt(e.target.value) : null
              )
            }
            disabled={isUpdating || notificationPreferences?.quiet_hours_start === null}
            className="flex-1 h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Off</option>
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
