'use client';

import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotoUpload } from '@/src/hooks/usePhotoUpload';
import { UploadPreview } from './UploadPreview';

interface UploadQueueProps {
  compact?: boolean;
  className?: string;
}

export function UploadQueue({ compact = false, className = '' }: UploadQueueProps) {
  const {
    queue,
    removeFromQueue,
    retryUpload,
    clearCompleted,
    pendingCount,
    completedCount,
    errorCount,
    isUploading,
    uploadAll,
  } = usePhotoUpload();

  if (queue.length === 0) {
    return null;
  }

  const hasCompletedOrError = completedCount > 0 || errorCount > 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">
          {isUploading ? (
            <span className="text-blue-600">Uploading...</span>
          ) : pendingCount > 0 ? (
            <span>{pendingCount} pending</span>
          ) : completedCount === queue.length ? (
            <span className="text-green-600">All uploads complete</span>
          ) : (
            <span>
              {completedCount} completed
              {errorCount > 0 && <span className="text-destructive">, {errorCount} failed</span>}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {pendingCount > 0 && !isUploading && (
            <Button variant="outline" size="sm" onClick={uploadAll}>
              Upload All
            </Button>
          )}
          {hasCompletedOrError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompleted}
              className="text-muted-foreground"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Queue list */}
      <div className={`space-y-2 ${compact ? 'max-h-48 overflow-y-auto' : ''}`}>
        {queue.map((item) => (
          <UploadPreview
            key={item.id}
            item={item}
            onRemove={() => removeFromQueue(item.id)}
            onRetry={() => retryUpload(item.id)}
            compact={compact}
          />
        ))}
      </div>

      {/* Summary for completed uploads */}
      {!compact && completedCount > 0 && completedCount === queue.length && (
        <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 dark:text-green-400">
              {completedCount} photo{completedCount === 1 ? '' : 's'} uploaded successfully
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
