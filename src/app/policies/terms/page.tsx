import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | TheBloomingHer Care & Wellness',
  description: 'Terms and conditions governing orders, deliveries, hygiene standards, and customer care at TheBloomingHer Care & Wellness Nigeria.',
  alternates: {
    canonical: 'https://thebloomingher.com/policies/terms',
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl text-text-main">Terms & Conditions</h1>
        <p className="text-xs text-text-muted">Last updated: September 2026</p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border space-y-6 text-sm text-text-body leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">1. General Overview</h2>
          <p>
            Welcome to <strong>TheBloomingHer Care & Wellness</strong>. By accessing our website, placing an order, or utilizing our services, you agree to be bound by the following terms and conditions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">2. Orders & Pricing</h2>
          <p>
            All prices are listed in <strong>Nigerian Naira (₦ NGN)</strong>. We reserve the right to correct any pricing errors prior to dispatch. Order fulfillment is subject to stock availability. Free Lagos delivery applies automatically to eligible orders exceeding <strong>₦40,000</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">3. Health & Wellness Disclaimer</h2>
          <p>
            Products offered by TheBloomingHer Care & Wellness (including cycle care kits, herbal teas, body balms, and heating belts) are designed for comfort, wellness, and self-care. They are <strong>not intended to diagnose, treat, cure, or prevent any medical condition</strong>. Please consult your physician or licensed healthcare provider for medical concerns.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">4. Delivery & Pickup</h2>
          <p>
            Deliveries within Lagos are typically completed within 24 to 48 hours. Store pickup is available during business hours at <strong>30 Clem Rd, Ifako-Ijaiye, Lagos</strong>. Customers will be notified once pickup orders are packaged and ready.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">5. Governing Law</h2>
          <p>
            These terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
          </p>
        </section>
      </div>
    </div>
  );
}
