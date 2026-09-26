import React from 'react';
import { ShieldCheck, Truck, CreditCard, RefreshCw } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: ShieldCheck,
      title: 'Trusted Quality',
      subtitle: 'Only the best for your body',
    },
    {
      icon: Truck,
      title: 'Fast Lagos Delivery',
      subtitle: 'Across Lagos & Nationwide',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      subtitle: 'Powered by Paystack',
    },
    {
      icon: RefreshCw,
      title: 'Hassle-Free Support',
      subtitle: 'Direct WhatsApp assistance',
    },
  ];

  return (
    <section className="bg-surface border-y border-border py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
      <div className="w-[85%] max-w-[85%] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div 
              key={i} 
              className="flex items-center gap-3 p-2 rounded-xl"
              data-aos="fade-up"
              data-aos-delay={i * 75}
            >
              <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="font-semibold text-xs sm:text-sm text-text-main leading-tight">{b.title}</h4>
                <p className="text-[11px] text-text-muted mt-0.5">{b.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
