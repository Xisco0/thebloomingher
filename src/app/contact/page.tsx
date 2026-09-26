import React from 'react';
import type { Metadata } from 'next';
import { MapPin, Phone, MessageCircle, Mail, Clock, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact & Store Location | TheBloomingHer Care & Wellness Lagos',
  description:
    'Visit our Lagos pickup location at 30 Clem Rd, Ifako-Ijaiye, Lagos. Contact us via WhatsApp at +2348103641002 or email.',
  alternates: {
    canonical: 'https://thebloomingher.com/contact',
  },
  openGraph: {
    title: 'Contact & Store Location | TheBloomingHer Care & Wellness Lagos',
    description:
      'Visit our Lagos pickup location at 30 Clem Rd, Ifako-Ijaiye, Lagos. Contact us via WhatsApp at +2348103641002 or email.',
    url: 'https://thebloomingher.com/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          We Care About You
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-main">
          Get In Touch & Visit Us
        </h1>
        <p className="text-sm text-text-muted">
          Have questions about our cycle kits, delivery options, or need personal recommendations? We are here to help!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* WhatsApp Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-base text-text-main">WhatsApp Support</h3>
          <p className="text-xs text-text-muted">Fast response for inquiries and direct ordering.</p>
          <a
            href="https://wa.me/2348103641002"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold text-emerald-700 hover:underline pt-2"
          >
            +234 810 364 1002 →
          </a>
        </div>

        {/* Physical Address Card */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-base text-text-main">Lagos Pickup Hub</h3>
          <p className="text-xs text-text-muted">30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria.</p>
          <span className="text-xs font-bold text-brand block pt-2">Store Pickup Available</span>
        </div>

        {/* Email Support */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center mx-auto">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-base text-text-main">Email Concierge</h3>
          <p className="text-xs text-text-muted">Order support and wholesale inquiries.</p>
          <a
            href="mailto:thebloomingherwellness@gmail.com"
            className="inline-block text-xs font-bold text-brand hover:underline pt-2"
          >
            thebloomingherwellness@gmail.com
          </a>
        </div>

        {/* Operating Hours */}
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-subtle text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="font-display font-semibold text-base text-text-main">Opening Hours</h3>
          <p className="text-xs text-text-muted">Monday – Saturday: 8:00 AM – 6:00 PM</p>
          <p className="text-xs text-text-muted">Sunday: WhatsApp Dispatch Support</p>
        </div>
      </div>
    </div>
  );
}
