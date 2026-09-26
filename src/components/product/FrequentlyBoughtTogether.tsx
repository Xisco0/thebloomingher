'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { Product } from '@/types';
import { formatNaira } from '@/lib/utils/currency';
import { useCart } from '@/context/CartContext';

interface FrequentlyBoughtTogetherProps {
  products: Product[];
}

export function FrequentlyBoughtTogether({ products }: FrequentlyBoughtTogetherProps) {
  const { addItem, openCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>(products.map(p => p.id));
  const [added, setAdded] = useState(false);

  if (products.length < 2) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter(i => i !== id));
      }
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectedProducts = products.filter(p => selectedIds.includes(p.id));
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  const handleAddBundle = () => {
    selectedProducts.forEach(p => addItem(p, 1));
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      openCart();
    }, 1200);
  };

  return (
    <div className="bg-brand-light/30 rounded-3xl p-6 sm:p-8 border border-brand/20 my-10 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-brand" />
        <h3 className="font-display font-semibold text-lg sm:text-xl text-text-main">
          Frequently Bought Together
        </h3>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        {/* Products Visual Row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center lg:justify-start">
          {products.map((prod, idx) => {
            const isSelected = selectedIds.includes(prod.id);
            return (
              <React.Fragment key={prod.id}>
                {idx > 0 && <Plus className="w-4 h-4 text-text-muted flex-shrink-0" />}
                <div
                  onClick={() => toggleSelect(prod.id)}
                  className={`relative cursor-pointer p-2 rounded-2xl bg-surface border-2 transition-all ${
                    isSelected
                      ? 'border-brand shadow-sm scale-100'
                      : 'border-border opacity-50 scale-95'
                  }`}
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-surface-muted mb-2">
                    <Image
                      src={prod.images[0]?.url || ''}
                      alt={prod.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-text-main truncate max-w-[96px]">
                      {prod.name}
                    </p>
                    <p className="text-xs font-bold text-brand">{formatNaira(prod.price)}</p>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Bundle Summary & CTA */}
        <div className="lg:border-l lg:border-brand/20 lg:pl-8 flex flex-col items-center lg:items-start gap-3 w-full lg:w-auto">
          <div className="text-center lg:text-left">
            <span className="text-xs text-text-muted">Total Bundle Price:</span>
            <div className="font-display font-bold text-2xl text-brand">
              {formatNaira(totalPrice)}
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Includes {selectedProducts.length} items
            </span>
          </div>

          <button
            onClick={handleAddBundle}
            className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Bundle Added to Bag!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add Selected ({selectedProducts.length}) to Bag</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
