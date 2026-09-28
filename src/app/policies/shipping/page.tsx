import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | TheBloomingHer Care & Wellness',
  description: 'Delivery timelines for Lagos, nationwide shipping rates in Nigeria, and Free Delivery on orders above ₦40,000.',
  alternates: {
    canonical: 'https://thebloomingher.com/policies/shipping',
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl text-text-main">Shipping & Delivery Information</h1>
        <p className="text-xs text-text-muted">Last updated: September 2026</p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border space-y-6 text-sm text-text-body leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">1. Free Lagos Delivery (Above ₦40,000)</h2>
          <p>
            All orders with a subtotal of <strong>₦40,000 or above</strong> automatically qualify for Free Standard Delivery across all Lagos State Local Government Areas.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">2. Lagos Delivery Timelines & Rates</h2>
          <p>
            For orders under ₦40,000, a flat delivery fee of <strong>₦2,500</strong> applies within Lagos State. Orders placed before 12:00 PM are dispatched for delivery within <strong>24 to 48 hours</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">3. Free Store Pickup Location</h2>
          <p>
            Customers may select <strong>Free Store Pickup</strong> at checkout. Pickup is available Monday through Saturday (8:00 AM – 6:00 PM) at:
            <br />
            <strong>30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria.</strong>
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">4. Nationwide Interstate Shipping (Nigeria)</h2>
          <p>
            We ship to all states across Nigeria including Abuja, Port Harcourt, Ibadan, and Enugu via trusted logistics partners. Interstate deliveries typically arrive in <strong>2 to 5 business days</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
