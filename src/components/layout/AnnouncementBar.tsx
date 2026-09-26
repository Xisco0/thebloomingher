'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, HelpCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatNaira } from '@/lib/utils/currency';

export function AnnouncementBar() {
  const { amountUntilFreeShipping, hasFreeShipping } = useCart();

  return (
    <div className="bg-brand text-white text-xs py-2 px-4 select-none">
      <div className="w-[85%] max-w-[85%] mx-auto flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 font-medium">
          <Truck className="w-3.5 h-3.5 text-brand-light flex-shrink-0" />
          <span>
            {hasFreeShipping ? (
              <span className="text-white font-semibold">
                🎉 Congratulations! You have unlocked FREE Lagos Delivery!
              </span>
            ) : (
              <span>
                Free delivery on orders above <strong>₦40,000</strong> across Lagos | Add{' '}
                <span className="underline decoration-brand-light font-bold">
                  {formatNaira(amountUntilFreeShipping)}
                </span>{' '}
                more to qualify!
              </span>
            )}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-brand-light">
          <Link href="/contact" className="hover:text-white transition-colors flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Help & Support</span>
          </Link>
          <span className="text-white/40">•</span>
          <span className="font-semibold text-white">NGN (₦)</span>
        </div>
      </div>
    </div>
  );
}
