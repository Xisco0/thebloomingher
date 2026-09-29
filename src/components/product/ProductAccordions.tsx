'use client';

import React, { useState } from 'react';
import { ChevronDown, Sparkles, CheckCircle2, ShieldCheck, Truck } from 'lucide-react';
import { Product } from '@/types';

interface ProductAccordionsProps {
  product: Product;
}

export function ProductAccordions({ product }: ProductAccordionsProps) {
  const [openSection, setOpenSection] = useState<string | null>('benefits');

  const toggle = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sections = [
    {
      id: 'benefits',
      title: 'Key Benefits & Features',
      content: (
        <div className="space-y-2 text-sm text-text-body">
          <p>{product.description}</p>
          <ul className="space-y-1.5 pt-2">
            {product.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'usage',
      title: 'How to Use & Care Instructions',
      content: (
        <p className="text-sm text-text-body leading-relaxed">
          {product.how_to_use || 'Use as part of your daily self-care routine. Clean gently after use and store in a cool, dry place away from direct moisture.'}
        </p>
      ),
    },
    {
      id: 'ingredients',
      title: 'Specifications & Materials',
      content: (
        <p className="text-sm text-text-body leading-relaxed">
          {product.ingredients || 'Crafted with premium, skin-friendly, hygienic materials tested for safety and everyday comfort.'}
        </p>
      ),
    },
    {
      id: 'delivery',
      title: 'Delivery, Shipping & Returns',
      content: (
        <div className="space-y-3 text-sm text-text-body">
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <p>
              <strong>Lagos & Nationwide Delivery:</strong> Same-day delivery in Lagos for orders placed before 12pm. Other orders dispatched within 24-48 hours. Nationwide shipping available across Nigeria.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Free Lagos Delivery:</strong> Automatically applied on all orders of <strong>₦40,000</strong> and above.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <p>
              <strong>Hygiene & Returns:</strong> 100% discrete plain packaging. For health & safety standards, opened personal hygiene items cannot be returned. Defective or damaged items must be reported within 48 hours for an instant replacement.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions (FAQ)',
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-text-body">
          <div className="space-y-1">
            <p className="font-semibold text-text-main">Q: How fast will I receive my order?</p>
            <p className="text-text-muted">A: Orders placed in Lagos before 12:00 PM are delivered same-day. Orders placed after 12:00 PM arrive within 24–48 hours. Interstate deliveries to other states take 2–5 business days.</p>
          </div>
          <div className="space-y-1 pt-1 border-t border-border/50">
            <p className="font-semibold text-text-main">Q: Is the package discreet?</p>
            <p className="text-text-muted">A: Yes, 100%. All items are sent in plain, discreet, unbranded exterior packaging with complete privacy.</p>
          </div>
          <div className="space-y-1 pt-1 border-t border-border/50">
            <p className="font-semibold text-text-main">Q: Can I pick up at the store or order via WhatsApp?</p>
            <p className="text-text-muted">A: Yes! Free Store Pickup is available at 30 Clem Rd, Ifako-Ijaiye, Lagos. You can also click &ldquo;Order on WhatsApp&rdquo; or &ldquo;Chat on WhatsApp&rdquo; to complete your order with our concierge.</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="border-t border-border mt-8 divide-y divide-border">
      {sections.map(sec => {
        const isOpen = openSection === sec.id;
        return (
          <div key={sec.id} className="py-4">
            <button
              onClick={() => toggle(sec.id)}
              className="w-full flex justify-between items-center text-left font-display font-semibold text-sm sm:text-base text-text-main hover:text-brand transition-colors focus:outline-none"
            >
              <span>{sec.title}</span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                  isOpen ? 'rotate-180 text-brand' : ''
                }`}
              />
            </button>

            {isOpen && <div className="pt-3 pb-1">{sec.content}</div>}
          </div>
        );
      })}
    </div>
  );
}
