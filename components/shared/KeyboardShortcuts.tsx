'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard } from 'lucide-react';

export interface Shortcut {
  keys: string[];
  description: string;
  category: 'general' | 'map' | 'navigation';
}

export const KEYBOARD_SHORTCUTS: Shortcut[] = [
  // General
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'general' },
  { keys: ['/'], description: 'Focus search', category: 'general' },
  { keys: ['Esc'], description: 'Close dialogs', category: 'general' },
  { keys: ['s'], description: 'Open settings', category: 'general' },
  { keys: ['h'], description: 'Show help / onboarding', category: 'general' },

  // Map
  { keys: ['+'], description: 'Zoom in', category: 'map' },
  { keys: ['-'], description: 'Zoom out', category: 'map' },
  { keys: ['l'], description: 'Center on my location', category: 'map' },

  // Navigation
  { keys: ['1'], description: 'Show current weather', category: 'navigation' },
  { keys: ['2'], description: 'Show 7-day forecast', category: 'navigation' },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutKey({ keyName }: { keyName: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
      {keyName}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <ShortcutKey key={index} keyName={key} />
        ))}
      </div>
    </div>
  );
}

function ShortcutCategory({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: Shortcut[];
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="divide-y divide-border">
        {shortcuts.map((shortcut, index) => (
          <ShortcutRow key={index} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: KeyboardShortcutsDialogProps) {
  const generalShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) => s.category === 'general'
  );
  const mapShortcuts = KEYBOARD_SHORTCUTS.filter((s) => s.category === 'map');
  const navigationShortcuts = KEYBOARD_SHORTCUTS.filter(
    (s) => s.category === 'navigation'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Use these shortcuts to navigate PhotoScout faster.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ShortcutCategory title="General" shortcuts={generalShortcuts} />
          <ShortcutCategory title="Map" shortcuts={mapShortcuts} />
          <ShortcutCategory title="Navigation" shortcuts={navigationShortcuts} />
        </div>

        <p className="text-xs text-muted-foreground">
          Press <ShortcutKey keyName="?" /> anytime to show this dialog.
        </p>
      </DialogContent>
    </Dialog>
  );
}
