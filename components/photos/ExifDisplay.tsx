'use client';

import { Camera, Aperture, Timer, SunDim, Ruler } from 'lucide-react';
import type { UserPhoto } from '@/src/types/photo.types';
import { getCameraDisplayName, getSettingsString } from '@/src/types/photo.types';
import { formatFileSize } from '@/lib/supabase/storage';

interface ExifDisplayProps {
  photo: UserPhoto;
  compact?: boolean;
}

export function ExifDisplay({ photo, compact = false }: ExifDisplayProps) {
  const cameraName = getCameraDisplayName(photo);
  const hasSettings = photo.focal_length || photo.aperture || photo.shutter_speed || photo.iso;

  if (!cameraName && !hasSettings && !photo.width) {
    return null;
  }

  if (compact) {
    const settingsString = getSettingsString(photo);
    return (
      <div className="text-xs text-muted-foreground space-y-0.5">
        {cameraName && (
          <p className="flex items-center gap-1">
            <Camera className="h-3 w-3" />
            <span className="truncate">{cameraName}</span>
          </p>
        )}
        {settingsString && <p>{settingsString}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Camera Info</h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Camera */}
        {cameraName && (
          <div className="flex items-start gap-2">
            <Camera className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Camera</p>
              <p className="text-sm">{cameraName}</p>
            </div>
          </div>
        )}

        {/* Focal Length */}
        {photo.focal_length && (
          <div className="flex items-start gap-2">
            <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Focal Length</p>
              <p className="text-sm">{photo.focal_length}</p>
            </div>
          </div>
        )}

        {/* Aperture */}
        {photo.aperture && (
          <div className="flex items-start gap-2">
            <Aperture className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Aperture</p>
              <p className="text-sm">{photo.aperture}</p>
            </div>
          </div>
        )}

        {/* Shutter Speed */}
        {photo.shutter_speed && (
          <div className="flex items-start gap-2">
            <Timer className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Shutter Speed</p>
              <p className="text-sm">{photo.shutter_speed}</p>
            </div>
          </div>
        )}

        {/* ISO */}
        {photo.iso && (
          <div className="flex items-start gap-2">
            <SunDim className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">ISO</p>
              <p className="text-sm">{photo.iso}</p>
            </div>
          </div>
        )}

        {/* Dimensions */}
        {photo.width && photo.height && (
          <div className="flex items-start gap-2">
            <div className="h-4 w-4 flex items-center justify-center text-muted-foreground mt-0.5">
              <span className="text-xs font-medium">px</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dimensions</p>
              <p className="text-sm">
                {photo.width} × {photo.height}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>
          {formatFileSize(photo.file_size)} · {photo.mime_type.replace('image/', '').toUpperCase()}
        </p>
      </div>
    </div>
  );
}
