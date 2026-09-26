'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { Product } from '@/types';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (data.success && data.products) {
          const found = data.products.find((p: Product) => p.id === id);
          setProduct(found || null);
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center text-text-muted">
        Product not found or has been deleted.
      </div>
    );
  }

  return (
    <div>
      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
