'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Megaphone,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MarketingAnnouncement, AnnouncementPlacement } from '@/types/marketing-cms.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

export default function AnnouncementsManagementPage() {
  const [announcements, setAnnouncements] = useState<MarketingAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<MarketingAnnouncement> | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/announcements');
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAnnouncement({
      message: '',
      link_url: '/products',
      link_text: 'Shop Now',
      placement: 'top_bar',
      bg_color: '#FAF5F7',
      text_color: '#B85D88',
      is_closable: true,
      status: 'active',
      priority_order: announcements.length + 1,
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (ann: MarketingAnnouncement) => {
    setEditingAnnouncement({ ...ann });
    setIsEditorOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement?.message) {
      alert('Announcement message is required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/marketing/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAnnouncement),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
      } else {
        alert(data.error || 'Failed to save announcement');
      }
    } catch (err) {
      console.error('Save announcement error:', err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/admin/marketing/announcements?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error('Delete announcement error:', err);
    }
  };

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
            Store Announcements
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Display urgent notices, shipping thresholds, and restock alerts across top bars and banner popups.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-text-muted">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Megaphone className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No announcements created</p>
            <p className="text-xs text-text-muted">Create a top announcement bar to notify customers of promotions.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {announcements.map((ann, idx) => (
              <div
                key={ann.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-surface-muted/30 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-light text-brand font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-text-main capitalize">
                      {ann.placement.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${ann.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                      {ann.status}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-text-main leading-snug">
                    {ann.message}
                  </p>

                  {ann.link_url && (
                    <p className="text-xs text-brand">
                      Action Link: <span className="underline font-semibold">{ann.link_text || 'Learn More'}</span> ({ann.link_url})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-2 rounded-xl bg-surface hover:bg-brand text-text-body hover:text-white border border-border text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Drawer */}
      {isEditorOpen && editingAnnouncement && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-xl max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex-shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="font-display font-bold text-lg text-text-main">
                {editingAnnouncement.id ? 'Edit Announcement' : 'Create Announcement'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-muted">✕</button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Announcement Message *</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Free Lagos Doorstep Delivery on orders above ₦40,000 | Same-Day Dispatch Available"
                  value={editingAnnouncement.message || ''}
                  onChange={e => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Target Placement</label>
                  <select
                    value={editingAnnouncement.placement || 'top_bar'}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, placement: e.target.value as AnnouncementPlacement })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="top_bar">Top Announcement Bar (Global Header)</option>
                    <option value="homepage_section">Homepage Highlight Notice</option>
                    <option value="inline_banner">Inline Store Banner</option>
                    <option value="modal_popup">Modal Popup Notice</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Status</label>
                  <select
                    value={editingAnnouncement.status || 'active'}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Action Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Now, Read More"
                    value={editingAnnouncement.link_text || ''}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, link_text: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Action URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /products or /about"
                    value={editingAnnouncement.link_url || ''}
                    onChange={e => setEditingAnnouncement({ ...editingAnnouncement, link_url: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text-body hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
