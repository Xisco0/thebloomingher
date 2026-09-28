import React from 'react';
import { Star, CheckCircle, Quote } from 'lucide-react';
import { CustomerTestimonial } from '@/types';

interface TestimonialsSectionProps {
  testimonials: CustomerTestimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-14 sm:py-20 w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14" data-aos="fade-up">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
          Real Stories
        </span>
        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
          What Our Customers Say
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mt-2">
          Trusted by hundreds of women across Lagos, Abuja, and Nigeria for everyday care.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, index) => (
          <div
            key={t.id}
            data-aos="fade-up"
            data-aos-delay={index * 100}
            className="bg-surface rounded-2xl p-6 sm:p-7 border border-border/80 shadow-subtle hover:shadow-card-hover transition-all relative flex flex-col justify-between"
          >
            <Quote className="w-8 h-8 text-brand-light absolute top-5 right-5" />

            <div className="space-y-4">
              <div className="flex text-gold">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-text-body leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="pt-6 border-t border-border/50 flex items-center justify-between mt-6">
              <div>
                <h4 className="font-semibold text-sm text-text-main">{t.customerName}</h4>
                {t.location && <p className="text-xs text-text-muted">{t.location}</p>}
              </div>

              {t.verifiedPurchase && (
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified Buyer</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
