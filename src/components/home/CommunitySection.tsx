'use client';

import React, { useState } from 'react';
import { MessageCircle, Mail, CheckCircle2 } from 'lucide-react';
import { generateWhatsAppSupportLink } from '@/lib/utils/whatsapp';

export function CommunitySection() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const whatsappUrl = generateWhatsAppSupportLink();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-brand-light/30 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6" data-aos="fade-up">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Join The Circle
        </span>
        <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          Nurture yourself. Naturally.
        </h2>
        <p className="text-sm text-text-body max-w-lg mx-auto leading-relaxed">
          Sign up to receive exclusive discounts, cycle care tips, restock notifications, and new self-care guides.
        </p>

        {subscribed ? (
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            <span>Thank you for joining our Blooming Community! 🌸</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-surface rounded-full border border-border text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-brand shadow-xs"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-full text-sm font-semibold shadow-md transition-colors whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        )}

        <div className="pt-2">
          <p className="text-xs text-text-muted">
            Prefer instant personal assistance?{' '}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 inline" />
              <span>Chat directly with Hannah on WhatsApp</span>
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
