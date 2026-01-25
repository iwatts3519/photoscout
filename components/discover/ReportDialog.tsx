'use client';

import { useState, useTransition } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { submitReport } from '@/lib/queries/community';
import { useAuth } from '@/src/hooks/useAuth';
import { toast } from 'sonner';
import {
  REPORT_REASONS,
  reportReasonLabels,
  type ReportReason,
} from '@/src/types/community.types';

interface ReportDialogProps {
  locationId: string;
  locationName: string;
}

export function ReportDialog({ locationId, locationName }: ReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  const handleSubmit = () => {
    if (!user) {
      toast.error('Sign in required', {
        description: 'You must be signed in to report locations.',
      });
      return;
    }

    if (!reason) {
      toast.error('Please select a reason');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        await submitReport(
          supabase,
          locationId,
          reason,
          details.trim() || undefined
        );

        toast.success('Report submitted', {
          description: 'Thank you for helping keep PhotoScout safe.',
        });

        setIsOpen(false);
        setReason(null);
        setDetails('');
      } catch (error) {
        toast.error('Failed to submit report', {
          description:
            error instanceof Error ? error.message : 'Please try again later.',
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Report this location">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Location</DialogTitle>
          <DialogDescription>
            Report &quot;{locationName}&quot; for violating community guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Reason for reporting *</Label>
            <RadioGroup
              value={reason || ''}
              onValueChange={(v) => setReason(v as ReportReason)}
            >
              {REPORT_REASONS.map((r) => (
                <div key={r} className="flex items-center space-x-3">
                  <RadioGroupItem value={r} id={`reason-${r}`} />
                  <Label htmlFor={`reason-${r}`} className="cursor-pointer">
                    {reportReasonLabels[r]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              placeholder="Provide any additional context..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !reason}
            variant="destructive"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
