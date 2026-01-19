/**
 * BottomSheet Component
 * A reusable bottom sheet with three states: collapsed, peek, expanded
 * Supports swipe gestures, click outside to close, and keyboard navigation
 */

'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BottomSheetState = 'collapsed' | 'peek' | 'expanded';

interface BottomSheetProps {
  /** Whether the sheet is visible */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Current state of the sheet */
  state?: BottomSheetState;
  /** State change handler */
  onStateChange?: (state: BottomSheetState) => void;
  /** Sheet title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Sheet content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Peek height in pixels (default: 200) */
  peekHeight?: number;
  /** Whether to show the close button (default: true) */
  showCloseButton?: boolean;
  /** Whether to allow expanding (default: true) */
  allowExpand?: boolean;
}

// Swipe threshold in pixels
const SWIPE_THRESHOLD = 50;
// Velocity threshold for quick swipes
const VELOCITY_THRESHOLD = 0.5;

export function BottomSheet({
  open,
  onClose,
  state = 'peek',
  onStateChange,
  title,
  subtitle,
  children,
  className,
  peekHeight = 200,
  showCloseButton = true,
  allowExpand = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startY: 0,
    currentY: 0,
    startTime: 0,
    isDragging: false,
  });

  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Handle click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Delay to prevent immediate close on open
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  // Touch/mouse handlers for swipe gestures
  const handleDragStart = useCallback((clientY: number) => {
    dragRef.current = {
      startY: clientY,
      currentY: clientY,
      startTime: Date.now(),
      isDragging: true,
    };
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!dragRef.current.isDragging) return;

    dragRef.current.currentY = clientY;
    const delta = dragRef.current.startY - clientY;
    setDragOffset(delta);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!dragRef.current.isDragging) return;

    const delta = dragRef.current.startY - dragRef.current.currentY;
    const elapsed = Date.now() - dragRef.current.startTime;
    const velocity = Math.abs(delta) / elapsed;

    // Determine new state based on swipe direction and velocity
    let newState: BottomSheetState = state;

    if (velocity > VELOCITY_THRESHOLD || Math.abs(delta) > SWIPE_THRESHOLD) {
      if (delta > 0) {
        // Swiped up - expand
        if (state === 'peek' && allowExpand) {
          newState = 'expanded';
        }
      } else {
        // Swiped down - collapse or close
        if (state === 'expanded') {
          newState = 'peek';
        } else if (state === 'peek') {
          onClose();
          dragRef.current.isDragging = false;
          setIsDragging(false);
          setDragOffset(0);
          return;
        }
      }
    }

    if (newState !== state && onStateChange) {
      onStateChange(newState);
    }

    dragRef.current.isDragging = false;
    setIsDragging(false);
    setDragOffset(0);
  }, [state, allowExpand, onStateChange, onClose]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientY);
    },
    [handleDragStart]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      handleDragStart(e.touches[0].clientY);
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    },
    [handleDragMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Toggle expand/collapse on header double-click
  const handleHeaderDoubleClick = useCallback(() => {
    if (!allowExpand) return;

    const newState = state === 'expanded' ? 'peek' : 'expanded';
    if (onStateChange) {
      onStateChange(newState);
    }
  }, [state, allowExpand, onStateChange]);

  if (!open) return null;

  // Calculate transform based on state and drag offset
  const getTransform = () => {
    if (isDragging) {
      // Limit drag to prevent pulling sheet above viewport
      const clampedOffset = Math.min(Math.max(dragOffset, -100), peekHeight);
      if (state === 'expanded') {
        return `translateY(${Math.max(-clampedOffset, 0)}px)`;
      }
      return `translateY(calc(100% - ${peekHeight + clampedOffset}px))`;
    }

    if (state === 'expanded') {
      return 'translateY(0)';
    }

    return `translateY(calc(100% - ${peekHeight}px))`;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 backdrop-blur-sm',
          'transition-opacity duration-300',
          state === 'expanded' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'fixed inset-x-0 bottom-0 z-50',
          'flex flex-col max-h-[85vh]',
          'rounded-t-2xl border-t bg-background shadow-2xl',
          !isDragging && 'transition-transform duration-300 ease-out',
          className
        )}
        style={{ transform: getTransform() }}
      >
        {/* Drag Handle */}
        <div
          className="flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleHeaderDoubleClick}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            'flex-1 overflow-y-auto overscroll-contain',
            state === 'peek' && 'overflow-hidden'
          )}
        >
          {children}
        </div>
      </div>
    </>
  );
}
