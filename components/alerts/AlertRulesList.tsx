'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Loader2, AlertCircle } from 'lucide-react';
import { fetchAlertRulesWithLocations } from '@/app/actions/alerts';
import { useAlertStore } from '@/src/stores/alertStore';
import { AlertRuleCard } from './AlertRuleCard';
import type { AlertRuleWithLocation } from '@/src/types/alerts.types';

interface AlertRulesListProps {
  locationId?: string;
  onCreateNew?: () => void;
  onEdit?: (rule: AlertRuleWithLocation) => void;
}

export function AlertRulesList({
  locationId,
  onCreateNew,
  onEdit,
}: AlertRulesListProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { alertRules, setAlertRules, setIsLoadingRules } = useAlertStore();

  // Filter rules by location if specified
  const filteredRules = locationId
    ? alertRules.filter((rule) => rule.location_id === locationId)
    : alertRules;

  useEffect(() => {
    async function loadAlertRules() {
      setIsLoading(true);
      setIsLoadingRules(true);
      setError(null);

      try {
        const { data, error: fetchError } = await fetchAlertRulesWithLocations();

        if (fetchError) {
          setError(fetchError);
        } else if (data) {
          setAlertRules(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts');
      }

      setIsLoading(false);
      setIsLoadingRules(false);
    }

    loadAlertRules();
  }, [setAlertRules, setIsLoadingRules]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (filteredRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No alerts yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">
          {locationId
            ? 'Create an alert to get notified when conditions are ideal for photography at this location.'
            : 'Create alerts to get notified when conditions are ideal for photography at your saved locations.'}
        </p>
        {onCreateNew && (
          <Button onClick={onCreateNew} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with create button */}
      {onCreateNew && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredRules.length} alert{filteredRules.length !== 1 ? 's' : ''}
          </p>
          <Button onClick={onCreateNew} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
      )}

      {/* Alert cards */}
      {filteredRules.map((rule) => (
        <AlertRuleCard
          key={rule.id}
          rule={rule}
          onEdit={onEdit ? () => onEdit(rule) : undefined}
        />
      ))}
    </div>
  );
}
