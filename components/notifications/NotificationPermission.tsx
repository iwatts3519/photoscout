'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, BellOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPermissionProps {
  variant?: 'card' | 'inline' | 'banner';
  onSubscribed?: () => void;
  className?: string;
}

export function NotificationPermission({
  variant = 'card',
  onSubscribed,
  className,
}: NotificationPermissionProps) {
  const {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast.success('Notifications enabled', {
        description: "You'll receive alerts when conditions are ideal.",
      });
      onSubscribed?.();
    } else if (error) {
      toast.error('Failed to enable notifications', {
        description: error,
      });
    }
  };

  const handleUnsubscribe = async () => {
    const success = await unsubscribe();
    if (success) {
      toast.success('Notifications disabled');
    }
    setShowUnsubscribeDialog(false);
  };

  // Don't show if unsupported
  if (permission === 'unsupported') {
    return null;
  }

  // Already subscribed state
  if (isSubscribed) {
    if (variant === 'inline') {
      return (
        <div className={cn('flex items-center gap-2', className)}>
          <Check className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            Notifications enabled
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnsubscribeDialog(true)}
            className="text-xs"
          >
            Disable
          </Button>

          <AlertDialog
            open={showUnsubscribeDialog}
            onOpenChange={setShowUnsubscribeDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable notifications?</AlertDialogTitle>
                <AlertDialogDescription>
                  You won&apos;t receive alerts about photography conditions at your
                  saved locations.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnsubscribe}>
                  Disable
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    return (
      <Card className={cn('bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800', className)}>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-900 dark:text-green-100">
              Notifications enabled
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              You&apos;ll receive alerts when conditions are ideal.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnsubscribeDialog(true)}
          >
            <BellOff className="h-4 w-4" />
          </Button>
        </CardContent>

        <AlertDialog
          open={showUnsubscribeDialog}
          onOpenChange={setShowUnsubscribeDialog}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable notifications?</AlertDialogTitle>
              <AlertDialogDescription>
                You won&apos;t receive alerts about photography conditions at your
                saved locations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnsubscribe}>
                Disable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    );
  }

  // Permission denied state
  if (permission === 'denied') {
    return (
      <Card className={cn('bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800', className)}>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-100">
              Notifications blocked
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Enable notifications in your browser settings to receive alerts.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Banner variant
  if (variant === 'banner') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 p-4 bg-primary/5 border rounded-lg',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Enable push notifications</p>
            <p className="text-sm text-muted-foreground">
              Get alerts when conditions are ideal for photography
            </p>
          </div>
        </div>
        <Button onClick={handleSubscribe} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enabling...
            </>
          ) : (
            'Enable'
          )}
        </Button>
      </div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <Button
        onClick={handleSubscribe}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className={className}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Bell className="mr-2 h-4 w-4" />
        )}
        Enable notifications
      </Button>
    );
  }

  // Card variant (default)
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Push Notifications</CardTitle>
            <CardDescription>
              Get notified about ideal photography conditions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Golden hour reminders
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Clear sky alerts
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-green-500" />
            Custom condition triggers
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubscribe} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enabling...
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enable Notifications
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
