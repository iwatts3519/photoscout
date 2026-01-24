'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Sun,
  Cloud,
  Wind,
  Settings,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Bell,
  BellOff,
} from 'lucide-react';
import { toggleAlertRule, deleteAlertRule } from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import { toast } from 'sonner';
import {
  ALERT_TYPE_INFO,
  DAY_LABELS,
  type AlertType,
  type AlertRuleWithLocation,
} from '@/src/types/alerts.types';
import { cn } from '@/lib/utils';

interface AlertRuleCardProps {
  rule: AlertRuleWithLocation;
  onEdit?: (rule: AlertRuleWithLocation) => void;
}

const ALERT_TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  golden_hour: <Sun className="h-5 w-5 text-amber-500" />,
  clear_skies: <Cloud className="h-5 w-5 text-sky-500" />,
  low_wind: <Wind className="h-5 w-5 text-emerald-500" />,
  custom: <Settings className="h-5 w-5 text-purple-500" />,
};

export function AlertRuleCard({ rule, onEdit }: AlertRuleCardProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { toggleAlertRule: toggleStoreAlertRule, removeAlertRule } = useAlertStore();

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      const { error } = await toggleAlertRule(rule.id, checked);
      if (error) {
        toast.error('Failed to toggle alert', { description: error });
      } else {
        toggleStoreAlertRule(rule.id, checked);
        toast.success(checked ? 'Alert enabled' : 'Alert paused');
      }
    } catch {
      toast.error('Failed to toggle alert');
    }
    setIsToggling(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteAlertRule(rule.id);
      if (error) {
        toast.error('Failed to delete alert', { description: error });
      } else {
        removeAlertRule(rule.id);
        toast.success('Alert deleted');
      }
    } catch {
      toast.error('Failed to delete alert');
    }
    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  // Format conditions for display
  const formatConditions = () => {
    const parts: string[] = [];
    const conditions = rule.conditions;

    if (conditions.max_cloud_cover !== undefined) {
      parts.push(`<${conditions.max_cloud_cover}% clouds`);
    }
    if (conditions.max_wind_speed !== undefined) {
      parts.push(`<${conditions.max_wind_speed} mph wind`);
    }
    if (conditions.max_precipitation_probability !== undefined) {
      parts.push(`<${conditions.max_precipitation_probability}% rain`);
    }
    if (conditions.min_visibility !== undefined) {
      parts.push(`>${conditions.min_visibility}km visibility`);
    }

    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Format days of week
  const formatDays = () => {
    if (!rule.days_of_week) return 'Every day';
    if (rule.days_of_week.length === 7) return 'Every day';
    if (
      rule.days_of_week.length === 2 &&
      rule.days_of_week.includes(0) &&
      rule.days_of_week.includes(6)
    ) {
      return 'Weekends';
    }
    if (
      rule.days_of_week.length === 5 &&
      !rule.days_of_week.includes(0) &&
      !rule.days_of_week.includes(6)
    ) {
      return 'Weekdays';
    }
    return rule.days_of_week
      .map((d) => DAY_LABELS[d as keyof typeof DAY_LABELS])
      .join(', ');
  };

  // Format time window
  const formatTimeWindow = () => {
    if (!rule.time_window) return 'All day';
    const { start_hour, end_hour } = rule.time_window;
    const formatHour = (h: number) => {
      if (h === 0) return '12am';
      if (h === 12) return '12pm';
      return h < 12 ? `${h}am` : `${h - 12}pm`;
    };
    return `${formatHour(start_hour)} - ${formatHour(end_hour)}`;
  };

  const conditionsText = formatConditions();
  const alertType = rule.alert_type as AlertType;

  return (
    <>
      <Card
        className={cn(
          'transition-opacity',
          !rule.is_active && 'opacity-60'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-0.5">{ALERT_TYPE_ICONS[alertType]}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{rule.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {ALERT_TYPE_INFO[alertType].label}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={rule.is_active}
                    onCheckedChange={handleToggle}
                    disabled={isToggling}
                    aria-label={rule.is_active ? 'Disable alert' : 'Enable alert'}
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(rule)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleToggle(!rule.is_active)}>
                        {rule.is_active ? (
                          <>
                            <BellOff className="mr-2 h-4 w-4" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Bell className="mr-2 h-4 w-4" />
                            Enable
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{rule.location?.name || 'Unknown location'}</span>
              </div>

              {/* Conditions */}
              {conditionsText && (
                <p className="text-sm text-muted-foreground mt-1">{conditionsText}</p>
              )}

              {/* Schedule */}
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{formatTimeWindow()}</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{formatDays()}</span>
              </div>

              {/* Last triggered */}
              {rule.last_triggered_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Last triggered:{' '}
                  {new Date(rule.last_triggered_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{rule.name}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
