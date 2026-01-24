'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Bell, Sun, Cloud, Wind, Settings } from 'lucide-react';
import { createAlertRule, updateAlertRule } from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import { useLocationStore } from '@/src/stores/locationStore';
import { toast } from 'sonner';
import {
  ALERT_TYPES,
  ALERT_TYPE_INFO,
  DAY_LABELS,
  type AlertType,
  type AlertConditions,
  type TimeWindow,
  type AlertRule,
} from '@/src/types/alerts.types';
import { cn } from '@/lib/utils';

interface AlertRuleFormProps {
  locationId?: string;
  editingRule?: AlertRule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ALERT_TYPE_ICONS: Record<AlertType, React.ReactNode> = {
  golden_hour: <Sun className="h-4 w-4" />,
  clear_skies: <Cloud className="h-4 w-4" />,
  low_wind: <Wind className="h-4 w-4" />,
  custom: <Settings className="h-4 w-4" />,
};

export function AlertRuleForm({
  locationId: initialLocationId,
  editingRule,
  onSuccess,
  onCancel,
}: AlertRuleFormProps) {
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const { addAlertRule, updateAlertRule: updateStoreAlertRule } = useAlertStore();

  // Form state
  const [name, setName] = useState(editingRule?.name || '');
  const [locationId, setLocationId] = useState(initialLocationId || editingRule?.location_id || '');
  const [alertType, setAlertType] = useState<AlertType>(
    (editingRule?.alert_type as AlertType) || 'golden_hour'
  );
  const [conditions, setConditions] = useState<AlertConditions>(
    editingRule?.conditions || ALERT_TYPE_INFO.golden_hour.defaultConditions
  );
  const [timeWindow, setTimeWindow] = useState<TimeWindow | null>(
    editingRule?.time_window || null
  );
  const [daysOfWeek, setDaysOfWeek] = useState<number[] | null>(
    editingRule?.days_of_week || null
  );
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(
    editingRule?.lead_time_minutes || 30
  );
  const [isActive, setIsActive] = useState(editingRule?.is_active ?? true);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Time window options
  const [useMorning, setUseMorning] = useState(
    timeWindow ? timeWindow.start_hour >= 4 && timeWindow.start_hour <= 10 : true
  );
  const [useEvening, setUseEvening] = useState(
    timeWindow ? timeWindow.start_hour >= 15 && timeWindow.start_hour <= 21 : true
  );

  // Update time window when morning/evening toggles change
  useEffect(() => {
    if (!useMorning && !useEvening) {
      setTimeWindow(null);
    } else if (useMorning && useEvening) {
      setTimeWindow(null); // All day
    } else if (useMorning) {
      setTimeWindow({ start_hour: 5, end_hour: 10 });
    } else if (useEvening) {
      setTimeWindow({ start_hour: 16, end_hour: 21 });
    }
  }, [useMorning, useEvening]);

  // Update conditions when alert type changes
  useEffect(() => {
    if (!editingRule) {
      setConditions(ALERT_TYPE_INFO[alertType].defaultConditions);
    }
  }, [alertType, editingRule]);

  const handleDayToggle = (day: number) => {
    if (daysOfWeek === null) {
      // First selection - select only this day
      setDaysOfWeek([day]);
    } else if (daysOfWeek.includes(day)) {
      // Deselect day
      const newDays = daysOfWeek.filter((d) => d !== day);
      setDaysOfWeek(newDays.length === 0 ? null : newDays);
    } else {
      // Select day
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!locationId) {
      newErrors.locationId = 'Please select a location';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      if (editingRule) {
        // Update existing rule
        const { data, error } = await updateAlertRule(editingRule.id, {
          name: name.trim(),
          alert_type: alertType,
          conditions,
          time_window: timeWindow,
          days_of_week: daysOfWeek,
          lead_time_minutes: leadTimeMinutes,
          is_active: isActive,
        });

        if (error) {
          toast.error('Failed to update alert', { description: error });
          setIsLoading(false);
          return;
        }

        if (data) {
          updateStoreAlertRule(data.id, data);
          toast.success('Alert updated', {
            description: `${data.name} has been updated.`,
          });
          onSuccess?.();
        }
      } else {
        // Create new rule
        const { data, error } = await createAlertRule({
          location_id: locationId,
          name: name.trim(),
          alert_type: alertType,
          conditions,
          time_window: timeWindow,
          days_of_week: daysOfWeek,
          lead_time_minutes: leadTimeMinutes,
          is_active: isActive,
        });

        if (error) {
          toast.error('Failed to create alert', { description: error });
          setIsLoading(false);
          return;
        }

        if (data) {
          // Find location details for the store
          const location = savedLocations.find((loc) => loc.id === locationId);
          if (location) {
            addAlertRule({
              ...data,
              location: {
                id: location.id,
                name: location.name,
                coordinates: location.coordinates as { lat: number; lng: number },
              },
            });
          }
          toast.success('Alert created', {
            description: `You'll be notified when conditions match at ${location?.name || 'your location'}.`,
          });
          onSuccess?.();
        }
      }

      setIsLoading(false);
    } catch (err) {
      toast.error('An error occurred', {
        description: err instanceof Error ? err.message : 'Please try again',
      });
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location selector (only if not pre-selected) */}
      {!initialLocationId && (
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Select
            value={locationId}
            onValueChange={setLocationId}
            disabled={isLoading}
          >
            <SelectTrigger id="location">
              <SelectValue placeholder="Select a saved location" />
            </SelectTrigger>
            <SelectContent>
              {savedLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.locationId && (
            <p className="text-sm text-destructive">{errors.locationId}</p>
          )}
        </div>
      )}

      {/* Alert name */}
      <div className="space-y-2">
        <Label htmlFor="alert-name">Alert Name *</Label>
        <Input
          id="alert-name"
          type="text"
          placeholder="e.g., Morning Golden Hour Alert"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors({ ...errors, name: '' });
          }}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Alert type selector */}
      <div className="space-y-2">
        <Label>Alert Type</Label>
        <div className="grid grid-cols-2 gap-2">
          {ALERT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAlertType(type)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border text-left transition-colors',
                alertType === type
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-accent/50'
              )}
            >
              {ALERT_TYPE_ICONS[type]}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ALERT_TYPE_INFO[type].label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ALERT_TYPE_INFO[type].description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conditions (for clear_skies, low_wind, and custom) */}
      {alertType !== 'golden_hour' && (
        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
          <Label className="text-sm font-medium">Conditions</Label>

          {(alertType === 'clear_skies' || alertType === 'custom') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cloud-cover" className="text-sm">
                  Max Cloud Cover
                </Label>
                <span className="text-sm text-muted-foreground">
                  {conditions.max_cloud_cover ?? 30}%
                </span>
              </div>
              <Slider
                id="cloud-cover"
                value={[conditions.max_cloud_cover ?? 30]}
                onValueChange={([value]) =>
                  setConditions({ ...conditions, max_cloud_cover: value })
                }
                max={100}
                step={5}
                disabled={isLoading}
              />
            </div>
          )}

          {(alertType === 'low_wind' || alertType === 'custom') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wind-speed" className="text-sm">
                  Max Wind Speed
                </Label>
                <span className="text-sm text-muted-foreground">
                  {conditions.max_wind_speed ?? 10} mph
                </span>
              </div>
              <Slider
                id="wind-speed"
                value={[conditions.max_wind_speed ?? 10]}
                onValueChange={([value]) =>
                  setConditions({ ...conditions, max_wind_speed: value })
                }
                max={50}
                step={1}
                disabled={isLoading}
              />
            </div>
          )}

          {alertType === 'custom' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="precipitation" className="text-sm">
                    Max Precipitation Chance
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {conditions.max_precipitation_probability ?? 20}%
                  </span>
                </div>
                <Slider
                  id="precipitation"
                  value={[conditions.max_precipitation_probability ?? 20]}
                  onValueChange={([value]) =>
                    setConditions({
                      ...conditions,
                      max_precipitation_probability: value,
                    })
                  }
                  max={100}
                  step={5}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="visibility" className="text-sm">
                    Min Visibility
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {conditions.min_visibility ?? 10} km
                  </span>
                </div>
                <Slider
                  id="visibility"
                  value={[conditions.min_visibility ?? 10]}
                  onValueChange={([value]) =>
                    setConditions({ ...conditions, min_visibility: value })
                  }
                  max={50}
                  step={1}
                  disabled={isLoading}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Time of day */}
      <div className="space-y-3">
        <Label>When to Check</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useMorning}
              onChange={(e) => setUseMorning(e.target.checked)}
              disabled={isLoading}
              className="rounded border-input"
            />
            <span className="text-sm">Morning (5am - 10am)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useEvening}
              onChange={(e) => setUseEvening(e.target.checked)}
              disabled={isLoading}
              className="rounded border-input"
            />
            <span className="text-sm">Evening (4pm - 9pm)</span>
          </label>
        </div>
      </div>

      {/* Days of week */}
      <div className="space-y-3">
        <Label>Days to Check</Label>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              disabled={isLoading}
              className={cn(
                'w-10 h-10 rounded-full text-xs font-medium transition-colors',
                daysOfWeek === null || daysOfWeek.includes(day)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {DAY_LABELS[day as keyof typeof DAY_LABELS]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {daysOfWeek === null
            ? 'Checking all days'
            : `Checking ${daysOfWeek.length} day${daysOfWeek.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Lead time (for golden hour) */}
      {alertType === 'golden_hour' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="lead-time" className="text-sm">
              Notify me before
            </Label>
            <span className="text-sm text-muted-foreground">
              {leadTimeMinutes} minutes
            </span>
          </div>
          <Slider
            id="lead-time"
            value={[leadTimeMinutes]}
            onValueChange={([value]) => setLeadTimeMinutes(value)}
            min={15}
            max={120}
            step={15}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Active toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="active-toggle">Alert Active</Label>
          <p className="text-xs text-muted-foreground">
            Enable or disable this alert
          </p>
        </div>
        <Switch
          id="active-toggle"
          checked={isActive}
          onCheckedChange={setIsActive}
          disabled={isLoading}
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editingRule ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              {editingRule ? 'Update Alert' : 'Create Alert'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
