'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('flex gap-1', className)}>
        <Button variant="ghost" size="icon" disabled className="h-8 w-8">
          <Sun className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ] as const;

  return (
    <div className={cn('flex gap-1', className)}>
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant={theme === value ? 'secondary' : 'ghost'}
          size={showLabel ? 'sm' : 'icon'}
          onClick={() => setTheme(value)}
          className={cn(
            showLabel ? 'gap-2' : 'h-8 w-8',
            theme === value && 'bg-accent'
          )}
          aria-label={`Set ${label} theme`}
        >
          <Icon className="h-4 w-4" />
          {showLabel && <span>{label}</span>}
        </Button>
      ))}
    </div>
  );
}

/**
 * Simple theme toggle button that cycles through themes
 */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={className}
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
