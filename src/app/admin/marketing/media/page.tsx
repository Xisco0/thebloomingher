'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Upload,
  Search,
  Trash2,
  ExternalLink,
  ImageIcon,
  Folder,
  Layers,
  Info,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import { MediaAsset } from '@/types/marketing-cms.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [usageData, setUsageData] = useState<any[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, [selectedFolder]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedFolder !== 'all') params.set('folder', selectedFolder);

      const res = await fetch(`/api/admin/marketing/media?${params.toString()}`);
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
      formData.append('folder', selectedFolder !== 'all' ? selectedFolder : 'banners');

      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.success && uploadData.url) {
        const registerRes = await fetch('/api/admin/marketing/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            url: uploadData.url,
            file_size_bytes: file.size,
            mime_type: file.type,
            folder: selectedFolder !== 'all' ? selectedFolder : 'banners',
          }),
        });
        const registerData = await registerRes.json();
        if (registerData.success) {
          fetchMedia();
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAsset = async (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setUsageLoading(true);
    try {
      const res = await fetch(`/api/admin/marketing/media/usage?url=${encodeURIComponent(asset.url)}`);
      const data = await res.json();
      if (data.success) {
        setUsageData(data.usage || []);
      }
    } catch (err) {
      console.error('Usage check failed:', err);
    } finally {
      setUsageLoading(false);
    }
  };

  const handleDeleteMedia = async (id: string, filename: string) => {
    if (usageData.length > 0) {
      if (!confirm(`Warning: "${filename}" is currently used in ${usageData.length} active location(s). Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    }

    try {
      const res = await fetch(`/api/admin/marketing/media?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMedia(prev => prev.filter(m => m.id !== id));
        setSelectedAsset(null);
      }
    } catch (err) {
      console.error('Delete media error:', err);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const filtered = media.filter(
    m =>
      m.filename.toLowerCase().includes(search.toLowerCase()) ||
      m.alt_text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <MarketingSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Content & Marketing CMS
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Centralized Media Library
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Store, search, reuse, and inspect high-resolution images across banners, campaigns, and events.
          </p>
        </div>

        <label className="cursor-pointer px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-surface rounded-2xl border border-border shadow-subtle flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by filename or tag..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-muted/50 rounded-xl border border-border text-xs text-text-main placeholder-text-muted focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedFolder}
            onChange={e => setSelectedFolder(e.target.value)}
            className="px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="all">All Folders</option>
            <option value="banners">Banners & Hero</option>
            <option value="events">Events & Workshops</option>
            <option value="products">Product Highlights</option>
            <option value="branding">Branding & Logos</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Grid + Side Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gallery Grid (8 or 12 Cols) */}
        <div className={`${selectedAsset ? 'lg:col-span-8' : 'lg:col-span-12'} bg-surface rounded-2xl border border-border shadow-subtle p-5`}>
          {loading ? (
            <div className="p-16 text-center text-xs text-text-muted">Loading media assets...</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-text-main">No media assets found</p>
              <p className="text-xs text-text-muted">Upload an image to start populating your gallery.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map(item => {
                const isSelected = selectedAsset?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectAsset(item)}
                    className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all aspect-square bg-surface-muted flex flex-col justify-end p-2.5 ${
                      isSelected
                        ? 'border-brand ring-2 ring-brand/20 shadow-md'
                        : 'border-border/80 hover:border-brand/40'
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt_text || item.filename}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    <div className="relative z-10 bg-black/70 backdrop-blur-xs rounded-xl p-2 text-white space-y-0.5">
                      <p className="text-[11px] font-semibold truncate">{item.filename}</p>
                      <p className="text-[9px] text-white/70">{(item.file_size_bytes / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Inspector Drawer (4 Cols) */}
        {selectedAsset && (
          <div className="lg:col-span-4 bg-surface rounded-2xl border border-border shadow-subtle p-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-display font-bold text-sm text-text-main flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-brand" />
                  <span>Asset Inspector</span>
                </h3>
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="p-1 rounded-lg hover:bg-surface-muted text-text-muted text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Preview Thumbnail */}
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-neutral-100 border border-border">
                <Image
                  src={selectedAsset.url}
                  alt={selectedAsset.filename}
                  fill
                  sizes="400px"
                  className="object-contain"
                />
              </div>

              {/* File Info */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Filename</span>
                  <span className="font-semibold text-text-main truncate block">{selectedAsset.filename}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Size</span>
                    <span className="font-semibold text-text-main">{(selectedAsset.file_size_bytes / 1024).toFixed(0)} KB</span>
                  </div>
                  <div>
                    <span className="text-text-muted block text-[10px] uppercase font-bold">Dimensions</span>
                    <span className="font-semibold text-text-main">{selectedAsset.width || 1200} × {selectedAsset.height || 800}</span>
                  </div>
                </div>

                <div>
                  <span className="text-text-muted block text-[10px] uppercase font-bold">Folder</span>
                  <span className="font-semibold text-text-main capitalize">{selectedAsset.folder || 'General'}</span>
                </div>
              </div>

              {/* "Used In" Usage Tracking */}
              <div className="pt-3 border-t border-border/80 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand block">
                  Usage Tracking ({usageData.length} locations)
                </span>

                {usageLoading ? (
                  <p className="text-[11px] text-text-muted">Checking references...</p>
                ) : usageData.length === 0 ? (
                  <p className="text-[11px] text-text-muted italic">This asset is not currently linked in any live banners or events.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {usageData.map((u, i) => (
                      <div key={i} className="p-2 rounded-lg bg-surface-muted/50 text-[11px] border border-border/60">
                        <span className="font-bold text-text-main">{u.type}:</span> {u.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={() => handleCopyUrl(selectedAsset.url)}
                className="w-full py-2 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied to Clipboard!' : 'Copy Direct URL'}</span>
              </button>

              <button
                onClick={() => handleDeleteMedia(selectedAsset.id, selectedAsset.filename)}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Asset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
