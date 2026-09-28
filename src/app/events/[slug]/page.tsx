import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, ArrowLeft, ExternalLink, Sparkles, Clock } from 'lucide-react';
import { cmsService } from '@/services';

interface EventPageProps {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const event = await cmsService.getEventById(params.slug);
  if (!event) {
    return {
      title: 'Event Not Found | TheBloomingHer Care & Wellness',
    };
  }

  return {
    title: `${event.name} | TheBloomingHer Events`,
    description: event.description || 'Join us for wellness events and workshops by TheBloomingHer.',
    alternates: {
      canonical: `/events/${event.slug || params.slug}`,
    },
    openGraph: {
      title: event.name,
      description: event.description,
      images: [event.desktop_image_url],
    },
  };
}

export default async function EventDetailsPage({ params }: EventPageProps) {
  const event = await cmsService.getEventById(params.slug);
  if (!event) {
    notFound();
  }

  const allEvents = await cmsService.getActiveEvents();
  const relatedEvents = allEvents.filter(e => e.id !== event.id && e.slug !== event.slug).slice(0, 2);

  const formattedDate = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Back to Events Navigation */}
      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand hover:text-brand-hover hover:underline transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Events</span>
        </Link>
      </div>

      {/* Main Event Article Card */}
      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-subtle">
        {/* Responsive Cover Image Banner with Mobile-First Proportions */}
        <div className="relative min-h-[260px] sm:min-h-[360px] lg:min-h-[440px] aspect-[4/3] sm:aspect-[21/9] lg:aspect-[2.4/1] w-full bg-neutral-900 overflow-hidden">
          {/* Desktop Image */}
          <div className="hidden sm:block absolute inset-0">
            <Image
              src={event.desktop_image_url}
              alt={event.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* Dedicated Mobile Creative */}
          <div className="block sm:hidden absolute inset-0">
            <Image
              src={event.mobile_image_url || event.desktop_image_url}
              alt={event.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          {/* High-Contrast Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />

          {/* Event Title & Badge Overlay (Optimized for Mobile Viewports) */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-10 text-white space-y-2 sm:space-y-2.5 z-10">
            {/* Category / Status Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-md">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Wellness Event</span>
            </div>

            {/* Event Name */}
            <h1 className="font-display font-bold text-xl sm:text-3xl lg:text-4xl drop-shadow-md leading-tight sm:leading-tight">
              {event.name}
            </h1>

            {/* Tagline */}
            {event.tagline && (
              <p className="text-xs sm:text-sm lg:text-base text-white/90 italic font-medium drop-shadow-sm max-w-2xl line-clamp-2 sm:line-clamp-none">
                {event.tagline}
              </p>
            )}
          </div>
        </div>

        {/* Event Meta Details Strip (Grid adapts cleanly on mobile) */}
        <div className="p-4 sm:p-8 lg:p-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6 bg-surface-muted/50 border-b border-border">
          <div className="flex items-center sm:items-start gap-3 bg-surface sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-border/60">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-text-muted tracking-wider block">Date</span>
              <span className="text-xs sm:text-sm font-bold text-text-main">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3 bg-surface sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-border/60">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-text-muted tracking-wider block">Time</span>
              <span className="text-xs sm:text-sm font-bold text-text-main">
                {event.start_time} {event.end_time ? `– ${event.end_time}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3 bg-surface sm:bg-transparent p-3 sm:p-0 rounded-2xl sm:rounded-none border sm:border-0 border-border/60">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] uppercase font-bold text-text-muted tracking-wider block">Location</span>
              <span className="text-xs sm:text-sm font-bold text-text-main">{event.location || 'Lagos, Nigeria'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <h2 className="font-display font-bold text-lg sm:text-xl text-text-main">About This Event</h2>
            <div className="prose prose-sm sm:prose text-text-body leading-relaxed space-y-4">
              <p className="whitespace-pre-line text-xs sm:text-sm lg:text-base leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          {/* Organizer & Additional External Info */}
          <div className="pt-5 sm:pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs">
                🌸
              </div>
              <div>
                <span className="text-xs font-bold text-text-main block">Organized by TheBloomingHer</span>
                <span className="text-[10px] sm:text-[11px] text-text-muted">Care, Comfort & Holistic Female Wellness</span>
              </div>
            </div>

            {event.registration_url && !event.registration_url.startsWith('/events') && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-surface hover:bg-surface-muted text-brand border border-brand/20 rounded-full text-xs font-semibold shadow-xs transition-colors"
              >
                <span>External Information Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Related Events Section */}
      {relatedEvents.length > 0 && (
        <div className="space-y-4 sm:space-y-6 pt-4">
          <h3 className="font-display font-bold text-lg sm:text-xl text-text-main">Other Upcoming Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {relatedEvents.map(rel => (
              <Link
                key={rel.id}
                href={`/events/${rel.slug || rel.id}`}
                className="group bg-surface rounded-2xl border border-border p-4 sm:p-5 hover:border-brand/40 shadow-xs hover:shadow-md transition-all flex gap-3.5 sm:gap-4"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                  <Image
                    src={rel.desktop_image_url}
                    alt={rel.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                  <span className="text-[10px] text-brand font-bold uppercase tracking-wider block">
                    {new Date(rel.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <h4 className="font-display font-bold text-xs sm:text-sm text-text-main group-hover:text-brand transition-colors line-clamp-1">
                    {rel.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-text-muted line-clamp-2">{rel.description}</p>
                  <span className="text-[11px] sm:text-xs text-brand font-semibold inline-block pt-0.5">
                    View Details &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
