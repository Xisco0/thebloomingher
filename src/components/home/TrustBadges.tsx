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
    <section className="bg-surface border-y border-border py-6 px-3 sm:px-6 lg:px-8 shadow-xs">
      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {badges.map((b, i) => {
          const Icon = b.icon;
          return (
            <div 
              key={i} 
              className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:p-2 rounded-xl min-w-0"
              data-aos="fade-up"
              data-aos-delay={i * 75}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h4 className="font-semibold text-xs sm:text-sm text-text-main leading-tight truncate">{b.title}</h4>
                <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 line-clamp-2">{b.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
