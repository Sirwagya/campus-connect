'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface ImageUploadProps {
  /** Bucket to upload to */
  bucket: string;
  /** Path within the bucket */
  path?: string;
  /** Callback when upload completes */
  onUpload: (url: string) => void;
  /** Callback on error */
  onError?: (error: string) => void;
  /** Current image URL (for preview) */
  currentUrl?: string;
  /** Accepted file types */
  accept?: string;
  /** Max file size in MB */
  maxSizeMB?: number;
  /** Whether to show a circular preview (for avatars) */
  circular?: boolean;
  /** Custom className */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function ImageUpload({
  bucket,
  path = '',
  onUpload,
  onError,
  currentUrl,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxSizeMB = 5,
  circular = false,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      onError?.(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      onError?.('Invalid file type');
      return;
    }

    const validationError: string | null = null;
    if (validationError) {
      onError?.(validationError);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Simulate progress (Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);
      onUpload(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [bucket, path, onUpload, onError, maxSizeMB, accept]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [disabled, uploadFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      <div
        onClick={() => !disabled && !isUploading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative group cursor-pointer transition-all
          ${circular ? 'rounded-full' : 'rounded-lg'}
          ${isDragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {displayUrl ? (
          <div className={`relative overflow-hidden ${circular ? 'rounded-full' : 'rounded-lg'} ${circular ? 'w-full aspect-square' : 'w-full aspect-video'}`}>
            <Image
              src={displayUrl}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized={displayUrl.startsWith('data:')}
            />
            {!isUploading && !disabled && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-center text-white">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Change image</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={`
            border-2 border-dashed border-white/20 p-8 text-center
            hover:border-primary/50 hover:bg-white/5 transition-all
            ${circular ? 'rounded-full aspect-square flex items-center justify-center' : 'rounded-lg'}
          `}>
            <div className="text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {!circular && (
                <>
                  <p className="text-sm font-medium text-white mb-1">
                    Drop an image or click to upload
                  </p>
                  <p className="text-xs">
                    {accept.split(',').map(t => t.replace('image/', '').toUpperCase()).join(', ')} up to {maxSizeMB}MB
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upload progress overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute inset-0 bg-black/80 flex items-center justify-center ${circular ? 'rounded-full' : 'rounded-lg'}`}
            >
              <div className="text-center text-white">
                <div className="w-12 h-12 mx-auto mb-2 relative">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={`${progress * 1.26} 126`}
                      className="text-primary transition-all"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    {progress}%
                  </span>
                </div>
                <p className="text-sm">Uploading...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Multiple image upload component
interface MultiImageUploadProps {
  bucket: string;
  path?: string;
  onUpload: (urls: string[]) => void;
  onError?: (error: string) => void;
  currentUrls?: string[];
  maxImages?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function MultiImageUpload({
  bucket,
  path = '',
  onUpload,
  onError,
  currentUrls = [],
  maxImages = 4,
  maxSizeMB = 5,
  disabled = false,
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentUrls);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList) => {
    const remainingSlots = maxImages - images.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    if (filesToUpload.length === 0) {
      onError?.(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          onError?.(`${file.name} exceeds ${maxSizeMB}MB limit`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      const updatedImages = [...images, ...newUrls];
      setImages(updatedImages);
      onUpload(updatedImages);
    } catch (error) {
      console.error('Upload error:', error);
      onError?.('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onUpload(updatedImages);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {images.map((url, index) => (
          <div key={url} className="relative aspect-video rounded-lg overflow-hidden group">
            <Image src={url} alt="" fill className="object-cover" />
            {!disabled && (
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {images.length < maxImages && !disabled && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="aspect-video rounded-lg border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 transition-all flex items-center justify-center"
          >
            {isUploading ? (
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={(e) => e.target.files && handleUpload(e.target.files)}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      <p className="text-xs text-gray-500 text-center">
        {images.length}/{maxImages} images • Max {maxSizeMB}MB each
      </p>
    </div>
  );
}
