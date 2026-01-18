import { useEffect, useCallback } from 'react';

export interface ShortcutHandler {
  key: string;
  /** Ctrl/Cmd modifier required */
  ctrl?: boolean;
  /** Shift modifier required */
  shift?: boolean;
  /** Alt modifier required */
  alt?: boolean;
  /** Callback when shortcut is triggered */
  handler: () => void;
  /** Description for documentation */
  description?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Shortcuts to register */
  shortcuts: ShortcutHandler[];
}

/**
 * Hook to register keyboard shortcuts
 *
 * @example
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: '/', handler: () => focusSearch(), description: 'Focus search' },
 *     { key: 's', handler: () => openSettings(), description: 'Open settings' },
 *     { key: '?', handler: () => showHelp(), description: 'Show help' },
 *   ]
 * });
 */
export function useKeyboardShortcuts({
  enabled = true,
  shortcuts,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in inputs/textareas
      const target = event.target as HTMLElement;
      const isInputFocused =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow some shortcuts even when input is focused
      const allowInInput = event.key === 'Escape';

      if (isInputFocused && !allowInInput) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.key === shortcut.key;

        const ctrlMatches = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;

        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // Special case: allow shift for ? (which is shift+/)
        const isQuestionMark = shortcut.key === '?' && event.key === '?';
        const modifiersMatch = isQuestionMark
          ? ctrlMatches && altMatches
          : ctrlMatches && shiftMatches && altMatches;

        if (keyMatches && modifiersMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler();
          return;
        }
      }
    },
    [enabled, shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * Pre-defined shortcuts that can be used across the app
 */
export const createAppShortcuts = (handlers: {
  onFocusSearch?: () => void;
  onOpenSettings?: () => void;
  onShowHelp?: () => void;
  onShowKeyboardShortcuts?: () => void;
  onEscape?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocateMe?: () => void;
  onShowCurrentWeather?: () => void;
  onShowForecast?: () => void;
}): ShortcutHandler[] => {
  const shortcuts: ShortcutHandler[] = [];

  if (handlers.onFocusSearch) {
    shortcuts.push({
      key: '/',
      handler: handlers.onFocusSearch,
      description: 'Focus search',
    });
  }

  if (handlers.onOpenSettings) {
    shortcuts.push({
      key: 's',
      handler: handlers.onOpenSettings,
      description: 'Open settings',
    });
  }

  if (handlers.onShowHelp) {
    shortcuts.push({
      key: 'h',
      handler: handlers.onShowHelp,
      description: 'Show help / onboarding',
    });
  }

  if (handlers.onShowKeyboardShortcuts) {
    shortcuts.push({
      key: '?',
      handler: handlers.onShowKeyboardShortcuts,
      description: 'Show keyboard shortcuts',
    });
  }

  if (handlers.onEscape) {
    shortcuts.push({
      key: 'Escape',
      handler: handlers.onEscape,
      description: 'Close dialogs',
      preventDefault: false, // Let dialogs handle their own escape
    });
  }

  if (handlers.onZoomIn) {
    shortcuts.push({
      key: '+',
      handler: handlers.onZoomIn,
      description: 'Zoom in',
    });
    shortcuts.push({
      key: '=',
      handler: handlers.onZoomIn,
      description: 'Zoom in (alternative)',
    });
  }

  if (handlers.onZoomOut) {
    shortcuts.push({
      key: '-',
      handler: handlers.onZoomOut,
      description: 'Zoom out',
    });
  }

  if (handlers.onLocateMe) {
    shortcuts.push({
      key: 'l',
      handler: handlers.onLocateMe,
      description: 'Center on my location',
    });
  }

  if (handlers.onShowCurrentWeather) {
    shortcuts.push({
      key: '1',
      handler: handlers.onShowCurrentWeather,
      description: 'Show current weather',
    });
  }

  if (handlers.onShowForecast) {
    shortcuts.push({
      key: '2',
      handler: handlers.onShowForecast,
      description: 'Show 7-day forecast',
    });
  }

  return shortcuts;
};
