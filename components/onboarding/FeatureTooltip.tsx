'use client';

import { useState, useEffect, type ReactNode } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useOnboardingStore } from '@/src/stores/onboardingStore';
import { X, Lightbulb } from 'lucide-react';

interface FeatureTooltipProps {
  /** Unique identifier for this tooltip (used for dismissal tracking) */
  tooltipId: string;
  /** Title of the tooltip */
  title: string;
  /** Description text */
  description: string;
  /** The element to wrap with the tooltip */
  children: ReactNode;
  /** Which side to show the tooltip on */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Alignment of the tooltip */
  align?: 'start' | 'center' | 'end';
  /** Whether to show the tooltip automatically for new users */
  showForNewUsers?: boolean;
  /** Delay in ms before showing the tooltip (default: 500) */
  delay?: number;
  /** Whether the tooltip is currently active/relevant */
  active?: boolean;
}

export function FeatureTooltip({
  tooltipId,
  title,
  description,
  children,
  side = 'bottom',
  align = 'center',
  showForNewUsers = true,
  delay = 500,
  active = true,
}: FeatureTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const {
    hasCompletedOnboarding,
    isTooltipDismissed,
    dismissTooltip,
  } = useOnboardingStore();

  // Auto-show tooltip for new users after a delay
  useEffect(() => {
    if (
      !hasCompletedOnboarding &&
      showForNewUsers &&
      active &&
      !isTooltipDismissed(tooltipId) &&
      !hasShown
    ) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [
    hasCompletedOnboarding,
    showForNewUsers,
    active,
    tooltipId,
    isTooltipDismissed,
    hasShown,
    delay,
  ]);

  // Don't show if already dismissed
  if (isTooltipDismissed(tooltipId)) {
    return <>{children}</>;
  }

  const handleDismiss = () => {
    dismissTooltip(tooltipId);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        className="w-64 p-3"
        onInteractOutside={(e) => {
          // Prevent closing when clicking inside the trigger
          e.preventDefault();
        }}
      >
        <div className="flex items-start gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleDismiss}
          >
            Got it
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A simpler inline hint that shows once and can be dismissed
 */
interface InlineHintProps {
  hintId: string;
  children: ReactNode;
  className?: string;
}

export function InlineHint({ hintId, children, className }: InlineHintProps) {
  const { isTooltipDismissed, dismissTooltip, hasCompletedOnboarding } =
    useOnboardingStore();

  // Don't show for users who completed onboarding or already dismissed
  if (hasCompletedOnboarding || isTooltipDismissed(hintId)) {
    return null;
  }

  return (
    <div
      className={`flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 ${className ?? ''}`}
    >
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1">{children}</div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-700 hover:bg-amber-100 hover:text-amber-900 dark:text-amber-300 dark:hover:bg-amber-900 dark:hover:text-amber-100"
        onClick={() => dismissTooltip(hintId)}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}
