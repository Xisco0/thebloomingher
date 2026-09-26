import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { cmsService } from '@/services';

export const metadata: Metadata = {
  title: 'Community & Wellness Events | TheBloomingHer Care & Wellness',
  description:
    'Join our doctor-led pelvic health workshops, menstrual cycle masterclasses, and community self-care days across Lagos, Nigeria.',
  alternates: {
    canonical: '/events',
  },
};

export const revalidate = 3600;

export default async function EventsPage() {
  const events = await cmsService.getEvents();

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3" data-aos="fade-up">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Empowering Nigerian Women
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-5xl text-text-main">
          Wellness Events & Workshops
        </h1>
        <p className="text-sm sm:text-base text-text-body/90 leading-relaxed">
          Learn, connect, and nurture your body with health experts, sound bath therapists, and fellow Bloomies.
        </p>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {events.map((ev, idx) => (
          <div
            key={ev.id}
            data-aos="fade-up"
            data-aos-delay={idx * 100}
            className="bg-surface rounded-3xl border border-border/80 shadow-subtle hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-neutral-100 overflow-hidden">
                <Image
                  src={ev.desktop_image_url}
                  alt={ev.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-brand text-white font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                  {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main">
                  {ev.name}
                </h2>
                {ev.tagline && (
                  <p className="text-xs font-semibold text-brand italic">{ev.tagline}</p>
                )}
                <p className="text-xs sm:text-sm text-text-body leading-relaxed">{ev.description}</p>

                <div className="space-y-2 text-xs text-text-muted pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand flex-shrink-0" />
                    <span>{ev.start_time} {ev.end_time ? `– ${ev.end_time}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                    <span>{ev.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0">
              <Link
                href={`/events/${ev.slug || ev.id}`}
                className="w-full py-3.5 bg-brand hover:bg-brand-hover text-white rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <span>View Details</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
