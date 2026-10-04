'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';

export const dynamic = 'force-dynamic';

function NewProductFormContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category');

  const initialCatId =
    catParam === 'cat-18133' || catParam === 'everyday-essentials' ? 'cat-18133' : undefined;
  const initialCatName = initialCatId ? 'Everyday Essentials' : undefined;

  return (
    <ProductForm
      isEdit={false}
      initialProduct={
        initialCatId ? { category_id: initialCatId, category_name: initialCatName } : undefined
      }
    />
  );
}

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-text-muted">
          Loading product form...
        </div>
      }
    >
      <NewProductFormContent />
    </Suspense>
  );
}
