'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bell } from 'lucide-react';
import { useAlertStore } from '@/src/stores/alertStore';
import { AlertRuleForm } from './AlertRuleForm';
import { AlertRulesList } from './AlertRulesList';
import type { AlertRuleWithLocation } from '@/src/types/alerts.types';

interface AlertsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  locationId?: string;
  locationName?: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export function AlertsDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  locationId: propLocationId,
  locationName,
}: AlertsDialogProps) {
  const {
    isAlertDialogOpen,
    alertDialogLocationId,
    editingRuleId,
    openAlertDialog,
    closeAlertDialog,
    alertRules,
  } = useAlertStore();

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : isAlertDialogOpen;
  const locationId = propLocationId || alertDialogLocationId;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingRule, setEditingRule] = useState<AlertRuleWithLocation | null>(null);

  // Handle editing rule from store
  useEffect(() => {
    if (editingRuleId) {
      const rule = alertRules.find((r) => r.id === editingRuleId);
      if (rule) {
        setEditingRule(rule);
        setViewMode('edit');
      }
    }
  }, [editingRuleId, alertRules]);

  // Reset view mode when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setViewMode('list');
      setEditingRule(null);
    }
  }, [isOpen]);

  const handleOpenChange = (open: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(open);
    } else {
      if (open) {
        openAlertDialog(locationId || undefined);
      } else {
        closeAlertDialog();
      }
    }
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setViewMode('create');
  };

  const handleEdit = (rule: AlertRuleWithLocation) => {
    setEditingRule(rule);
    setViewMode('edit');
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setEditingRule(null);
  };

  const handleBack = () => {
    setViewMode('list');
    setEditingRule(null);
  };

  // Get title based on view mode
  const getTitle = () => {
    if (viewMode === 'create') return 'Create Alert';
    if (viewMode === 'edit') return 'Edit Alert';
    if (locationName) return `Alerts for ${locationName}`;
    return 'Weather Alerts';
  };

  const getDescription = () => {
    if (viewMode === 'create' || viewMode === 'edit') {
      return 'Configure when to receive notifications about photography conditions.';
    }
    return 'Get notified when conditions are ideal for photography.';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {viewMode !== 'list' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {getTitle()}
              </DialogTitle>
              <DialogDescription>{getDescription()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {viewMode === 'list' && (
          <AlertRulesList
            locationId={locationId || undefined}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
          />
        )}

        {viewMode === 'create' && (
          <AlertRuleForm
            locationId={locationId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
          />
        )}

        {viewMode === 'edit' && editingRule && (
          <AlertRuleForm
            locationId={editingRule.location_id}
            editingRule={editingRule}
            onSuccess={handleFormSuccess}
            onCancel={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Convenience component for triggering the alerts dialog
export function AlertsDialogTrigger({
  locationId,
  locationName,
  children,
}: {
  locationId?: string;
  locationName?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children ? (
        <div onClick={() => setOpen(true)}>{children}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          Alerts
        </Button>
      )}
      <AlertsDialog
        open={open}
        onOpenChange={setOpen}
        locationId={locationId}
        locationName={locationName}
      />
    </>
  );
}
