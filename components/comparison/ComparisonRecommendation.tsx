'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, Navigation, Star } from 'lucide-react';
import { useMapStore } from '@/src/stores/mapStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  ComparisonLocation,
  ComparisonResult,
} from '@/src/types/comparison.types';

interface ComparisonRecommendationProps {
  result: ComparisonResult;
  locations: ComparisonLocation[];
}

export function ComparisonRecommendation({
  result,
  locations,
}: ComparisonRecommendationProps) {
  const router = useRouter();
  const setCenter = useMapStore((state) => state.setCenter);
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setZoom = useMapStore((state) => state.setZoom);

  const { overallWinner, recommendation, tradeoffs } = result;

  if (!overallWinner || !recommendation) {
    return null;
  }

  const winnerLocation = locations.find(
    (loc) => loc.location.id === overallWinner.id
  );

  const handleViewOnMap = () => {
    if (winnerLocation) {
      setCenter(winnerLocation.coordinates);
      setSelectedLocation(winnerLocation.coordinates);
      setZoom(14);
      router.push('/');
      toast.success(`${overallWinner.name} centered on map`);
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-3 flex-1">
          <div>
            <h3 className="font-medium text-sm">Recommendation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {recommendation}
            </p>
          </div>

          {tradeoffs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Trade-offs
              </h4>
              <ul className="space-y-0.5">
                {tradeoffs.map((tradeoff, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                  >
                    <span className="text-muted-foreground/50 mt-0.5">-</span>
                    {tradeoff}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {winnerLocation && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewOnMap}
              className="h-7 text-xs"
            >
              <Star className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" />
              <Navigation className="h-3 w-3 mr-1" />
              View {overallWinner.name} on Map
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
