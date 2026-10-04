'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category');

  const initialCatId = catParam === 'cat-18133' || catParam === 'everyday-essentials' ? 'cat-18133' : undefined;
  const initialCatName = initialCatId ? 'Everyday Essentials' : undefined;

  return (
    <div>
      <ProductForm
        isEdit={false}
        initialProduct={initialCatId ? { category_id: initialCatId, category_name: initialCatName } : undefined}
      />
    </div>
  );
}
