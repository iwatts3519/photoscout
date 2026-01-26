'use client';

import type { UploadStatus } from '@/src/types/photo.types';

interface UploadProgressProps {
  progress: number;
  status: UploadStatus;
  className?: string;
}

export function UploadProgress({ progress, status, className = '' }: UploadProgressProps) {
  // Don't show progress for completed or error states
  if (status === 'completed' || status === 'error') {
    return null;
  }

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-amber-500';
      default:
        return 'bg-primary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return `Uploading... ${progress}%`;
      case 'processing':
        return 'Processing...';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{getStatusText()}</span>
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getStatusColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
