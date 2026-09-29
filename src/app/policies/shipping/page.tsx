import React from 'react';
import type { Metadata } from 'next';
import { Truck, Clock, MapPin, ShieldCheck, Gift } from 'lucide-react';
import { ShippingFaqAccordion } from '@/components/policies/ShippingFaqAccordion';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | TheBloomingHer Care & Wellness',
  description: 'Same-day delivery in Lagos for orders placed before 12pm. Other orders dispatched within 24-48 hours. Nationwide shipping available across Nigeria.',
  alternates: {
    canonical: 'https://thebloomingher.com/policies/shipping',
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs uppercase tracking-wider text-brand font-bold block">
          Delivery Information & FAQ
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-main">
          Shipping & Delivery Policy
        </h1>
        <p className="text-xs text-text-muted">
          Reliable, discreet, and fast doorstep delivery across Lagos and all Nigerian states.
        </p>
      </div>

      {/* Main Highlights Banner */}
      <div className="bg-gradient-to-r from-brand-light via-surface to-brand-light/50 rounded-3xl p-6 sm:p-8 border border-brand/20 shadow-xs">
        <div className="flex items-center gap-3 mb-3">
          <Truck className="w-6 h-6 text-brand flex-shrink-0" />
          <h2 className="font-display font-bold text-lg sm:text-xl text-text-main">
            Our Delivery Commitment
          </h2>
        </div>
        <p className="text-sm sm:text-base font-medium text-brand-dark leading-relaxed">
          &ldquo;Same-day delivery in Lagos for orders placed before 12pm. Other orders dispatched within 24-48 hours. Nationwide shipping available.&rdquo;
        </p>
      </div>

      {/* Structured Policy Sections */}
      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border space-y-8 text-sm text-text-body leading-relaxed">
        {/* Section 1: Lagos Same-Day & Standard Delivery */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-main">
            <Clock className="w-5 h-5 text-brand flex-shrink-0" />
            <h2 className="font-display font-semibold text-lg">1. Lagos Delivery Timelines & Rates</h2>
          </div>
          <p>
            We prioritize fast fulfillment for all wellness essentials. Orders placed and confirmed <strong>before 12:00 PM (WAT)</strong> Monday through Saturday qualify for <strong>Same-Day Delivery</strong> across Lagos State. Orders placed after 12:00 PM are dispatched for delivery within <strong>24 to 48 hours</strong>.
          </p>
          <p>
            For orders below ₦40,000, a standard flat delivery fee of <strong>₦2,500</strong> applies within Lagos.
          </p>
        </section>

        {/* Section 2: Free Lagos Delivery (Above ₦40,000) */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-main">
            <Gift className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <h2 className="font-display font-semibold text-lg">2. Free Lagos Delivery (Orders Above ₦40,000)</h2>
          </div>
          <p>
            All orders with a subtotal of <strong>₦40,000 or above</strong> automatically qualify for <strong>100% Free Doorstep Delivery</strong> across all Lagos State Local Government Areas. This discount is applied automatically in your shopping cart without requiring any promo code.
          </p>
        </section>

        {/* Section 3: Nationwide Interstate Shipping */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-main">
            <Truck className="w-5 h-5 text-brand flex-shrink-0" />
            <h2 className="font-display font-semibold text-lg">3. Nationwide Interstate Shipping (All Nigerian States)</h2>
          </div>
          <p>
            We ship nationwide to all states across Nigeria, including Abuja (FCT), Port Harcourt, Ibadan, Kano, Kaduna, Benin City, Enugu, and Calabar via trusted interstate courier partners.
          </p>
          <p>
            Nationwide interstate deliveries typically arrive within <strong>2 to 5 business days</strong>. Tracking details and dispatch updates are sent via WhatsApp/SMS upon package handover.
          </p>
        </section>

        {/* Section 4: Free Store Pickup */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-main">
            <MapPin className="w-5 h-5 text-brand flex-shrink-0" />
            <h2 className="font-display font-semibold text-lg">4. Free Store Pickup Location</h2>
          </div>
          <p>
            Customers in Lagos may select <strong>Free Store Pickup</strong> at checkout. Pickup is available Monday through Saturday (8:00 AM – 6:00 PM) at our physical facility:
          </p>
          <div className="p-4 rounded-2xl bg-surface-muted border border-border text-xs sm:text-sm font-medium text-text-main">
            📍 <strong>TheBloomingHer Care & Wellness</strong><br />
            30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria.
          </div>
        </section>

        {/* Section 5: 100% Discreet Packaging */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-text-main">
            <ShieldCheck className="w-5 h-5 text-brand flex-shrink-0" />
            <h2 className="font-display font-semibold text-lg">5. 100% Discreet & Secure Packaging</h2>
          </div>
          <p>
            We respect your privacy. All intimate care items, period wellness kits, and cramp relief belts are sent in <strong>plain, discrete, unbranded exterior parcel boxes or opaque tamper-evident packaging</strong>. There is no mention of intimate health products on the exterior label.
          </p>
        </section>
      </div>

      {/* Interactive FAQ Section */}
      <div className="pt-4">
        <ShippingFaqAccordion />
      </div>
    </div>
  );
}
