import React from 'react';
import { Heart, ShieldCheck, Truck, HeartHandshake } from 'lucide-react';

export function WhyTheBloomingHer() {
  const pillars = [
    {
      icon: Heart,
      title: 'Carefully Curated',
      description: 'Every product is handpicked for genuine everyday usefulness, hygiene safety, and real comfort.',
    },
    {
      icon: ShieldCheck,
      title: '100% Authentic Quality',
      description: 'Direct relationships with certified suppliers for premium menstrual, wellness, and self-care items.',
    },
    {
      icon: Truck,
      title: 'Fast & Reliable Delivery',
      description: '24–48 hour dispatch across Lagos with Free Delivery on orders above ₦40,000, plus nationwide shipping.',
    },
    {
      icon: HeartHandshake,
      title: 'Hassle-Free Support',
      description: 'Dedicated WhatsApp concierge with Hannah for prompt, personal assistance with every order.',
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-surface border-y border-border/80">
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14" data-aos="fade-up">
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            Our Care Promise
          </span>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text-main">
            Why TheBloomingHer?
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2">
            Because your care matters. We are here to make self-care personal, accessible, and dependable.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                data-aos="fade-up"
                data-aos-delay={idx * 80}
                className="p-6 rounded-2xl bg-background border border-border/60 hover:border-brand/30 transition-all flex flex-col items-center text-center space-y-3 group"
              >
                <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-base text-text-main">
                  {item.title}
                </h3>
                <p className="text-xs text-text-body/80 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
