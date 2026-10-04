import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | TheBloomingHer Care & Wellness',
  description: 'How TheBloomingHer Care & Wellness collects, protects, and handles your personal information and orders in compliance with NDPR and global data privacy standards.',
  alternates: {
    canonical: '/policies/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="font-display font-bold text-3xl text-text-main">Privacy Policy</h1>
        <p className="text-xs text-text-muted">Last updated: September 2026</p>
      </div>

      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border space-y-6 text-sm text-text-body leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">1. Information We Collect</h2>
          <p>
            When you purchase from <strong>TheBloomingHer Care & Wellness</strong>, we collect necessary order details:
          </p>
          <ul className="list-disc list-inside space-y-1 text-text-muted pl-2">
            <li><strong>Customer Details:</strong> Name, email address, and phone number for delivery updates.</li>
            <li><strong>Delivery Address:</strong> Street address, city, and state for accurate shipping.</li>
            <li><strong>Transactional Data:</strong> Payment confirmation and order reference IDs processed securely via Flutterwave.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">2. Payment Security</h2>
          <p>
            We <strong>never store or have access to your credit/debit card numbers, CVVs, or bank PINs</strong>. All financial transactions are processed securely through PCI-DSS Level 1 certified payment gateway <strong>Flutterwave</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">3. Anonymous Browsing & Analytics</h2>
          <p>
            To personalize product discovery and optimize storefront performance, we collect non-personally identifiable behavioral telemetry (such as anonymous session IDs and category view patterns). We do not record sensitive medical data or private customer diagnoses.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">4. Data Sharing & Third Parties</h2>
          <p>
            We do not sell, rent, or trade your personal data. We only share delivery details with verified dispatch and courier partners (such as Lagos logistics couriers) to fulfill your physical order.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-semibold text-lg text-text-main">5. Contact Us</h2>
          <p>
            If you have questions regarding your data, privacy, or wish to request data deletion, contact us at:
            <br />
            <strong>Email:</strong> thebloomingherwellness@gmail.com
            <br />
            <strong>Location:</strong> 30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria
          </p>
        </section>
      </div>
    </div>
  );
}
