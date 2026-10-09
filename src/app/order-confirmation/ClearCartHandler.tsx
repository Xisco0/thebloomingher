'use client';

import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function ClearCartHandler() {
  const { clearCart, items } = useCart();

  useEffect(() => {
    if (items.length > 0) {
      clearCart();
    }
  }, [items, clearCart]);

  return null;
}
