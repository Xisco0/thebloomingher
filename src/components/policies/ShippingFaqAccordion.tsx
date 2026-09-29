'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { generateWhatsAppSupportLink } from '@/lib/utils/whatsapp';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does Same-Day Delivery in Lagos work?',
    answer: (
      <p>
        Orders placed and payment confirmed <strong>before 12:00 PM (WAT)</strong> from Monday through Saturday qualify for <strong>Same-Day Doorstep Delivery</strong> within Lagos. Orders placed after 12:00 PM or on Sundays are dispatched for delivery within <strong>24 to 48 hours</strong>.
      </p>
    ),
  },
  {
    question: 'How do I qualify for Free Lagos Delivery?',
    answer: (
      <p>
        All orders with a subtotal of <strong>₦40,000 or above</strong> automatically unlock <strong>Free Standard Doorstep Delivery</strong> to any location across Lagos State. No coupon code is required.
      </p>
    ),
  },
  {
    question: 'What are your delivery rates for orders under ₦40,000?',
    answer: (
      <p>
        For orders under ₦40,000, we offer a flat delivery fee of <strong>₦2,500</strong> anywhere within Lagos State. Nationwide interstate delivery to other states is calculated based on destination at checkout.
      </p>
    ),
  },
  {
    question: 'Do you ship to other states outside Lagos (Nationwide Shipping)?',
    answer: (
      <p>
        Yes, nationwide shipping is available! We deliver across all 36 Nigerian states and the FCT (Abuja, Port Harcourt, Ibadan, Kano, Enugu, Calabar, etc.) via verified interstate logistics couriers. Deliveries typically arrive within <strong>2 to 5 business days</strong>.
      </p>
    ),
  },
  {
    question: 'Where can I pick up my order for free?',
    answer: (
      <p>
        You can choose <strong>Free Store Pickup</strong> during checkout. Pickups are available Monday to Saturday (8:00 AM – 6:00 PM) at our Lagos pickup hub:
        <br />
        <strong className="text-text-main">30 Clem Rd, Ifako-Ijaiye, Lagos 101232, Lagos, Nigeria.</strong>
      </p>
    ),
  },
  {
    question: 'Is the delivery packaging 100% discreet?',
    answer: (
      <p>
        Yes, absolutely. We prioritize your dignity, comfort, and privacy. All menstrual and intimate wellness products are packaged in <strong>100% plain, unbranded exterior parcel boxes or opaque security bags</strong> with no mention of item names on the outside.
      </p>
    ),
  },
  {
    question: 'How do I track my order or request instant updates?',
    answer: (
      <p>
        Once your order is dispatched, our logistics team notifies you via SMS/WhatsApp. You can also click <strong>Chat on WhatsApp</strong> or message us directly with your order number for real-time delivery status.
      </p>
    ),
  },
];

export function ShippingFaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const whatsappUrl = generateWhatsAppSupportLink();

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-brand" />
        <h2 className="font-display font-semibold text-xl text-text-main">
          Frequently Asked Questions (Delivery & Shipping FAQs)
        </h2>
      </div>

      <div className="divide-y divide-border border border-border rounded-2xl bg-surface overflow-hidden">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="transition-colors">
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full py-4 px-5 sm:px-6 flex justify-between items-center text-left hover:bg-brand-light/30 transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                <span className="font-display font-semibold text-sm sm:text-base text-text-main pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-brand' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm text-text-body/90 leading-relaxed bg-brand-light/10 border-t border-border/50">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-emerald-950">Have another question about your delivery?</p>
          <p className="text-xs text-emerald-800">Our concierge support team is online to assist you.</p>
        </div>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 fill-white text-transparent" />
          <span>Chat on WhatsApp</span>
        </a>
      </div>
    </div>
  );
}
