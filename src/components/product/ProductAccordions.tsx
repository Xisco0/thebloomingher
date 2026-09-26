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
      title: 'Lagos Delivery & Return Policy',
      content: (
        <div className="space-y-2 text-sm text-text-body">
          <div className="flex items-start gap-2">
            <Truck className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <p>
              <strong>Lagos Delivery:</strong> 24–48 hours. Orders above <strong>₦40,000</strong> qualify for Free Delivery across Lagos!
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" />
            <p>
              <strong>Hygiene Standard:</strong> Due to health & safety standards, opened personal hygiene items cannot be returned. Defective or incorrect items must be reported within 48 hours of delivery for immediate replacement.
            </p>
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
