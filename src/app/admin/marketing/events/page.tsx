'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Calendar,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  ExternalLink,
  Star,
  Globe,
  ImageIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { MarketingEvent, EventStatus } from '@/types/marketing-cms.types';
import { MediaPickerModal } from '@/components/admin/marketing/MediaPickerModal';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function EventsManagementPage() {
  const [events, setEvents] = useState<MarketingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<MarketingEvent> | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [isCustomSlug, setIsCustomSlug] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/events');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsCustomSlug(false);
    setEditingEvent({
      name: '',
      slug: '',
      description: '',
      tagline: '',
      desktop_image_url: 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332865/zilyn2v87v4euwgjcm9a.jpg',
      event_date: '2026-10-18',
      start_time: '10:00 AM',
      end_time: '4:00 PM WAT',
      location: 'Radisson Blu Hotel, Victoria Island, Lagos',
      is_online: false,
      registration_url: '',
      cta_text: 'View Details',
      is_featured: true,
      status: 'upcoming',
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (event: MarketingEvent) => {
    setIsCustomSlug(true);
    setEditingEvent({ ...event });
    setIsEditorOpen(true);
  };

  const handleNameChange = (newName: string) => {
    if (!editingEvent) return;
    if (!isCustomSlug || !editingEvent.slug) {
      const autoSlug = slugify(newName);
      setEditingEvent({
        ...editingEvent,
        name: newName,
        slug: autoSlug,
      });
    } else {
      setEditingEvent({
        ...editingEvent,
        name: newName,
      });
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.name || !editingEvent.event_date || !editingEvent.desktop_image_url) {
      alert('Event name, date, and image are required.');
      return;
    }

    const payload = {
      ...editingEvent,
      slug: editingEvent.slug ? slugify(editingEvent.slug) : slugify(editingEvent.name),
    };

    try {
      const res = await fetch('/api/admin/marketing/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditorOpen(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        alert(data.error || 'Failed to save event');
      }
    } catch (err) {
      console.error('Save event error:', err);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/marketing/events?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Delete event error:', err);
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
            Community & Wellness Events
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create and manage informational brand workshops, wellness days, masterclasses, and event details.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-16 text-center text-xs text-text-muted">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="col-span-2 p-16 text-center space-y-3 bg-surface rounded-2xl border border-border">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">No events created yet</p>
            <p className="text-xs text-text-muted">Publish your first community wellness day or workshop.</p>
          </div>
        ) : (
          events.map(ev => (
            <div
              key={ev.id}
              className="bg-surface rounded-2xl border border-border/80 shadow-subtle hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] w-full bg-neutral-100 overflow-hidden border-b border-border/60">
                  <Image
                    src={ev.desktop_image_url}
                    alt={ev.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {ev.is_featured && (
                    <div className="absolute top-3 left-3 bg-brand text-white px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Featured Event</span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                    {ev.status}
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(ev.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} • {ev.start_time}</span>
                  </div>

                  <h3 className="font-display font-bold text-lg text-text-main">{ev.name}</h3>
                  <div className="flex items-center gap-1 text-[11px] text-text-muted font-mono bg-surface-muted px-2 py-0.5 rounded-md w-fit">
                    <LinkIcon className="w-3 h-3 text-brand" />
                    <span>/events/{ev.slug || ev.id}</span>
                  </div>
                  <p className="text-xs text-text-body/80 leading-relaxed line-clamp-2">{ev.description}</p>

                  <div className="space-y-1 text-xs text-text-muted pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 border-t border-border/60 bg-surface-muted/30 flex items-center justify-between">
                <a
                  href={`/events/${ev.slug || ev.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  <span>{ev.cta_text || 'View Details'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="p-2 rounded-xl bg-surface hover:bg-brand text-text-body hover:text-white border border-border text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteEvent(ev.id, ev.name)}
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingEvent && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-2xl border border-border shadow-2xl w-full max-w-2xl max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto flex-shrink-0">
            <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="font-display font-bold text-lg text-text-main">
                {editingEvent.id ? 'Edit Informational Event' : 'Create Informational Event'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1.5 rounded-lg hover:bg-surface-muted">✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. BloomingHer Wellness Day 2026"
                  value={editingEvent.name || ''}
                  onChange={e => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              {/* Automatic Professional Slug Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-text-main">Event URL Slug</label>
                  <span className="text-[10px] text-text-muted">Auto-generated from title</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[11px] text-text-muted font-mono select-none">
                    /events/
                  </span>
                  <input
                    type="text"
                    placeholder="bloomingher-wellness-day-2026"
                    value={editingEvent.slug || ''}
                    onChange={e => {
                      setIsCustomSlug(true);
                      setEditingEvent({ ...editingEvent, slug: slugify(e.target.value) });
                    }}
                    className="w-full pl-[62px] pr-3 py-2 bg-surface rounded-xl border border-border text-xs font-mono text-brand focus:outline-none focus:border-brand"
                  />
                </div>
                <p className="text-[10px] text-text-muted mt-1">
                  Preview: <span className="font-mono text-text-body">https://www.thebloomingher.com/events/{editingEvent.slug || slugify(editingEvent.name || 'event-title')}</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Event Tagline / Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Empower Your Cycle • Connect With Bloomies • Rejuvenate Your Spirit"
                  value={editingEvent.tagline || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Full Description *</label>
                <textarea
                  rows={4}
                  placeholder="Event itinerary, topics, pelvic health workshops, expert guest speakers, and what attendees will experience..."
                  value={editingEvent.description || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              {/* Event Image */}
              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Event Creative / Flyer *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingEvent.desktop_image_url || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, desktop_image_url: e.target.value })}
                    required
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-3 py-2 bg-surface hover:bg-brand-light text-brand border border-brand/20 rounded-xl text-xs font-semibold whitespace-nowrap"
                  >
                    Select Flyer
                  </button>
                </div>
              </div>

              {/* Date, Time & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Event Date *</label>
                  <input
                    type="date"
                    value={editingEvent.event_date || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Start Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM"
                    value={editingEvent.start_time || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, start_time: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">End Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 4:00 PM WAT"
                    value={editingEvent.end_time || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, end_time: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-main block mb-1">Location / Venue</label>
                <input
                  type="text"
                  placeholder="e.g. Radisson Blu Hotel, Victoria Island, Lagos & Online Livestream"
                  value={editingEvent.location || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                />
              </div>

              {/* Optional External Link & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Optional External Link</label>
                  <input
                    type="text"
                    placeholder="https://... (optional)"
                    value={editingEvent.registration_url || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, registration_url: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">CTA Text</label>
                  <input
                    type="text"
                    placeholder="e.g. View Details, Learn More"
                    value={editingEvent.cta_text || 'View Details'}
                    onChange={e => setEditingEvent({ ...editingEvent, cta_text: e.target.value })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Featured toggle & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-text-main block mb-1">Status</label>
                  <select
                    value={editingEvent.status || 'upcoming'}
                    onChange={e => setEditingEvent({ ...editingEvent, status: e.target.value as EventStatus })}
                    className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featEvent"
                    checked={editingEvent.is_featured || false}
                    onChange={e => setEditingEvent({ ...editingEvent, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded text-brand focus:ring-brand"
                  />
                  <label htmlFor="featEvent" className="text-xs font-semibold text-text-main cursor-pointer">
                    Feature on Homepage & Events Section
                  </label>
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
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={url => setEditingEvent(prev => prev ? { ...prev, desktop_image_url: url } : null)}
      />
    </div>
  );
}
