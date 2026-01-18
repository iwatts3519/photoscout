'use client';

import { Settings, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { ThemeToggle } from './ThemeToggle';
import {
  useSettingsStore,
  formatDistance,
  type UnitSystem,
} from '@/src/stores/settingsStore';

interface SettingsDialogProps {
  trigger?: React.ReactNode;
  /** Controlled mode: whether the dialog is open */
  open?: boolean;
  /** Controlled mode: callback when open state changes */
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({ trigger, open, onOpenChange }: SettingsDialogProps) {
  const {
    unitSystem,
    defaultRadius,
    showCoordinates,
    compactMode,
    setUnitSystem,
    setDefaultRadius,
    setShowCoordinates,
    setCompactMode,
    resetSettings,
    distanceUnit,
  } = useSettingsStore();

  // Support both controlled and uncontrolled modes
  const dialogProps = open !== undefined ? { open, onOpenChange } : {};

  return (
    <Dialog {...dialogProps}>
      {/* Only render trigger in uncontrolled mode */}
      {open === undefined && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your PhotoScout experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Theme</Label>
            <ThemeToggle showLabel />
          </div>

          {/* Unit System */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Units</Label>
            <Select
              value={unitSystem}
              onValueChange={(value) => setUnitSystem(value as UnitSystem)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">
                  Metric (km, °C, km/h)
                </SelectItem>
                <SelectItem value="imperial">
                  Imperial (mi, °F, mph)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Affects temperature, distance, and speed display throughout the app
            </p>
          </div>

          {/* Default Search Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Default Search Radius</Label>
              <span className="text-sm text-muted-foreground">
                {formatDistance(defaultRadius, distanceUnit)}
              </span>
            </div>
            <Slider
              value={[defaultRadius]}
              onValueChange={(value) => setDefaultRadius(value[0])}
              min={500}
              max={10000}
              step={100}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatDistance(500, distanceUnit)}</span>
              <span>{formatDistance(10000, distanceUnit)}</span>
            </div>
          </div>

          {/* UI Preferences */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Display Options</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-coordinates" className="text-sm">
                  Show Coordinates
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display latitude/longitude in sidebar
                </p>
              </div>
              <Switch
                id="show-coordinates"
                checked={showCoordinates}
                onCheckedChange={setShowCoordinates}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode" className="text-sm">
                  Compact Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reduce spacing in weather cards
                </p>
              </div>
              <Switch
                id="compact-mode"
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
