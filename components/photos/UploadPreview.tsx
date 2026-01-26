'use client';

import { CheckCircle2, AlertCircle, Loader2, Clock, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UploadProgress } from './UploadProgress';
import type { UploadQueueItem, ExifCameraData } from '@/src/types/photo.types';
import { formatFileSize } from '@/lib/supabase/storage';

/**
 * Get camera name combining make and model
 */
function getCameraName(camera: ExifCameraData | null): string | null {
  if (!camera) {
    return null;
  }

  const { make, model } = camera;

  if (!make && !model) {
    return null;
  }

  if (!make) {
    return model;
  }

  if (!model) {
    return make;
  }

  // If model already includes make, just return model
  if (model.toLowerCase().startsWith(make.toLowerCase())) {
    return model;
  }

  return `${make} ${model}`;
}

interface UploadPreviewProps {
  item: UploadQueueItem;
  onRemove: () => void;
  onRetry: () => void;
  compact?: boolean;
}

export function UploadPreview({
  item,
  onRemove,
  onRetry,
  compact = false,
}: UploadPreviewProps) {
  const { file, status, progress, error, exif, preview } = item;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const cameraName = exif?.camera ? getCameraName(exif.camera) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
        {/* Thumbnail */}
        {preview && (
          <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
            <img
              src={preview}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{file.name}</p>
          {status !== 'completed' && status !== 'error' && (
            <UploadProgress progress={progress} status={status} className="mt-1" />
          )}
          {error && (
            <p className="text-xs text-destructive truncate">{error}</p>
          )}
        </div>

        {/* Status/Actions */}
        <div className="flex-shrink-0">
          {status === 'error' ? (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRetry}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          ) : (
            getStatusIcon()
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 p-3 rounded-lg border bg-card">
      {/* Thumbnail */}
      {preview && (
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formatFileSize(file.size)}</span>
              {cameraName && (
                <>
                  <span>·</span>
                  <span className="truncate">{cameraName}</span>
                </>
              )}
            </div>
          </div>

          {/* Status icon and actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {getStatusIcon()}
            {(status === 'pending' || status === 'error' || status === 'completed') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {status !== 'completed' && status !== 'error' && (
          <UploadProgress progress={progress} status={status} className="mt-2" />
        )}

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" className="h-6 text-xs" onClick={onRetry}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Success message */}
        {status === 'completed' && (
          <p className="text-xs text-green-600 mt-1">Upload complete</p>
        )}
      </div>
    </div>
  );
}
