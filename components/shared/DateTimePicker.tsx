'use client';

import { useState, useCallback, useMemo } from 'react';
import { format, isSameDay, startOfDay, addDays, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onReset: () => void;
  className?: string;
}

// Generate hours array (0-23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Generate minutes array (0, 15, 30, 45)
const MINUTES = [0, 15, 30, 45];

export function DateTimePicker({
  selectedDate,
  onDateChange,
  onReset,
  className,
}: DateTimePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isToday = useMemo(() => {
    return isSameDay(selectedDate, new Date());
  }, [selectedDate]);

  const isCurrentTime = useMemo(() => {
    const now = new Date();
    return (
      isToday &&
      selectedDate.getHours() === now.getHours() &&
      Math.abs(selectedDate.getMinutes() - now.getMinutes()) < 15
    );
  }, [selectedDate, isToday]);

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        // Preserve the time when changing date
        const newDate = setHours(
          setMinutes(date, selectedDate.getMinutes()),
          selectedDate.getHours()
        );
        onDateChange(newDate);
        setIsCalendarOpen(false);
      }
    },
    [selectedDate, onDateChange]
  );

  const handleHourChange = useCallback(
    (hour: string) => {
      const newDate = setHours(selectedDate, parseInt(hour, 10));
      onDateChange(newDate);
    },
    [selectedDate, onDateChange]
  );

  const handleMinuteChange = useCallback(
    (minute: string) => {
      const newDate = setMinutes(selectedDate, parseInt(minute, 10));
      onDateChange(newDate);
    },
    [selectedDate, onDateChange]
  );

  // Quick date buttons
  const quickDates = useMemo(() => {
    const today = startOfDay(new Date());
    return [
      { label: 'Today', date: today },
      { label: 'Tomorrow', date: addDays(today, 1) },
      { label: '+2 days', date: addDays(today, 2) },
      { label: '+7 days', date: addDays(today, 7) },
    ];
  }, []);

  const handleQuickDate = useCallback(
    (date: Date) => {
      // Preserve the time when using quick date
      const newDate = setHours(
        setMinutes(date, selectedDate.getMinutes()),
        selectedDate.getHours()
      );
      onDateChange(newDate);
    },
    [selectedDate, onDateChange]
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Planning indicator */}
      {!isCurrentTime && (
        <div className="flex items-center justify-between rounded-md bg-blue-50 dark:bg-blue-950 px-3 py-2 text-sm">
          <span className="text-blue-700 dark:text-blue-300">
            Planning for: {format(selectedDate, 'EEE d MMM, HH:mm')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Now
          </Button>
        </div>
      )}

      {/* Date picker */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Date</Label>
        <div className="flex gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'flex-1 justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'EEE, d MMMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => date < startOfDay(new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Quick date buttons */}
        <div className="flex gap-1">
          {quickDates.map((qd) => (
            <Button
              key={qd.label}
              variant={isSameDay(selectedDate, qd.date) ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => handleQuickDate(qd.date)}
            >
              {qd.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Time picker */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Time</Label>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedDate.getHours().toString()}
            onValueChange={handleHourChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">:</span>
          <Select
            value={(Math.floor(selectedDate.getMinutes() / 15) * 15).toString()}
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTES.map((minute) => (
                <SelectItem key={minute} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
