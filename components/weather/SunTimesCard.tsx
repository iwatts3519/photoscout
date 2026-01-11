'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSunTimes, formatTime } from '@/lib/utils/sun-calculations';
import { Sunrise, Sunset, Clock } from 'lucide-react';

interface SunTimesCardProps {
  lat: number;
  lng: number;
  date?: Date;
}

export function SunTimesCard({ lat, lng, date = new Date() }: SunTimesCardProps) {
  const times = getSunTimes(date, lat, lng);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5" />
          Sun Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sunrise */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunrise className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Sunrise</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatTime(times.sunrise)}
          </span>
        </div>

        {/* Sunset */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sunset className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Sunset</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatTime(times.sunset)}
          </span>
        </div>

        {/* Golden Hour Morning */}
        <div className="space-y-1 rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Morning Golden Hour
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-amber-800 dark:text-amber-200">
            <span>{formatTime(times.goldenHourMorning)}</span>
            <span>→</span>
            <span>{formatTime(times.goldenHourMorningEnd)}</span>
          </div>
        </div>

        {/* Golden Hour Evening */}
        <div className="space-y-1 rounded-md bg-orange-50 p-3 dark:bg-orange-950/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
              Evening Golden Hour
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-orange-800 dark:text-orange-200">
            <span>{formatTime(times.goldenHourEvening)}</span>
            <span>→</span>
            <span>{formatTime(times.goldenHourEveningEnd)}</span>
          </div>
        </div>

        {/* Blue Hours */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Blue Hour (Morning)</span>
            <span>
              {formatTime(times.nauticalDawn)} → {formatTime(times.sunrise)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Blue Hour (Evening)</span>
            <span>
              {formatTime(times.sunset)} → {formatTime(times.nauticalDusk)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
