'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, X, Loader2, Image as ImageIcon, AlertCircle, Check } from 'lucide-react';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: 'products' | 'categories' | 'banners' | 'users' | 'blog' | 'uploads';
  maxFiles?: number;
  label?: string;
  description?: string;
}

export function ImageUploader({
  value = [],
  onChange,
  folder = 'products',
  maxFiles = 6,
  label = 'Product Images',
  description = 'Upload JPG, PNG, WebP or AVIF images up to 10MB each.',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const availableSlots = maxFiles - value.length;
    if (availableSlots <= 0) {
      setError(`Maximum of ${maxFiles} images reached.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setUploading(true);

    const newUploadedUrls: string[] = [];

    try {
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newUploadedUrls.push(data.url);
      }

      onChange([...value, ...newUploadedUrls]);
    } catch (err: any) {
      console.error('[Image Upload Error]:', err);
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (indexToRemove: number) => {
    const urlToRemove = value[indexToRemove];
    const newUrls = value.filter((_, idx) => idx !== indexToRemove);
    onChange(newUrls);

    // Optional background delete from R2
    try {
      if (urlToRemove && !urlToRemove.includes('cloudinary.com') && !urlToRemove.includes('unsplash.com')) {
        await fetch('/api/admin/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToRemove }),
        });
      }
    } catch (e) {
      console.warn('Failed to delete image from R2 in background:', e);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-text-main uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-text-muted">
          {value.length} / {maxFiles} images
        </span>
      </div>

      {description && <p className="text-xs text-text-muted">{description}</p>}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone */}
      {value.length < maxFiles && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-brand bg-brand-light/40 scale-[1.01]'
              : 'border-border hover:border-brand/50 bg-surface hover:bg-surface-muted'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-xs font-medium text-text-main">
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-main">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    WebP, PNG, JPG or AVIF (Max 10MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Previews Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {value.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-surface-muted shadow-xs"
            >
              <Image
                src={url}
                alt={`Image preview ${idx + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />

              {/* Badge for Primary / Cover Image */}
              {idx === 0 && (
                <span className="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                  Primary
                </span>
              )}

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-red-600 hover:text-white text-text-main rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
