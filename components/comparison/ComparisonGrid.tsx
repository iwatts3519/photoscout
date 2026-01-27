'use client';

import { LocationComparisonCard } from './LocationComparisonCard';
import type {
  ComparisonLocation,
  ComparisonResult,
} from '@/src/types/comparison.types';

interface ComparisonGridProps {
  locations: ComparisonLocation[];
  result: ComparisonResult | null;
  onRemove: (locationId: string) => void;
}

export function ComparisonGrid({
  locations,
  result,
  onRemove,
}: ComparisonGridProps) {
  const count = locations.length;
  const categoryWinners = result?.categoryWinners ?? [];
  const overallWinnerId = result?.overallWinner?.id ?? null;

  // Responsive grid: 1 col on mobile, scale with count on desktop
  const gridCols =
    count <= 2
      ? 'lg:grid-cols-2'
      : count === 3
        ? 'lg:grid-cols-3'
        : 'lg:grid-cols-4';

  return (
    <div
      className={`grid grid-cols-1 gap-4 ${gridCols}`}
    >
      {locations.map((loc) => (
        <LocationComparisonCard
          key={loc.location.id}
          comparison={loc}
          categoryWinners={categoryWinners}
          isOverallWinner={loc.location.id === overallWinnerId}
          onRemove={() => onRemove(loc.location.id)}
        />
      ))}
    </div>
  );
}
