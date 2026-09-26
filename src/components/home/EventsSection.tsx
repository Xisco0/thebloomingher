import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { MarketingEvent } from '@/types/marketing-cms.types';

interface EventsSectionProps {
  events: MarketingEvent[];
}

export function EventsSection({ events }: EventsSectionProps) {
  if (!events || events.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
      <div className="flex justify-between items-end mb-8" data-aos="fade-up">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            Community & Masterclasses
          </span>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            Upcoming Wellness Events
          </h2>
        </div>
        <Link
          href="/events"
          className="text-xs sm:text-sm font-semibold text-brand hover:text-brand-hover flex items-center gap-1 group"
        >
          <span>View All Events</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.slice(0, 2).map((ev, idx) => (
          <div
            key={ev.id}
            data-aos="fade-up"
            data-aos-delay={idx * 100}
            className="group bg-surface rounded-3xl border border-border/80 shadow-subtle hover:shadow-card-hover transition-all overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
                <Image
                  src={ev.desktop_image_url}
                  alt={ev.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-brand/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="font-display font-bold text-xl text-text-main group-hover:text-brand transition-colors">
                  {ev.name}
                </h3>
                <p className="text-xs sm:text-sm text-text-body/80 leading-relaxed line-clamp-2">
                  {ev.description}
                </p>

                <div className="space-y-1 text-xs text-text-muted pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand" />
                    <span>{ev.start_time} {ev.end_time ? `– ${ev.end_time}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 pt-0">
              <Link
                href={`/events/${ev.slug || ev.id}`}
                className="w-full py-3 bg-brand hover:bg-brand-hover text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
