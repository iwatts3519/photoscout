'use client';

import { useCallback, useState, useRef } from 'react';
import { Upload, ImagePlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePhotoUpload, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '@/src/hooks/usePhotoUpload';
import { UploadQueue } from './UploadQueue';
import { formatFileSize } from '@/lib/supabase/storage';

interface PhotoUploaderProps {
  className?: string;
  compact?: boolean;
}

export function PhotoUploader({ className = '', compact = false }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { addFiles, uploadAll, queue, isUploading } = usePhotoUpload();

  const handleFileSelect = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      await addFiles(fileArray);
      // Auto-start upload
      uploadAll();
    },
    [addFiles, uploadAll]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        handleFileSelect(files);
      }
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const acceptTypes = ALLOWED_MIME_TYPES.join(',');

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          multiple
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload photos"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isUploading}
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>
        {queue.length > 0 && (
          <div className="mt-2">
            <UploadQueue compact />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        multiple
        onChange={handleInputChange}
        className="hidden"
        aria-label="Upload photos"
      />

      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center gap-4
          cursor-pointer transition-all
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <div
          className={`
            rounded-full p-4 transition-colors
            ${isDragging ? 'bg-primary/10' : 'bg-muted'}
          `}
        >
          <Upload
            className={`h-8 w-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`}
          />
        </div>

        <div className="text-center">
          <p className="font-medium">
            {isDragging ? 'Drop photos here' : 'Drag and drop photos here'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>
            JPEG, PNG, WebP up to {formatFileSize(MAX_FILE_SIZE)}
          </span>
        </div>
      </div>

      {/* Upload queue */}
      {queue.length > 0 && (
        <div className="mt-4">
          <UploadQueue />
        </div>
      )}
    </div>
  );
}
