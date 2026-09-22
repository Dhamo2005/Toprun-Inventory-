import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  HardDrive
} from 'lucide-react';
import { api } from '../lib/apiClient.ts';

interface ImageFileUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  label?: string;
  helperText?: string;
}

export const ImageFileUpload: React.FC<ImageFileUploadProps> = ({
  currentImageUrl = '',
  onImageChange,
  label = 'Part Image File Handler',
  helperText = 'Files are uploaded directly to and served from the local server storage'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const processFile = async (file: File) => {
    setUploadError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files (PNG, JPG, WEBP, SVG, GIF) are supported');
      return;
    }

    // Validate file size (15MB limit)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image file size must be less than 15MB');
      return;
    }

    setFileDetails({
      name: file.name,
      size: formatFileSize(file.size)
    });

    setIsUploading(true);
    try {
      const result = await api.uploadPartImage(file);
      onImageChange(result.imageUrl);
      setUploadError(null);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload image file to server');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleTriggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange('');
    setFileDetails(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isServerStored = currentImageUrl.startsWith('/uploads/');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <HardDrive className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{label}</span>
        </label>
        {isServerStored && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-3 w-3" />
            Stored on Server
          </span>
        )}
      </div>

      {/* Hidden native file input handled via click/drop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/gif"
        onChange={handleFileChange}
        className="hidden"
        id="part-image-file-input"
      />

      {/* Main Upload Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleTriggerBrowse}
        className={`relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed transition-all p-4 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/30 scale-[1.01]'
            : currentImageUrl
            ? 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 hover:border-indigo-400'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-400 hover:bg-indigo-50/20'
        }`}
      >
        {currentImageUrl ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview Thumbnail */}
            <div className="relative aspect-video sm:aspect-square w-full sm:w-28 h-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-2xs">
              <img
                src={currentImageUrl}
                alt="Part hardware"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-white">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                </div>
              )}
            </div>

            {/* Image Details & Replace Action */}
            <div className="flex-1 min-w-0 text-left space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate block">
                  {fileDetails?.name || currentImageUrl.split('/').pop() || 'Hardware Image'}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  title="Remove image"
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                <p className="font-mono truncate">{currentImageUrl}</p>
                {fileDetails && (
                  <p className="font-medium text-slate-600 dark:text-slate-300">Size: {fileDetails.size}</p>
                )}
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerBrowse();
                  }}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 shadow-2xs"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Choose Another File</span>
                </button>
                <span className="text-[10px] text-slate-400">or drop a replacement</span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Dropzone State */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              {isUploading ? 'Uploading file to server storage...' : 'Click to select image or drag and drop'}
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              Direct file handler for PNG, JPG, WEBP, SVG (stored on server, max 15MB)
            </p>
          </div>
        )}
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Helper caption */}
      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {helperText}
      </p>
    </div>
  );
};
