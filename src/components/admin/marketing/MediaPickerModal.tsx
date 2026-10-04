'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Upload, Search, Check, ImageIcon } from 'lucide-react';
import { MediaAsset } from '@/types/marketing-cms.types';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string, asset?: MediaAsset) => void;
  title?: string;
  recommendedAspect?: string; // e.g. "16:9 for Desktop, 4:5 for Mobile"
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Image from Media Library',
  recommendedAspect,
}: MediaPickerModalProps) {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [customUrl, setCustomUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/media');
      const data = await res.json();
      if (data.success) {
        setMedia(data.media || []);
      }
    } catch (err) {
      console.error('Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'banners');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        // Register in media library
        const registerRes = await fetch('/api/admin/marketing/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            url: uploadData.url,
            file_size_bytes: file.size,
            mime_type: file.type,
            folder: 'banners',
          }),
        });
        const registerData = await registerRes.json();

        if (registerData.success && registerData.asset) {
          setMedia(prev => [registerData.asset, ...prev]);
          setSelectedUrl(uploadData.url);
        } else {
          setSelectedUrl(uploadData.url);
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const filteredMedia = media.filter(
    m =>
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const handleConfirm = () => {
    const chosen = customUrl.trim() || selectedUrl;
    if (!chosen) return;
    const asset = media.find(m => m.url === chosen);
    onSelect(chosen, asset);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
      <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex-shrink-0">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-lg text-text-main flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand" />
              <span>{title}</span>
            </h3>
            {recommendedAspect && (
              <p className="text-xs text-text-muted mt-0.5">
                Recommended aspect ratio: <span className="font-semibold text-brand">{recommendedAspect}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-muted text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-surface-muted/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search images by name or tag..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="flex-1 sm:flex-initial cursor-pointer px-4 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="py-20 text-center text-xs text-text-muted">Loading media assets...</div>
          ) : filteredMedia.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-text-main">No media found</p>
              <p className="text-xs text-text-muted">Upload an image or paste a direct image URL below.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredMedia.map(item => {
                const isSelected = selectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedUrl(item.url);
                      setCustomUrl('');
                    }}
                    className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-surface-muted flex flex-col justify-end p-2 ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 shadow-md'
                        : 'border-border/80 hover:border-brand/40'
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt_text || item.filename}
                      fill
                      sizes="200px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand text-white flex items-center justify-center shadow-md z-10">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Overlay metadata */}
                    <div className="relative z-10 bg-black/60 backdrop-blur-xs rounded-lg p-1.5 text-[10px] text-white truncate">
                      {item.filename}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct URL entry & Footer */}
        <div className="p-4 border-t border-border bg-surface-muted/20 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:flex-1 flex items-center gap-2">
            <span className="text-xs text-text-muted whitespace-nowrap">Or Direct URL:</span>
            <input
              type="url"
              placeholder="https://images.unsplash.com/... or /images/logo.jpg"
              value={customUrl}
              onChange={e => {
                setCustomUrl(e.target.value);
                setSelectedUrl('');
              }}
              className="w-full px-3 py-1.5 bg-surface rounded-xl border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-body hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedUrl && !customUrl.trim()}
              className="px-5 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              Use Selected Image
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
