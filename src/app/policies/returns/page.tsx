import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Refunds Policy | TheBloomingHer Care & Wellness',
  description: 'Our hygiene-first return standards, 48-hour damaged order reporting window, and refund processing guidelines.',
  alternates: {
    canonical: 'https://thebloomingher.com/policies/returns',
  },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl text-text-main">Returns, Exchanges & Refunds</h1>
        <p className="text-xs text-text-muted">Health & Hygiene Protocol</p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border space-y-6 text-sm text-text-body leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">1. Personal & Hygiene Products</h2>
          <p>
            For health and hygiene reasons, opened or used intimate, menstrual, skincare, body-care, and other personal-care products cannot be returned or exchanged unless they arrived damaged, defective, or were incorrectly supplied.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">2. Damaged or Defective Orders (48-Hour Window)</h2>
          <p>
            If something isn&apos;t right with your order, please contact us within <strong>48 hours of delivery</strong>. Kindly provide your order number and clear photos or a short video of the issue via WhatsApp at <strong>+2348103641002</strong> or email at <strong>thebloomingherwellness@gmail.com</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">3. Unopened Items</h2>
          <p>
            Unopened and unused items in their original intact packaging may be considered for return or exchange within <strong>3 days of delivery</strong>, subject to inspection.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">4. Refund Processing Timeline</h2>
          <p>
            Approved refunds are processed within <strong>3 to 5 business days</strong> back to your original payment method via Paystack.
          </p>
        </section>
      </div>
    </div>
  );
}
